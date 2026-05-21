import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { servicosApi } from '../../services/servicosApi'
import { ModalConfirm } from '../../components/ui/Modal/Modal'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { NivelBadge } from '../../components/ui/Badge/Badge'
import { SkeletonStatCard } from '../../components/ui/Skeleton/Skeleton'
import type { Servico } from '../../types'
import styles from './Servicos.module.scss'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

const NIVEIS = ['JUNIOR', 'PLENO', 'SENIOR', 'MASTER'] as const

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─────────────────────────────────────────────────────────────
//  Formulário
// ─────────────────────────────────────────────────────────────

interface ServicoFormProps {
  initial?: Partial<Servico>
  onSubmit: (data: Record<string, any>) => Promise<void>
  onClose : () => void
  saving  : boolean
}

function ServicoForm({ initial, onSubmit, onClose, saving }: ServicoFormProps) {
  const [nome,        setNome]        = useState(initial?.nome        ?? '')
  const [descricao,   setDescricao]   = useState(initial?.descricao   ?? '')
  const [preco,       setPreco]       = useState(String(initial?.preco ?? ''))
  const [duracaoMin,  setDuracaoMin]  = useState(String(initial?.duracaoMin ?? ''))
  const [comissaoPct, setComissaoPct] = useState(String(initial?.comissaoPct ?? '50'))
  const [nivelMinimo, setNivelMinimo] = useState<typeof NIVEIS[number]>(initial?.nivelMinimo ?? 'JUNIOR')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      nome       : nome.trim(),
      descricao  : descricao.trim() || undefined,
      preco      : parseFloat(preco),
      duracaoMin : parseInt(duracaoMin),
      comissaoPct: parseFloat(comissaoPct),
      nivelMinimo,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label}>Nome <span className={styles.req}>*</span></label>
        <input className={styles.input} value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Ex: Corte + Barba" required disabled={saving} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Descrição</label>
        <input className={styles.input} value={descricao} onChange={e => setDescricao(e.target.value)}
          placeholder="Breve descrição do serviço" disabled={saving} />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Preço (R$) <span className={styles.req}>*</span></label>
          <input className={styles.input} type="number" min="0" step="0.50"
            value={preco} onChange={e => setPreco(e.target.value)}
            placeholder="50,00" required disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Duração (min) <span className={styles.req}>*</span></label>
          <input className={styles.input} type="number" min="5" max="480"
            value={duracaoMin} onChange={e => setDuracaoMin(e.target.value)}
            placeholder="30" required disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Comissão (%)</label>
          <input className={styles.input} type="number" min="0" max="100" step="0.5"
            value={comissaoPct} onChange={e => setComissaoPct(e.target.value)}
            placeholder="50" disabled={saving} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Nível mínimo do barbeiro</label>
        <div className={styles.nivelGrid}>
          {NIVEIS.map(n => (
            <button
              key={n}
              type="button"
              className={`${styles.nivelBtn} ${nivelMinimo === n ? styles['nivelBtn--active'] : ''}`}
              onClick={() => setNivelMinimo(n)}
              disabled={saving}
            >
              {n.charAt(0) + n.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.formActions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" icon="bx bx-check" loading={saving}>
          {initial ? 'Salvar' : 'Criar serviço'}
        </Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
//  Card de serviço
// ─────────────────────────────────────────────────────────────

interface ServicoCardProps {
  servico  : Servico
  onEdit   : () => void
  onDelete : () => void
  delay    : number
}

function ServicoCard({ servico: s, onEdit, onDelete, delay }: ServicoCardProps) {
  return (
    <div
      className={`${styles.card} ${!s.ativo ? styles['card--inativo'] : ''}`}
      data-aos="fade-up"
      data-aos-delay={delay}
    >
      {/* Radial decorativo */}
      <div className={styles.cardRadial} aria-hidden="true" />

      <div className={styles.cardInner}>
        <div className={styles.cardTop}>
          <div className={styles.cardIcon} aria-hidden="true">
            <i className="bx bxs-scissors" />
          </div>
          <div className={styles.cardActions}>
            <button className={styles.actionBtn} onClick={onEdit} title="Editar" aria-label={`Editar ${s.nome}`}>
              <i className="bx bx-edit" />
            </button>
            {s.ativo && (
              <button className={`${styles.actionBtn} ${styles['actionBtn--danger']}`}
                onClick={onDelete} title="Desativar" aria-label={`Desativar ${s.nome}`}>
                <i className="bx bx-trash" />
              </button>
            )}
          </div>
        </div>

        <h3 className={styles.cardNome}>{s.nome}</h3>
        {s.descricao && <p className={styles.cardDesc}>{s.descricao}</p>}

        <div className={styles.cardDivider} />

        <div className={styles.cardMeta}>
          <div className={styles.cardMetaItem}>
            <span className={styles.cardMetaLabel}>Preço</span>
            <span className={styles.cardMetaVal}>{fmt(s.preco)}</span>
          </div>
          <div className={styles.cardMetaItem}>
            <span className={styles.cardMetaLabel}>Duração</span>
            <span className={styles.cardMetaVal}>{s.duracaoMin} min</span>
          </div>
          <div className={styles.cardMetaItem}>
            <span className={styles.cardMetaLabel}>Comissão</span>
            <span className={styles.cardMetaVal}>{s.comissaoPct}%</span>
          </div>
        </div>

        <div className={styles.cardFooter}>
          <NivelBadge nivel={s.nivelMinimo} />
          {!s.ativo && (
            <span className={styles.inativoTag}>Inativo</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Página
// ─────────────────────────────────────────────────────────────

export default function Servicos() {
  const toast = useToast()

  const [servicos,  setServicos]  = useState<Servico[]>([])
  const [loading,   setLoading]   = useState(true)
  const [apenasAtivos, setApenasAtivos] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Servico | undefined>()
  const [saving,    setSaving]    = useState(false)

  const [deleteId,  setDeleteId]  = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useAOSRefresh(servicos.length)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await servicosApi.list(apenasAtivos)
      setServicos(r.data.data)
    } catch { toast.error('Erro ao carregar serviços') }
    finally  { setLoading(false) }
  }, [apenasAtivos, toast])

  useEffect(() => { load() }, [load])

  async function handleSave(data: Record<string, any>) {
    setSaving(true)
    try {
      if (editTarget) {
        await servicosApi.update(editTarget.id, data as any)
        toast.success('Serviço atualizado')
      } else {
        await servicosApi.create(data as any)
        toast.success('Serviço criado!')
      }
      setModalOpen(false)
      setEditTarget(undefined)
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      await servicosApi.delete(deleteId)
      toast.success('Serviço desativado')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao desativar')
    } finally {
      setDeleteLoading(false)
      setDeleteOpen(false)
    }
  }

  const totalReceita = servicos
    .filter(s => s.ativo)
    .reduce((acc, s) => acc + s.preco, 0)

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Gestão"
        title="Serviços"
        subtitle={`${servicos.filter(s => s.ativo).length} serviços ativos`}
        actions={
          <Button variant="primary" icon="bx bx-plus"
            onClick={() => { setEditTarget(undefined); setModalOpen(true) }}>
            Novo serviço
          </Button>
        }
      />

      <div className={styles.body}>
        {/* ── Filtro ─────────────────────────────── */}
        <div className={styles.toolbar}>
          <button className={`${styles.chip} ${apenasAtivos ? styles['chip--active'] : ''}`}
            onClick={() => setApenasAtivos(true)}>Ativos</button>
          <button className={`${styles.chip} ${!apenasAtivos ? styles['chip--active'] : ''}`}
            onClick={() => setApenasAtivos(false)}>Todos</button>
        </div>

        {/* ── Grid de serviços ───────────────────── */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        ) : servicos.length === 0 ? (
          <EmptyState
            icon="bx bxs-scissors"
            title="Nenhum serviço cadastrado"
            description="Cadastre cortes, barbas, combos e outros serviços."
            action={{ label: 'Criar serviço', icon: 'bx bx-plus', onClick: () => setModalOpen(true) }}
          />
        ) : (
          <div className={styles.grid}>
            {servicos.map((s, i) => (
              <ServicoCard
                key={s.id}
                servico={s}
                delay={i * 50}
                onEdit={() => { setEditTarget(s); setModalOpen(true) }}
                onDelete={() => { setDeleteId(s.id); setDeleteOpen(true) }}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(undefined) }}
        title={editTarget ? `Editar — ${editTarget.nome}` : 'Novo serviço'}
        size="md"
      >
        <ServicoForm
          initial={editTarget}
          onSubmit={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(undefined) }}
          saving={saving}
        />
      </Modal>

      <ModalConfirm
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Desativar serviço"
        message="Desativar este serviço? Ele não aparecerá mais para novos agendamentos, mas o histórico é preservado."
        confirmLabel="Sim, desativar"
      />
    </div>
  )
}