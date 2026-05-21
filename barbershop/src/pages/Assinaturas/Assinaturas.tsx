import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { assinaturaApi } from '../../services/assinaturaApi'
import { clientesApi } from '../../services/clientesApi'
import { servicosApi } from '../../services/servicosApi'
import { ModalConfirm } from '../../components/ui/Modal/Modal'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import StatCard from '../../components/ui/StatCard/StatCard'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { SkeletonStatCard, SkeletonCard } from '../../components/ui/Skeleton/Skeleton'
import { AssinaturaStatusBadge } from '../../components/ui/Badge/Badge'
import { getAvatarGradient, getInitials } from '../../components/domain/avatarHelper'
import type { Assinatura, Cliente, Servico } from '../../types'
import styles from './Assinaturas.module.scss'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function diasParaRenovar(renovaEm: string): number {
  return Math.ceil((new Date(renovaEm).getTime() - Date.now()) / 86_400_000)
}

// ─────────────────────────────────────────────────────────────
//  Formulário
// ─────────────────────────────────────────────────────────────

interface AssinaturaFormProps {
  clientes : Cliente[]
  servicos : Servico[]
  onSubmit : (d: Record<string, any>) => Promise<void>
  onClose  : () => void
  saving   : boolean
}

function AssinaturaForm({ clientes, servicos, onSubmit, onClose, saving }: AssinaturaFormProps) {
  const [clienteId,        setClienteId]        = useState('')
  const [nome,             setNome]             = useState('')
  const [creditosTotal,    setCreditosTotal]    = useState('4')
  const [valorMensal,      setValorMensal]      = useState('')
  const [servicosSel,      setServicosSel]      = useState<string[]>([])
  const [renovaEm,         setRenovaEm]         = useState('')
  const [observacoes,      setObservacoes]      = useState('')

  function toggleServico(id: string) {
    setServicosSel(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      clienteId,
      nome              : nome.trim(),
      creditosTotal     : parseInt(creditosTotal),
      valorMensal       : parseFloat(valorMensal),
      servicosIncluidos : servicosSel,
      renovaEm,
      observacoes       : observacoes.trim() || undefined,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label}>Cliente <span className={styles.req}>*</span></label>
        <select className={styles.select} value={clienteId}
          onChange={e => setClienteId(e.target.value)} required disabled={saving}>
          <option value="">Selecione o cliente</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Nome do plano <span className={styles.req}>*</span></label>
        <input className={styles.input} value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Ex: Plano Mensal — 4 Cortes" required disabled={saving} />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Créditos <span className={styles.req}>*</span></label>
          <input className={styles.input} type="number" min="1" value={creditosTotal}
            onChange={e => setCreditosTotal(e.target.value)} required disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Valor mensal (R$) <span className={styles.req}>*</span></label>
          <input className={styles.input} type="number" min="0" step="0.01"
            value={valorMensal} onChange={e => setValorMensal(e.target.value)}
            placeholder="149,00" required disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Renova em <span className={styles.req}>*</span></label>
          <input className={styles.input} type="date" value={renovaEm}
            onChange={e => setRenovaEm(e.target.value)} required disabled={saving} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Serviços incluídos</label>
        <p className={styles.fieldHint}>Deixe vazio para incluir todos os serviços.</p>
        <div className={styles.servicosGrid}>
          {servicos.map(s => (
            <button key={s.id} type="button"
              className={`${styles.servicoBtn} ${servicosSel.includes(s.id) ? styles['servicoBtn--active'] : ''}`}
              onClick={() => toggleServico(s.id)} disabled={saving}>
              {s.nome}
              <span>{fmt(s.preco)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Observações</label>
        <textarea className={styles.textarea} value={observacoes}
          onChange={e => setObservacoes(e.target.value)} rows={2} disabled={saving} />
      </div>

      <div className={styles.formActions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" icon="bx bx-check" loading={saving}>Criar assinatura</Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
//  Card de assinatura
// ─────────────────────────────────────────────────────────────

interface AssinaturaCardProps {
  assinatura : Assinatura
  onUsarCredito: () => void
  onRenovar    : () => void
  onCancelar   : () => void
  delay        : number
}

function AssinaturaCard({ assinatura: a, onUsarCredito, onRenovar, onCancelar, delay }: AssinaturaCardProps) {
  const gradient = a.cliente ? getAvatarGradient(a.cliente.nome) : '#8A6034'
  const initials = a.cliente ? getInitials(a.cliente.nome) : '?'
  const dias     = diasParaRenovar(a.renovaEm)
  const pct      = Math.round((a.creditosRestantes / a.creditosTotal) * 100)
  const vencendo = dias <= 7 && a.status === 'ATIVA'

  return (
    <div
      className={`${styles.assinaturaCard} ${a.status !== 'ATIVA' ? styles['assinaturaCard--inativa'] : ''}`}
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      {/* Cabeçalho */}
      <div className={styles.assinaturaHead}>
        <div className={styles.assinaturaAvatar} style={{ background: gradient }} aria-hidden="true">
          <span>{initials}</span>
        </div>
        <div className={styles.assinaturaInfo}>
          <span className={styles.assinaturaCliente}>{a.cliente?.nome ?? '—'}</span>
          <span className={styles.assinaturaNome}>{a.nome}</span>
        </div>
        <AssinaturaStatusBadge status={a.status} />
      </div>

      {/* Créditos */}
      <div className={styles.creditos}>
        <div className={styles.creditosHeader}>
          <span className={styles.creditosLabel}>Créditos restantes</span>
          <span className={styles.creditosVal}>
            <b>{a.creditosRestantes}</b> / {a.creditosTotal}
          </span>
        </div>
        <div className={styles.creditosBar}>
          <div
            className={styles.creditosFill}
            style={{
              width: `${pct}%`,
              background: pct <= 25 ? '#C13838' : pct <= 50 ? '#C58524' : '#2D7A4E',
            }}
          />
        </div>
      </div>

      {/* Renovação */}
      <div className={styles.assinaturaRenova}>
        <span className={`${styles.renovaLabel} ${vencendo ? styles.renovaLabelWarn : ''}`}>
          {vencendo && <i className="bx bx-error" />}
          Renova em {fmtDate(a.renovaEm)}
          {vencendo && ` · ${dias} dia${dias !== 1 ? 's' : ''}`}
        </span>
        <span className={styles.renovaValor}>{fmt(a.valorMensal)}/mês</span>
      </div>

      {/* Ações */}
      {a.status === 'ATIVA' && (
        <div className={styles.assinaturaActions}>
          <Button variant="ghost" size="sm" icon="bx bx-minus-circle"
            onClick={onUsarCredito} disabled={a.creditosRestantes === 0}>
            Usar crédito
          </Button>
          <Button variant="soft" size="sm" icon="bx bx-refresh" onClick={onRenovar}>
            Renovar
          </Button>
          <Button variant="danger" size="sm" icon="bx bx-x-circle" onClick={onCancelar}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Página
// ─────────────────────────────────────────────────────────────

type FiltroStatus = '' | 'ATIVA' | 'VENCIDA' | 'CANCELADA' | 'SUSPENSA'

export default function Assinaturas() {
  const toast = useToast()

  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [clientes,    setClientes]    = useState<Cliente[]>([])
  const [servicos,    setServicos]    = useState<Servico[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filtro,      setFiltro]      = useState<FiltroStatus>('')

  const [modalOpen, setModalOpen] = useState(false)
  const [saving,    setSaving]    = useState(false)

  const [confirmOpen,    setConfirmOpen]    = useState(false)
  const [confirmAction,  setConfirmAction]  = useState<'cancelar'|'renovar'|'usar'>('cancelar')
  const [confirmId,      setConfirmId]      = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)

  useAOSRefresh(assinaturas.length)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await assinaturaApi.list(filtro || undefined)
      setAssinaturas(r.data.data)
    } catch { toast.error('Erro ao carregar assinaturas') }
    finally  { setLoading(false) }
  }, [filtro, toast])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    Promise.allSettled([clientesApi.list(), servicosApi.list(true)]).then(([c, s]) => {
      if (c.status === 'fulfilled') setClientes(c.value.data.data)
      if (s.status === 'fulfilled') setServicos(s.value.data.data)
    })
  }, [])

  async function handleCriar(data: Record<string, any>) {
    setSaving(true)
    try {
      await assinaturaApi.create(data as any)
      toast.success('Assinatura criada!')
      setModalOpen(false); load()
    } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Erro ao criar') }
    finally { setSaving(false) }
  }

  async function handleConfirm() {
    setConfirmLoading(true)
    try {
      if (confirmAction === 'cancelar') {
        await assinaturaApi.cancelar(confirmId)
        toast.success('Assinatura cancelada')
      } else if (confirmAction === 'renovar') {
        await assinaturaApi.renovar(confirmId)
        toast.success('Assinatura renovada!')
      } else {
        await assinaturaApi.usarCredito(confirmId)
        toast.success('Crédito utilizado')
      }
      load()
    } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Erro') }
    finally { setConfirmLoading(false); setConfirmOpen(false) }
  }

  function openConfirm(id: string, action: typeof confirmAction) {
    setConfirmId(id); setConfirmAction(action); setConfirmOpen(true)
  }

  const ativas    = assinaturas.filter(a => a.status === 'ATIVA').length
  const vencendo  = assinaturas.filter(a => a.status === 'ATIVA' && diasParaRenovar(a.renovaEm) <= 7).length
  const receita   = assinaturas.filter(a => a.status === 'ATIVA').reduce((s, a) => s + a.valorMensal, 0)

  const FILTROS: { value: FiltroStatus; label: string }[] = [
    { value: '',          label: 'Todas'     },
    { value: 'ATIVA',     label: 'Ativas'    },
    { value: 'VENCIDA',   label: 'Vencidas'  },
    { value: 'CANCELADA', label: 'Canceladas'},
  ]

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Clientes"
        title="Assinaturas"
        subtitle={`${ativas} ativas · ${fmt(receita)}/mês`}
        actions={
          <Button variant="primary" icon="bx bx-plus" onClick={() => setModalOpen(true)}>
            Nova assinatura
          </Button>
        }
      />

      <div className={styles.body}>
        {/* KPI Row */}
        <div className={styles.kpiRow}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
          ) : (
            <>
              <StatCard label="Assinaturas ativas" value={ativas} icon="bx bx-repeat" variant="dark" aosDelay={0} />
              <StatCard label="Receita recorrente" value={fmt(receita)} icon="bx bx-wallet-alt" aosDelay={60} />
              <StatCard
                label="Vencem em 7 dias"
                value={vencendo}
                icon="bx bx-time"
                variant={vencendo > 0 ? 'danger' : 'light'}
                sub={vencendo > 0 ? 'requerem renovação' : 'Tudo em dia'}
                aosDelay={120}
              />
            </>
          )}
        </div>

        {/* Filtros */}
        <div className={styles.toolbar}>
          {FILTROS.map(f => (
            <button key={f.value}
              className={`${styles.chip} ${filtro === f.value ? styles['chip--active'] : ''}`}
              onClick={() => setFiltro(f.value)}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : assinaturas.length === 0 ? (
          <EmptyState
            icon="bx bx-repeat"
            title="Nenhuma assinatura encontrada"
            description="Crie planos recorrentes para seus clientes mais fiéis."
            action={{ label: 'Nova assinatura', icon: 'bx bx-plus', onClick: () => setModalOpen(true) }}
          />
        ) : (
          <div className={styles.grid}>
            {assinaturas.map((a, i) => (
              <AssinaturaCard
                key={a.id}
                assinatura={a}
                delay={i * 50}
                onUsarCredito={() => openConfirm(a.id, 'usar')}
                onRenovar={() => openConfirm(a.id, 'renovar')}
                onCancelar={() => openConfirm(a.id, 'cancelar')}
              />
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova assinatura" size="lg">
        <AssinaturaForm
          clientes={clientes} servicos={servicos}
          onSubmit={handleCriar} onClose={() => setModalOpen(false)} saving={saving}
        />
      </Modal>

      <ModalConfirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={confirmLoading}
        title={confirmAction === 'cancelar' ? 'Cancelar assinatura' : confirmAction === 'renovar' ? 'Renovar assinatura' : 'Usar crédito'}
        message={
          confirmAction === 'cancelar' ? 'Tem certeza? A assinatura será cancelada e os créditos restantes perdidos.' :
          confirmAction === 'renovar'  ? 'Renovar a assinatura? Os créditos serão repostos e a data de renovação atualizada.' :
          'Registrar o uso de um crédito desta assinatura?'
        }
        confirmLabel={confirmAction === 'cancelar' ? 'Cancelar assinatura' : confirmAction === 'renovar' ? 'Renovar' : 'Usar crédito'}
      />
    </div>
  )
}