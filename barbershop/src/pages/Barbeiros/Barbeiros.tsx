import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { useDebounce } from '../../hooks/useDebounce'
import { barbeirosApi } from '../../services/barbeirosApi'
import { ModalConfirm } from '../../components/ui/Modal/Modal'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import BarbeiroCard from '../../components/domain/BarbeiroCard/BarbeiroCard'
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton'
import { NivelBadge } from '../../components/ui/Badge/Badge'
import type { Barbeiro } from '../../types'
import styles from './Barbeiros.module.scss'

// ─────────────────────────────────────────────────────────────
//  Formulário de criação/edição de barbeiro
// ─────────────────────────────────────────────────────────────

const NIVEIS = ['JUNIOR', 'PLENO', 'SENIOR', 'MASTER'] as const

interface BarbeiroFormProps {
  initial?: Partial<Barbeiro>
  onSubmit: (data: Record<string, any>) => Promise<void>
  onClose : () => void
  saving  : boolean
}

function BarbeiroForm({ initial, onSubmit, onClose, saving }: BarbeiroFormProps) {
  const [nome,        setNome]        = useState(initial?.nome        ?? '')
  const [telefone,    setTelefone]    = useState(initial?.telefone    ?? '')
  const [email,       setEmail]       = useState(initial?.email       ?? '')
  const [nivel,       setNivel]       = useState<typeof NIVEIS[number]>(initial?.nivel ?? 'JUNIOR')
  const [comissaoPct, setComissaoPct] = useState(String(initial?.comissaoPct ?? ''))
  const [metaMensal,  setMetaMensal]  = useState(String(initial?.metaMensal  ?? ''))
  const [metaCortes,  setMetaCortes]  = useState(String(initial?.metaCortes  ?? ''))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      nome       : nome.trim(),
      telefone   : telefone.trim()   || undefined,
      email      : email.trim()      || undefined,
      nivel,
      comissaoPct: comissaoPct ? parseFloat(comissaoPct) : undefined,
      metaMensal : metaMensal  ? parseFloat(metaMensal)  : undefined,
      metaCortes : metaCortes  ? parseInt(metaCortes)    : undefined,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Nome <span className={styles.req}>*</span></label>
          <input className={styles.input} value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Nome completo" required disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Nível</label>
          <select className={styles.select} value={nivel}
            onChange={e => setNivel(e.target.value as any)} disabled={saving}>
            {NIVEIS.map(n => <option key={n} value={n}>{n.charAt(0) + n.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Telefone</label>
          <input className={styles.input} value={telefone} onChange={e => setTelefone(e.target.value)}
            placeholder="(11) 9 8421-7733" disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>E-mail</label>
          <input className={styles.input} type="email" value={email}
            onChange={e => setEmail(e.target.value)} placeholder="email@barbearia.com" disabled={saving} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Comissão (%)</label>
          <input className={styles.input} type="number" min="0" max="100" step="0.5"
            value={comissaoPct} onChange={e => setComissaoPct(e.target.value)}
            placeholder="50" disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Meta mensal (R$)</label>
          <input className={styles.input} type="number" min="0" step="100"
            value={metaMensal} onChange={e => setMetaMensal(e.target.value)}
            placeholder="5000" disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Meta de cortes</label>
          <input className={styles.input} type="number" min="0"
            value={metaCortes} onChange={e => setMetaCortes(e.target.value)}
            placeholder="80" disabled={saving} />
        </div>
      </div>

      <div className={styles.formActions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" icon="bx bx-check" loading={saving}>
          {initial ? 'Salvar alterações' : 'Cadastrar barbeiro'}
        </Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────────────────────

export default function Barbeiros() {
  const navigate = useNavigate()
  const toast    = useToast()

  const [barbeiros,     setBarbeiros]     = useState<Barbeiro[]>([])
  const [loading,       setLoading]       = useState(true)
  const [search,        setSearch]        = useState('')
  const [filterAtivos,  setFilterAtivos]  = useState(true)

  // Modal criar/editar
  const [modalOpen,   setModalOpen]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<Barbeiro | undefined>()
  const [saving,      setSaving]      = useState(false)

  // Modal deletar
  const [deleteOpen,  setDeleteOpen]  = useState(false)
  const [deleteId,    setDeleteId]    = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const debouncedSearch = useDebounce(search, 300)

  useAOSRefresh(barbeiros.length)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await barbeirosApi.list(!filterAtivos ? undefined : true)
      setBarbeiros(r.data.data)
    } catch {
      toast.error('Erro ao carregar barbeiros')
    } finally {
      setLoading(false)
    }
  }, [filterAtivos, toast])

  useEffect(() => { load() }, [load])

  // Filtra localmente pela busca
  const filtered = barbeiros.filter(b =>
    b.nome.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (b.telefone ?? '').includes(debouncedSearch)
  )

  async function handleSave(data: Record<string, any>) {
    setSaving(true)
    try {
      if (editTarget) {
        await barbeirosApi.update(editTarget.id, data)
        toast.success('Barbeiro atualizado')
      } else {
        await barbeirosApi.create(data as any)
        toast.success('Barbeiro cadastrado!')
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
      await barbeirosApi.delete(deleteId)
      toast.success('Barbeiro desativado')
      load()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao desativar')
    } finally {
      setDeleteLoading(false)
      setDeleteOpen(false)
    }
  }

  function openEdit(b: Barbeiro) {
    setEditTarget(b)
    setModalOpen(true)
  }

  function openDelete(id: string) {
    setDeleteId(id)
    setDeleteOpen(true)
  }

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Equipe"
        title="Barbeiros"
        subtitle={`${filtered.length} profissional${filtered.length !== 1 ? 'is' : ''}`}
        actions={
          <Button variant="primary" icon="bx bx-plus" onClick={() => { setEditTarget(undefined); setModalOpen(true) }}>
            Novo barbeiro
          </Button>
        }
      />

      <div className={styles.body}>
        {/* ── Filtros ───────────────────────────────── */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <i className="bx bx-search" aria-hidden="true" />
            <input
              className={styles.searchInput}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              aria-label="Buscar barbeiros"
            />
            {search && (
              <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Limpar busca">
                <i className="bx bx-x" />
              </button>
            )}
          </div>

          <div className={styles.toolbarRight}>
            <button
              className={`${styles.chip} ${filterAtivos ? styles['chip--active'] : ''}`}
              onClick={() => setFilterAtivos(true)}
            >
              Ativos
            </button>
            <button
              className={`${styles.chip} ${!filterAtivos ? styles['chip--active'] : ''}`}
              onClick={() => setFilterAtivos(false)}
            >
              Todos
            </button>
          </div>
        </div>

        {/* ── Lista ─────────────────────────────────── */}
        {loading ? (
          <div className={styles.list}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="bx bx-user-x"
            title={search ? 'Nenhum barbeiro encontrado' : 'Nenhum barbeiro cadastrado'}
            description={search ? 'Tente outro nome ou telefone.' : 'Cadastre o primeiro profissional da sua equipe.'}
            action={!search ? { label: 'Cadastrar barbeiro', icon: 'bx bx-plus', onClick: () => setModalOpen(true) } : undefined}
          />
        ) : (
          <div className={styles.list}>
            {filtered.map((b, i) => (
              <div key={b.id} className={styles.listItem} data-aos="fade-up" data-aos-delay={i * 40}>
                <BarbeiroCard
                  barbeiro={b}
                  aosDelay={0}
                />
                <div className={styles.listActions}>
                  <button className={styles.actionBtn} onClick={() => openEdit(b)} title="Editar" aria-label={`Editar ${b.nome}`}>
                    <i className="bx bx-edit" />
                  </button>
                  <button className={styles.actionBtn} onClick={() => navigate(`/barbeiros/${b.id}`)} title="Ver desempenho" aria-label={`Ver desempenho de ${b.nome}`}>
                    <i className="bx bx-bar-chart-alt-2" />
                  </button>
                  {b.ativo && (
                    <button className={`${styles.actionBtn} ${styles['actionBtn--danger']}`} onClick={() => openDelete(b.id)} title="Desativar" aria-label={`Desativar ${b.nome}`}>
                      <i className="bx bx-user-minus" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal criar/editar ────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(undefined) }}
        title={editTarget ? `Editar — ${editTarget.nome}` : 'Novo barbeiro'}
        size="lg"
      >
        <BarbeiroForm
          initial={editTarget}
          onSubmit={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(undefined) }}
          saving={saving}
        />
      </Modal>

      {/* ── Modal confirmar desativação ───────────── */}
      <ModalConfirm
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Desativar barbeiro"
        message="Tem certeza? O barbeiro não poderá mais receber agendamentos. Esta ação pode ser revertida depois."
        confirmLabel="Sim, desativar"
      />
    </div>
  )
}