import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '../../hooks/useToast'
import { filaApi } from '../../services/filaApi'
import { clientesApi } from '../../services/clientesApi'
import { servicosApi } from '../../services/servicosApi'
import { barbeirosApi } from '../../services/barbeirosApi'
import { configApi } from '../../services/configApi'
import { ModalConfirm } from '../../components/ui/Modal/Modal'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import StatCard from '../../components/ui/StatCard/StatCard'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import FilaItem from '../../components/domain/FilaItem/FilaItem'
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton'
import type { FilaEntry, Cliente, Servico, Barbeiro, BarberConfig } from '../../types'
import styles from './Fila.module.scss'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function calcTempoEstimado(fila: FilaEntry[], posicao: number, duracaoMedia: number): number {
  const ativos = fila.filter(f => ['AGUARDANDO', 'CHAMADO'].includes(f.status))
  const antes  = ativos.filter(f => f.posicao < posicao).length
  return antes * duracaoMedia
}

// ─────────────────────────────────────────────────────────────
//  Formulário de entrada na fila
// ─────────────────────────────────────────────────────────────

interface EntrarFilaFormProps {
  clientes : Cliente[]
  servicos : Servico[]
  barbeiros: Barbeiro[]
  onSubmit : (d: Record<string, any>) => Promise<void>
  onClose  : () => void
  saving   : boolean
}

function EntrarFilaForm({ clientes, servicos, barbeiros, onSubmit, onClose, saving }: EntrarFilaFormProps) {
  const [clienteId,   setClienteId]   = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [telefone,    setTelefone]    = useState('')
  const [servicoId,   setServicoId]   = useState('')
  const [barbeiroId,  setBarbeiroId]  = useState('')
  const [modoAvulso,  setModoAvulso]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId && !nomeCliente.trim()) return
    await onSubmit({
      clienteId  : !modoAvulso ? clienteId  || undefined : undefined,
      nomeCliente: modoAvulso  ? nomeCliente.trim() || undefined : undefined,
      telefone   : modoAvulso  ? telefone.trim()    || undefined : undefined,
      servicoId  : servicoId   || undefined,
      barbeiroId : barbeiroId  || undefined,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {/* Toggle cadastrado / avulso */}
      <div className={styles.modoToggle}>
        <button type="button"
          className={`${styles.modoBtn} ${!modoAvulso ? styles['modoBtn--active'] : ''}`}
          onClick={() => setModoAvulso(false)}>
          <i className="bx bx-user-check" />Cliente cadastrado
        </button>
        <button type="button"
          className={`${styles.modoBtn} ${modoAvulso ? styles['modoBtn--active'] : ''}`}
          onClick={() => setModoAvulso(true)}>
          <i className="bx bx-user-plus" />Cliente eventual
        </button>
      </div>

      {!modoAvulso ? (
        <div className={styles.field}>
          <label className={styles.label}>Cliente <span className={styles.req}>*</span></label>
          <select className={styles.select} value={clienteId}
            onChange={e => setClienteId(e.target.value)} required disabled={saving}>
            <option value="">Selecione o cliente</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}{c.telefone ? ` — ${c.telefone}` : ''}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Nome <span className={styles.req}>*</span></label>
            <input className={styles.input} value={nomeCliente}
              onChange={e => setNomeCliente(e.target.value)}
              placeholder="Nome do cliente" required disabled={saving} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Telefone</label>
            <input className={styles.input} value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="(11) 9..." disabled={saving} />
          </div>
        </div>
      )}

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Serviço</label>
          <select className={styles.select} value={servicoId}
            onChange={e => setServicoId(e.target.value)} disabled={saving}>
            <option value="">Qualquer serviço</option>
            {servicos.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Barbeiro preferido</label>
          <select className={styles.select} value={barbeiroId}
            onChange={e => setBarbeiroId(e.target.value)} disabled={saving}>
            <option value="">Primeiro disponível</option>
            {barbeiros.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.formActions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" icon="bx bx-log-in" loading={saving}>
          Entrar na fila
        </Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
//  Página
// ─────────────────────────────────────────────────────────────

const POLL_INTERVAL = 15_000 // 15s — atualiza automaticamente

export default function Fila() {
  const toast = useToast()

  const [fila,       setFila]       = useState<FilaEntry[]>([])
  const [clientes,   setClientes]   = useState<Cliente[]>([])
  const [servicos,   setServicos]   = useState<Servico[]>([])
  const [barbeiros,  setBarbeiros]  = useState<Barbeiro[]>([])
  const [config,     setConfig]     = useState<BarberConfig | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)

  const [removeId,      setRemoveId]      = useState('')
  const [removeOpen,    setRemoveOpen]    = useState(false)
  const [removeLoading, setRemoveLoading] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval>>()

  // ── Carrega a fila ────────────────────────────────────────
  const loadFila = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const r = await filaApi.list()
      setFila(r.data.data)
    } catch { if (!silent) toast.error('Erro ao carregar fila') }
    finally { setLoading(false); setRefreshing(false) }
  }, [toast])

  // ── Carrega dados estáticos ───────────────────────────────
  useEffect(() => {
    loadFila()
    Promise.allSettled([
      clientesApi.list(),
      servicosApi.list(true),
      barbeirosApi.list(true),
      configApi.get(),
    ]).then(([c, s, b, cfg]) => {
      if (c.status   === 'fulfilled') setClientes(c.value.data.data)
      if (s.status   === 'fulfilled') setServicos(s.value.data.data)
      if (b.status   === 'fulfilled') setBarbeiros(b.value.data.data)
      if (cfg.status === 'fulfilled') setConfig(cfg.value.data.data)
    })
  }, [loadFila])

  // ── Polling automático ────────────────────────────────────
  useEffect(() => {
    pollRef.current = setInterval(() => loadFila(true), POLL_INTERVAL)
    return () => clearInterval(pollRef.current)
  }, [loadFila])

  // ── Ações ─────────────────────────────────────────────────
  async function handleEntrar(data: Record<string, any>) {
    setSaving(true)
    try {
      await filaApi.entrar(data as any)
      toast.success('Cliente adicionado à fila!')
      setModalOpen(false)
      loadFila()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao entrar na fila')
    } finally { setSaving(false) }
  }

  async function handleChamar(id: string) {
    try {
      const r = await filaApi.chamarProximo()
      toast.success(`Chamando: ${r.data.data.nomeCliente}`)
      loadFila()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao chamar próximo')
    }
  }

  async function handleRemover() {
    setRemoveLoading(true)
    try {
      await filaApi.remover(removeId)
      toast.success('Cliente removido da fila')
      loadFila()
    } catch { toast.error('Erro ao remover') }
    finally { setRemoveLoading(false); setRemoveOpen(false) }
  }

  // ── Computed ──────────────────────────────────────────────
  const aguardando     = fila.filter(f => f.status === 'AGUARDANDO')
  const emAtendimento  = fila.filter(f => f.status === 'EM_ATENDIMENTO')
  const chamados       = fila.filter(f => f.status === 'CHAMADO')
  const duracaoMedia   = 30 // fallback — idealmente vem do serviço

  const filaAtiva = !config?.modoFila

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Operação"
        title="Fila presencial"
        subtitle={config?.modoFila
          ? `${aguardando.length} aguardando · atualiza a cada 15s`
          : 'Modo fila desativado nas configurações'}
        actions={
          <div className={styles.headerActions}>
            <Button variant="ghost" size="sm" icon="bx bx-refresh"
              loading={refreshing} onClick={() => loadFila(true)}>
              Atualizar
            </Button>
            {config?.modoFila && (
              <>
                <Button variant="dark" size="sm" icon="bx bx-bell"
                  onClick={() => filaApi.chamarProximo()
                    .then(r => { toast.success(`Chamando: ${r.data.data.nomeCliente}`); loadFila() })
                    .catch(err => toast.error(err?.response?.data?.error ?? 'Fila vazia'))
                  }
                  disabled={aguardando.length === 0}
                >
                  Chamar próximo
                </Button>
                <Button variant="primary" icon="bx bx-log-in"
                  onClick={() => setModalOpen(true)}>
                  Entrar na fila
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className={styles.body}>
        {/* ── Aviso de modo fila desativado ─────── */}
        {!config?.modoFila && !loading && (
          <div className={styles.modoOff}>
            <i className="bx bx-info-circle" aria-hidden="true" />
            <div>
              <strong>Modo fila desativado</strong>
              <span>Ative o modo fila nas configurações da barbearia para usar esta funcionalidade.</span>
            </div>
          </div>
        )}

        {/* ── KPI Row ───────────────────────────── */}
        {config?.modoFila && (
          <div className={styles.kpiRow}>
            <StatCard
              label="Aguardando"
              value={aguardando.length}
              icon="bx bx-time"
              variant={aguardando.length > 5 ? 'danger' : 'light'}
              sub={aguardando.length > 0 ? `~${aguardando.length * duracaoMedia} min de espera` : 'Fila tranquila'}
              aosDelay={0}
            />
            <StatCard
              label="Em atendimento"
              value={emAtendimento.length}
              icon="bx bxs-scissors"
              variant="dark"
              aosDelay={60}
            />
            <StatCard
              label="Chamados"
              value={chamados.length}
              icon="bx bx-bell"
              variant={chamados.length > 0 ? 'orange' : 'light'}
              aosDelay={120}
            />
          </div>
        )}

        {/* ── Fila ──────────────────────────────── */}
        {config?.modoFila && (
          <div className={styles.filaCard}>
            {/* Em atendimento */}
            {emAtendimento.length > 0 && (
              <div className={styles.secao}>
                <div className={styles.secaoHeader}>
                  <span className={styles.secaoLabel}>
                    <span className={styles.liveDot} aria-hidden="true" />
                    Em atendimento
                  </span>
                </div>
                {emAtendimento.map(entry => (
                  <FilaItem
                    key={entry.id}
                    entry={entry}
                    onRemover={id => { setRemoveId(id); setRemoveOpen(true) }}
                  />
                ))}
              </div>
            )}

            {/* Chamados */}
            {chamados.length > 0 && (
              <div className={styles.secao}>
                <div className={styles.secaoHeader}>
                  <span className={styles.secaoLabel}>Chamados</span>
                </div>
                {chamados.map(entry => (
                  <FilaItem
                    key={entry.id}
                    entry={entry}
                    onRemover={id => { setRemoveId(id); setRemoveOpen(true) }}
                  />
                ))}
              </div>
            )}

            {/* Aguardando */}
            <div className={styles.secao}>
              <div className={styles.secaoHeader}>
                <span className={styles.secaoLabel}>Aguardando</span>
                {aguardando.length > 0 && (
                  <span className={styles.secaoBadge}>{aguardando.length}</span>
                )}
              </div>

              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              ) : aguardando.length === 0 ? (
                <EmptyState
                  icon="bx bx-group"
                  title="Fila vazia"
                  description="Nenhum cliente aguardando no momento."
                  size="sm"
                  action={{
                    label  : 'Adicionar à fila',
                    icon   : 'bx bx-log-in',
                    onClick: () => setModalOpen(true),
                  }}
                />
              ) : (
                aguardando.map((entry, i) => (
                  <FilaItem
                    key={entry.id}
                    entry={entry}
                    onChamar={id => filaApi.chamarProximo()
                      .then(r => { toast.success(`Chamando: ${r.data.data.nomeCliente}`); loadFila() })
                      .catch(err => toast.error(err?.response?.data?.error ?? 'Erro'))
                    }
                    onRemover={id => { setRemoveId(id); setRemoveOpen(true) }}
                    tempoEstimado={calcTempoEstimado(fila, entry.posicao, duracaoMedia)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal entrar na fila ──────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Entrar na fila"
        size="md"
      >
        <EntrarFilaForm
          clientes={clientes}
          servicos={servicos}
          barbeiros={barbeiros}
          onSubmit={handleEntrar}
          onClose={() => setModalOpen(false)}
          saving={saving}
        />
      </Modal>

      {/* ── Confirm remover ───────────────────── */}
      <ModalConfirm
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={handleRemover}
        loading={removeLoading}
        title="Remover da fila"
        message="Remover este cliente da fila? Será registrado como desistência."
        confirmLabel="Sim, remover"
      />
    </div>
  )
}