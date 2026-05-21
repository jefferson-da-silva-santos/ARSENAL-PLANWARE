import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { useDebounce } from '../../hooks/useDebounce'
import { fidelidadeApi } from '../../services/fidelidadeApi'
import { clientesApi } from '../../services/clientesApi'
import { ModalConfirm } from '../../components/ui/Modal/Modal'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import StatCard from '../../components/ui/StatCard/StatCard'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { SkeletonStatCard, SkeletonRow } from '../../components/ui/Skeleton/Skeleton'
import { getAvatarGradient, getInitials } from '../../utils/avatarHelper'
import type { Recompensa, Cliente } from '../../types'
import styles from './Fidelidade.module.scss'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────
//  Formulário de recompensa
// ─────────────────────────────────────────────────────────────

interface RecompensaFormProps {
  initial?: Partial<Recompensa>
  onSubmit: (d: Record<string, any>) => Promise<void>
  onClose : () => void
  saving  : boolean
}

function RecompensaForm({ initial, onSubmit, onClose, saving }: RecompensaFormProps) {
  const [nome,             setNome]             = useState(initial?.nome             ?? '')
  const [descricao,        setDescricao]        = useState(initial?.descricao        ?? '')
  const [pontosNecessarios,setPontosNecessarios] = useState(String(initial?.pontosNecessarios ?? ''))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      nome             : nome.trim(),
      descricao        : descricao.trim() || undefined,
      pontosNecessarios: parseInt(pontosNecessarios),
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label}>Nome da recompensa <span className={styles.req}>*</span></label>
        <input className={styles.input} value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Ex: Hidratação grátis" required disabled={saving} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Descrição</label>
        <input className={styles.input} value={descricao} onChange={e => setDescricao(e.target.value)}
          placeholder="Detalhes da recompensa" disabled={saving} />
      </div>
      <div className={styles.field}>
        <label className={styles.label}>Pontos necessários <span className={styles.req}>*</span></label>
        <input className={styles.input} type="number" min="1" value={pontosNecessarios}
          onChange={e => setPontosNecessarios(e.target.value)} placeholder="100" required disabled={saving} />
      </div>
      <div className={styles.formActions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" icon="bx bx-check" loading={saving}>
          {initial ? 'Salvar' : 'Criar recompensa'}
        </Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
//  Modal adicionar pontos
// ─────────────────────────────────────────────────────────────

interface PontosFormProps {
  clientes: Cliente[]
  onSubmit: (clienteId: string, pontos: number, motivo: string) => Promise<void>
  onClose : () => void
  saving  : boolean
}

function PontosForm({ clientes, onSubmit, onClose, saving }: PontosFormProps) {
  const [clienteId, setClienteId] = useState('')
  const [pontos,    setPontos]    = useState('')
  const [motivo,    setMotivo]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(clienteId, parseInt(pontos), motivo)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label}>Cliente <span className={styles.req}>*</span></label>
        <select className={styles.select} value={clienteId}
          onChange={e => setClienteId(e.target.value)} required disabled={saving}>
          <option value="">Selecione o cliente</option>
          {clientes.map(c => (
            <option key={c.id} value={c.id}>
              {c.nome} — {c.pontosFidelidade} pts
            </option>
          ))}
        </select>
      </div>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Pontos a adicionar <span className={styles.req}>*</span></label>
          <input className={styles.input} type="number" min="1" value={pontos}
            onChange={e => setPontos(e.target.value)} placeholder="50" required disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Motivo</label>
          <input className={styles.input} value={motivo} onChange={e => setMotivo(e.target.value)}
            placeholder="Ajuste manual..." disabled={saving} />
        </div>
      </div>
      <div className={styles.formActions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" icon="bx bxs-star" loading={saving}>Adicionar pontos</Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
//  Página
// ─────────────────────────────────────────────────────────────

type Tab = 'recompensas' | 'ranking'

export default function Fidelidade() {
  const toast = useToast()

  const [recompensas, setRecompensas] = useState<Recompensa[]>([])
  const [clientes,    setClientes]    = useState<Cliente[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tab,         setTab]         = useState<Tab>('recompensas')

  // Modal recompensa
  const [recompModal,  setRecompModal]  = useState(false)
  const [editRecomp,   setEditRecomp]   = useState<Recompensa | undefined>()
  const [savingR,      setSavingR]      = useState(false)

  // Modal pontos
  const [pontosModal, setPontosModal] = useState(false)
  const [savingP,     setSavingP]     = useState(false)

  // Resgate
  const [resgateOpen,    setResgateOpen]    = useState(false)
  const [resgateCliente, setResgateCliente] = useState('')
  const [resgateRecomp,  setResgateRecomp]  = useState('')
  const [resgateLoading, setResgateLoading] = useState(false)

  // Busca clientes para ranking
  const [search,    setSearch]    = useState('')
  const debounced = useDebounce(search, 350)

  useAOSRefresh(tab)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [r, c] = await Promise.all([
        fidelidadeApi.listRecompensas(),
        clientesApi.list(),
      ])
      setRecompensas(r.data.data)
      setClientes(c.data.data)
    } catch { toast.error('Erro ao carregar dados') }
    finally  { setLoading(false) }
  }, [toast])

  useEffect(() => { load() }, [])

  async function handleSaveRecomp(data: Record<string, any>) {
    setSavingR(true)
    try {
      if (editRecomp) {
        await fidelidadeApi.updateRecompensa(editRecomp.id, data as any)
        toast.success('Recompensa atualizada')
      } else {
        await fidelidadeApi.createRecompensa(data as any)
        toast.success('Recompensa criada!')
      }
      setRecompModal(false); setEditRecomp(undefined); load()
    } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Erro') }
    finally { setSavingR(false) }
  }

  async function handleAddPontos(clienteId: string, pontos: number, motivo: string) {
    setSavingP(true)
    try {
      await fidelidadeApi.adicionarPontos(clienteId, pontos, motivo || undefined)
      toast.success('Pontos adicionados!')
      setPontosModal(false); load()
    } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Erro') }
    finally { setSavingP(false) }
  }

  async function handleResgate() {
    setResgateLoading(true)
    try {
      const r = await fidelidadeApi.resgatar(resgateCliente, resgateRecomp)
      toast.success(`${r.data.data.recompensa.nome} resgatado! -${r.data.data.pontosUsados} pts`)
      setResgateOpen(false); setResgateCliente(''); setResgateRecomp(''); load()
    } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Erro') }
    finally { setResgateLoading(false) }
  }

  // Ranking de pontos — ordena clientes por pontos
  const ranking = [...clientes]
    .filter(c => c.pontosFidelidade > 0)
    .sort((a, b) => b.pontosFidelidade - a.pontosFidelidade)
    .slice(0, 20)
    .filter(c => !debounced || c.nome.toLowerCase().includes(debounced.toLowerCase()))

  const totalPontos = clientes.reduce((s, c) => s + c.pontosFidelidade, 0)
  const comPontos   = clientes.filter(c => c.pontosFidelidade > 0).length

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Clientes"
        title="Fidelidade"
        subtitle={`${comPontos} clientes com pontos · ${totalPontos} pts no total`}
        actions={
          <div className={styles.headerActions}>
            <Button variant="ghost" size="sm" icon="bx bxs-star"
              onClick={() => setPontosModal(true)}>
              Adicionar pontos
            </Button>
            <Button variant="ghost" size="sm" icon="bx bxs-gift"
              onClick={() => setResgateOpen(true)}>
              Resgatar
            </Button>
            <Button variant="primary" icon="bx bx-plus"
              onClick={() => { setEditRecomp(undefined); setRecompModal(true) }}>
              Nova recompensa
            </Button>
          </div>
        }
      />

      <div className={styles.body}>
        {/* KPI Row */}
        <div className={styles.kpiRow}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
          ) : (
            <>
              <StatCard label="Clientes com pontos" value={comPontos} icon="bx bx-group" aosDelay={0} />
              <StatCard label="Total de pontos" value={totalPontos} icon="bx bxs-star" variant="dark" aosDelay={60} />
              <StatCard label="Recompensas ativas" value={recompensas.filter(r => r.ativa).length} icon="bx bxs-gift" aosDelay={120} />
            </>
          )}
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button className={`${styles.tab} ${tab === 'recompensas' ? styles['tab--active'] : ''}`}
            onClick={() => setTab('recompensas')}>
            <i className="bx bxs-gift" />Recompensas
          </button>
          <button className={`${styles.tab} ${tab === 'ranking' ? styles['tab--active'] : ''}`}
            onClick={() => setTab('ranking')}>
            <i className="bx bx-trophy" />Ranking de pontos
          </button>
        </div>

        {/* Tab: Recompensas */}
        {tab === 'recompensas' && (
          <div className={styles.recompensasGrid}>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
            ) : recompensas.length === 0 ? (
              <EmptyState
                icon="bx bxs-gift"
                title="Nenhuma recompensa criada"
                description="Crie recompensas para engajar seus clientes com pontos."
                action={{ label: 'Criar recompensa', icon: 'bx bx-plus', onClick: () => setRecompModal(true) }}
              />
            ) : (
              recompensas.map((r, i) => (
                <div key={r.id} className={`${styles.recompCard} ${!r.ativa ? styles['recompCard--inativa'] : ''}`}
                  data-aos="fade-up" data-aos-delay={i * 50}>
                  <div className={styles.recompIcon} aria-hidden="true">
                    <i className="bx bxs-gift" />
                  </div>
                  <div className={styles.recompInfo}>
                    <div className={styles.recompNomeRow}>
                      <h3 className={styles.recompNome}>{r.nome}</h3>
                      {!r.ativa && <span className={styles.inativoTag}>Inativa</span>}
                    </div>
                    {r.descricao && <p className={styles.recompDesc}>{r.descricao}</p>}
                  </div>
                  <div className={styles.recompPontos}>
                    <span className={styles.pontosVal}>{r.pontosNecessarios}</span>
                    <span className={styles.pontosLabel}>pontos</span>
                  </div>
                  <div className={styles.recompActions}>
                    <button className={styles.actionBtn}
                      onClick={() => { setEditRecomp(r); setRecompModal(true) }}
                      title="Editar" aria-label={`Editar ${r.nome}`}>
                      <i className="bx bx-edit" />
                    </button>
                    <button className={styles.actionBtn}
                      onClick={async () => {
                        await fidelidadeApi.updateRecompensa(r.id, { ativa: !r.ativa })
                        load()
                      }}
                      title={r.ativa ? 'Desativar' : 'Ativar'}>
                      <i className={`bx ${r.ativa ? 'bx-toggle-right' : 'bx-toggle-left'}`} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab: Ranking */}
        {tab === 'ranking' && (
          <>
            <div className={styles.searchWrap}>
              <i className="bx bx-search" />
              <input className={styles.searchInput} value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar cliente..." />
            </div>

            <div className={styles.rankingCard}>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
              ) : ranking.length === 0 ? (
                <EmptyState icon="bx bxs-star" title="Nenhum cliente com pontos" size="sm" />
              ) : (
                ranking.map((c, i) => {
                  const gradient = getAvatarGradient(c.nome)
                  const initials = getInitials(c.nome)
                  const isTop    = i < 3

                  return (
                    <div key={c.id} className={`${styles.rankItem} ${isTop ? styles['rankItem--top'] : ''}`}
                      data-aos="fade-up" data-aos-delay={i * 30}>
                      <span className={`${styles.rankPos} ${i === 0 ? styles['rankPos--1'] : i === 1 ? styles['rankPos--2'] : i === 2 ? styles['rankPos--3'] : ''}`}>
                        {i === 0 ? <i className="bx bxs-crown" /> : i + 1}
                      </span>

                      <div className={styles.rankAvatar} style={{ background: gradient }} aria-hidden="true">
                        <span>{initials}</span>
                      </div>

                      <div className={styles.rankInfo}>
                        <span className={styles.rankNome}>{c.nome}</span>
                        <span className={styles.rankMeta}>{c.totalVisitas} visita{c.totalVisitas !== 1 ? 's' : ''}</span>
                      </div>

                      <div className={styles.rankPontos}>
                        <span className={styles.rankPontosVal}>{c.pontosFidelidade}</span>
                        <span className={styles.rankPontosLabel}>pts</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>

      {/* Modais */}
      <Modal open={recompModal} onClose={() => { setRecompModal(false); setEditRecomp(undefined) }}
        title={editRecomp ? 'Editar recompensa' : 'Nova recompensa'} size="sm">
        <RecompensaForm initial={editRecomp} onSubmit={handleSaveRecomp}
          onClose={() => { setRecompModal(false); setEditRecomp(undefined) }} saving={savingR} />
      </Modal>

      <Modal open={pontosModal} onClose={() => setPontosModal(false)} title="Adicionar pontos" size="sm">
        <PontosForm clientes={clientes} onSubmit={handleAddPontos}
          onClose={() => setPontosModal(false)} saving={savingP} />
      </Modal>

      <Modal open={resgateOpen} onClose={() => setResgateOpen(false)} title="Resgatar recompensa" size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResgateOpen(false)} disabled={resgateLoading}>Cancelar</Button>
            <Button variant="primary" icon="bx bxs-gift" loading={resgateLoading}
              onClick={handleResgate} disabled={!resgateCliente || !resgateRecomp}>
              Confirmar resgate
            </Button>
          </>
        }>
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Cliente</label>
            <select className={styles.select} value={resgateCliente}
              onChange={e => setResgateCliente(e.target.value)} disabled={resgateLoading}>
              <option value="">Selecione</option>
              {clientes.filter(c => c.pontosFidelidade > 0).map(c => (
                <option key={c.id} value={c.id}>{c.nome} — {c.pontosFidelidade} pts</option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Recompensa</label>
            <select className={styles.select} value={resgateRecomp}
              onChange={e => setResgateRecomp(e.target.value)} disabled={resgateLoading}>
              <option value="">Selecione</option>
              {recompensas.filter(r => r.ativa).map(r => (
                <option key={r.id} value={r.id}>{r.nome} — {r.pontosNecessarios} pts</option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}