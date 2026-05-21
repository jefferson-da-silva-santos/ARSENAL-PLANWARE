import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { useDebounce } from '../../hooks/useDebounce'
import { clientesApi } from '../../services/clientesApi'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import ClienteCard from '../../components/domain/ClienteCard/ClienteCard'
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton'
import type { Cliente } from '../../types'
import styles from './Clientes.module.scss'

// ─────────────────────────────────────────────────────────────
//  Formulário
// ─────────────────────────────────────────────────────────────

interface ClienteFormProps {
  initial?: Partial<Cliente>
  onSubmit: (d: Record<string, any>) => Promise<void>
  onClose : () => void
  saving  : boolean
}

function ClienteForm({ initial, onSubmit, onClose, saving }: ClienteFormProps) {
  const [nome,           setNome]           = useState(initial?.nome           ?? '')
  const [telefone,       setTelefone]       = useState(initial?.telefone       ?? '')
  const [email,          setEmail]          = useState(initial?.email          ?? '')
  const [dataNascimento, setDataNascimento] = useState(initial?.dataNascimento ?? '')
  const [observacoes,    setObservacoes]    = useState(initial?.observacoes    ?? '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      nome           : nome.trim(),
      telefone       : telefone.trim()       || undefined,
      email          : email.trim()          || undefined,
      dataNascimento : dataNascimento        || undefined,
      observacoes    : observacoes.trim()    || undefined,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label}>Nome completo <span className={styles.req}>*</span></label>
        <input className={styles.input} value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Ex: Felipe Andrade" required disabled={saving} />
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
            onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" disabled={saving} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Data de nascimento</label>
        <input className={styles.input} type="date" value={dataNascimento}
          onChange={e => setDataNascimento(e.target.value)} disabled={saving} />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Observações</label>
        <textarea className={styles.textarea} value={observacoes}
          onChange={e => setObservacoes(e.target.value)} rows={3}
          placeholder="Preferências, alergias, observações importantes..." disabled={saving} />
      </div>

      <div className={styles.formActions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" icon="bx bx-check" loading={saving}>
          {initial ? 'Salvar' : 'Cadastrar cliente'}
        </Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
//  Página
// ─────────────────────────────────────────────────────────────

export default function Clientes() {
  const navigate = useNavigate()
  const toast    = useToast()

  const [clientes,  setClientes]  = useState<Cliente[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')

  const [modalOpen,  setModalOpen]  = useState(false)
  const [editTarget, setEditTarget] = useState<Cliente | undefined>()
  const [saving,     setSaving]     = useState(false)

  const debounced = useDebounce(search, 350)

  useAOSRefresh(clientes.length)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await clientesApi.list(debounced || undefined)
      setClientes(r.data.data)
    } catch { toast.error('Erro ao carregar clientes') }
    finally  { setLoading(false) }
  }, [debounced, toast])

  useEffect(() => { load() }, [load])

  async function handleSave(data: Record<string, any>) {
    setSaving(true)
    try {
      if (editTarget) {
        await clientesApi.update(editTarget.id, data as any)
        toast.success('Cliente atualizado')
      } else {
        await clientesApi.create(data as any)
        toast.success('Cliente cadastrado!')
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

  const emRisco = clientes.filter(c => {
    if (!c.ultimaVisita) return false
    const dias = Math.floor((Date.now() - new Date(c.ultimaVisita).getTime()) / 86_400_000)
    return dias >= 20
  }).length

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Clientes"
        title="Clientes"
        subtitle={`${clientes.length} cliente${clientes.length !== 1 ? 's' : ''} ${emRisco > 0 ? `· ${emRisco} em risco` : ''}`}
        actions={
          <Button variant="primary" icon="bx bx-user-plus"
            onClick={() => { setEditTarget(undefined); setModalOpen(true) }}>
            Novo cliente
          </Button>
        }
      />

      <div className={styles.body}>
        {/* ── Busca ───────────────────────────────── */}
        <div className={styles.searchWrap}>
          <i className="bx bx-search" aria-hidden="true" />
          <input
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou e-mail..."
            aria-label="Buscar clientes"
          />
          {search && (
            <button className={styles.searchClear} onClick={() => setSearch('')} aria-label="Limpar busca">
              <i className="bx bx-x" />
            </button>
          )}
        </div>

        {/* ── Lista ─────────────────────────────── */}
        {loading ? (
          <div className={styles.list}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : clientes.length === 0 ? (
          <EmptyState
            icon="bx bx-group"
            title={search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            description={search ? 'Tente outro nome ou telefone.' : 'Cadastre o primeiro cliente da barbearia.'}
            action={!search ? {
              label  : 'Cadastrar cliente',
              icon   : 'bx bx-user-plus',
              onClick: () => setModalOpen(true),
            } : undefined}
          />
        ) : (
          <div className={styles.list}>
            {clientes.map((c, i) => (
              <div key={c.id} className={styles.listItem} data-aos="fade-up" data-aos-delay={i * 30}>
                <ClienteCard
                  cliente={c}
                  onClick={() => navigate(`/clientes/${c.id}`)}
                />
                <button
                  className={styles.editBtn}
                  onClick={e => { e.stopPropagation(); setEditTarget(c); setModalOpen(true) }}
                  title="Editar"
                  aria-label={`Editar ${c.nome}`}
                >
                  <i className="bx bx-edit" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(undefined) }}
        title={editTarget ? `Editar — ${editTarget.nome}` : 'Novo cliente'}
        size="md"
      >
        <ClienteForm
          initial={editTarget}
          onSubmit={handleSave}
          onClose={() => { setModalOpen(false); setEditTarget(undefined) }}
          saving={saving}
        />
      </Modal>
    </div>
  )
}