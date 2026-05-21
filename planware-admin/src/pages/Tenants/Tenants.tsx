import { useState, useEffect, useCallback } from 'react'
import { tenantsApi } from '@/services/api'
import { notyf } from '@/services/notyf'
import type { Tenant } from '@/types'
import PageHeader from '@/components/PageHeader/PageHeader'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import { StatusBadge } from '@/components/Badge/Badge'
import styles from './Tenants.module.scss'

export default function Tenants() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchTenants = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await tenantsApi.list()
      setTenants(data.data)
    } catch {
      notyf.error('Erro ao carregar tenants')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTenants() }, [fetchTenants])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      await tenantsApi.create(newName.trim())
      notyf.success('Tenant criado com sucesso')
      setCreateOpen(false)
      setNewName('')
      fetchTenants()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Erro ao criar tenant'
      notyf.error(msg)
    } finally {
      setCreating(false)
    }
  }

  async function handleToggle(id: string, active: boolean) {
    setTogglingId(id)
    try {
      await tenantsApi.toggle(id)
      notyf.success(active ? 'Tenant desativado' : 'Tenant ativado')
      fetchTenants()
    } catch {
      notyf.error('Erro ao alterar status')
    } finally {
      setTogglingId(null)
    }
  }

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <PageHeader
        title="Tenants"
        subtitle={`${tenants.length} empresa${tenants.length !== 1 ? 's' : ''} cadastrada${tenants.length !== 1 ? 's' : ''}`}
        actions={
          <Button icon="bx-plus" onClick={() => setCreateOpen(true)}>
            Novo Tenant
          </Button>
        }
      />

      {/* Search */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrap}>
          <i className="bx bx-search" />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nome ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>
              <i className="bx bx-x" />
            </button>
          )}
        </div>
        <span className={styles.count}>
          {filtered.length} de {tenants.length}
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Slug</th>
              <th>Usuários</th>
              <th>Criado em</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className={styles.skeletonRow}>
                  <td colSpan={6}><div className={styles.skeleton} /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.empty}>
                    <i className="bx bx-buildings" />
                    <span>Nenhum tenant encontrado</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((tenant) => (
                <tr key={tenant.id} className={styles.row}>
                  <td>
                    <div className={styles.tenantCell}>
                      <div className={styles.tenantAvatar}>
                        {tenant.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={styles.tenantName}>{tenant.name}</span>
                    </div>
                  </td>
                  <td>
                    <code className={styles.slug}>/{tenant.slug}</code>
                  </td>
                  <td>
                    <span className={styles.userCount}>
                      <i className="bx bx-user" />
                      {tenant._count?.users ?? 0}
                    </span>
                  </td>
                  <td>
                    <span className={styles.date}>
                      {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td>
                    <StatusBadge active={tenant.active} />
                  </td>
                  <td>
                    <Button
                      variant={tenant.active ? 'danger' : 'outline'}
                      size="sm"
                      icon={tenant.active ? 'bx-pause' : 'bx-play'}
                      loading={togglingId === tenant.id}
                      onClick={() => handleToggle(tenant.id, tenant.active)}
                    >
                      {tenant.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal criar tenant */}
      <Modal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setNewName('') }}
        title="Novo Tenant"
        size="sm"
      >
        <form onSubmit={handleCreate} className={styles.createForm}>
          <div className={styles.field}>
            <label className={styles.label}>Nome da empresa</label>
            <input
              className={styles.input}
              placeholder="Ex: Minha Empresa"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              autoFocus
            />
            {newName && (
              <span className={styles.slugPreview}>
                Slug: /{newName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')}
              </span>
            )}
          </div>
          <div className={styles.formActions}>
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={creating}>
              Criar Tenant
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}