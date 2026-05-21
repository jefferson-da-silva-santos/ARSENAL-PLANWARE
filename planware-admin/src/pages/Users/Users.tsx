import { useState, useEffect, useCallback } from 'react'
import { usersApi, tenantsApi } from '@/services/api'
import { notyf } from '@/services/notyf'
import type { User, Tenant, System } from '@/types'
import PageHeader from '@/components/PageHeader/PageHeader'
import Button from '@/components/Button/Button'
import Modal from '@/components/Modal/Modal'
import { StatusBadge, RoleBadge, SystemBadge } from '@/components/Badge/Badge'
import styles from './Users.module.scss'

const ALL_SYSTEMS: System[] = [
  'CLIENTPRO', 'STOCKPRO', 'FINVAULT', 'FINFLOW',
  'FINANCEFLOW', 'KANBAN', 'CLINICA', 'ORDEMTECH', 'FIADO',
]

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')

  // Modal criar
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', password: '', tenantId: '', role: 'USER', permissions: [] as System[],
  })
  const [creating, setCreating] = useState(false)

  // Modal reset senha
  const [resetOpen, setResetOpen] = useState(false)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [newPass, setNewPass] = useState('')
  const [resetting, setResetting] = useState(false)

  // Modal detalhe/permissões
  const [detailUser, setDetailUser] = useState<User | null>(null)

  // Toggling
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [u, t] = await Promise.all([
        usersApi.list(tenantFilter || undefined),
        tenantsApi.list(),
      ])
      setUsers(u.data.data)
      setTenants(t.data.data)
    } catch {
      notyf.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }, [tenantFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Criar usuário ─────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { notyf.error('Senha deve ter mínimo 8 caracteres'); return }
    setCreating(true)
    try {
      await usersApi.create({
        tenantId: form.tenantId,
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        permissions: form.permissions,
      })
      notyf.success('Usuário criado com sucesso')
      setCreateOpen(false)
      setForm({ name: '', email: '', password: '', tenantId: '', role: 'USER', permissions: [] })
      fetchAll()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Erro ao criar usuário'
      notyf.error(msg)
    } finally {
      setCreating(false)
    }
  }

  function togglePermission(sys: System) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(sys)
        ? f.permissions.filter((p) => p !== sys)
        : [...f.permissions, sys],
    }))
  }

  // ── Toggle ativação ───────────────────────────────────────
  async function handleToggle(id: string, active: boolean) {
    setTogglingId(id)
    try {
      await usersApi.toggle(id)
      notyf.success(active ? 'Usuário desativado' : 'Usuário ativado')
      fetchAll()
    } catch { notyf.error('Erro ao alterar status') }
    finally { setTogglingId(null) }
  }

  // ── Reset senha ───────────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!resetUser || newPass.length < 8) { notyf.error('Senha deve ter mínimo 8 caracteres'); return }
    setResetting(true)
    try {
      await usersApi.resetPassword(resetUser.id, newPass)
      notyf.success('Senha redefinida com sucesso')
      setResetOpen(false)
      setNewPass('')
    } catch { notyf.error('Erro ao redefinir senha') }
    finally { setResetting(false) }
  }

  // ── Delete ────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm('Tem certeza? O usuário será desativado permanentemente.')) return
    try {
      await usersApi.delete(id)
      notyf.success('Usuário removido')
      fetchAll()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Erro ao remover usuário'
      notyf.error(msg)
    }
  }

  // ── Filtros ───────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    )
  })

  return (
    <div className={styles.page}>
      <PageHeader
        title="Usuários"
        subtitle={`${users.length} usuário${users.length !== 1 ? 's' : ''} cadastrado${users.length !== 1 ? 's' : ''}`}
        actions={
          <Button icon="bx-user-plus" onClick={() => setCreateOpen(true)}>
            Novo Usuário
          </Button>
        }
      />

      {/* Filtros */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <i className="bx bx-search" />
          <input
            className={styles.searchInput}
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearBtn} onClick={() => setSearch('')}>
              <i className="bx bx-x" />
            </button>
          )}
        </div>

        <select
          className={styles.filterSelect}
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
        >
          <option value="">Todos os tenants</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <span className={styles.count}>{filtered.length} de {users.length}</span>
      </div>

      {/* Tabela */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Tenant</th>
              <th>Role</th>
              <th>Sistemas</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className={styles.skeletonRow}>
                  <td colSpan={6}><div className={styles.skeleton} /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className={styles.empty}>
                    <i className="bx bx-group" />
                    <span>Nenhum usuário encontrado</span>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className={styles.row}>
                  <td>
                    <div className={styles.userCell}>
                      <div className={styles.userAvatar}>{u.name.charAt(0).toUpperCase()}</div>
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{u.name}</span>
                        <span className={styles.userEmail}>{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.tenantBadge}>
                      {u.tenant?.name ?? '—'}
                    </span>
                  </td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <div className={styles.systemsList}>
                      {u.permissions.filter((p) => p.granted).slice(0, 3).map((p) => (
                        <SystemBadge key={p.system} system={p.system} />
                      ))}
                      {u.permissions.filter((p) => p.granted).length > 3 && (
                        <span className={styles.moreCount}>
                          +{u.permissions.filter((p) => p.granted).length - 3}
                        </span>
                      )}
                      {u.permissions.filter((p) => p.granted).length === 0 && (
                        <span className={styles.noSystems}>Nenhum</span>
                      )}
                    </div>
                  </td>
                  <td><StatusBadge active={u.active} /></td>
                  <td>
                    <div className={styles.actions}>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="bx-detail"
                        title="Ver detalhes"
                        onClick={() => setDetailUser(u)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="bx-key"
                        title="Redefinir senha"
                        onClick={() => { setResetUser(u); setResetOpen(true) }}
                      />
                      <Button
                        variant={u.active ? 'danger' : 'outline'}
                        size="sm"
                        icon={u.active ? 'bx-pause' : 'bx-play'}
                        loading={togglingId === u.id}
                        onClick={() => handleToggle(u.id, u.active)}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        icon="bx-trash"
                        title="Remover usuário"
                        onClick={() => handleDelete(u.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal criar usuário */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Novo Usuário" size="lg">
        <form onSubmit={handleCreate} className={styles.createForm}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Nome completo</label>
              <input className={styles.input} placeholder="João Silva" required
                value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>E-mail</label>
              <input className={styles.input} type="email" placeholder="joao@empresa.com" required
                value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Senha</label>
              <input className={styles.input} type="password" placeholder="Mínimo 8 caracteres" required
                value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Tenant</label>
              <select className={styles.select} required
                value={form.tenantId} onChange={(e) => setForm((f) => ({ ...f, tenantId: e.target.value }))}>
                <option value="">Selecione um tenant</option>
                {tenants.filter((t) => t.active).map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Role</label>
              <select className={styles.select}
                value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="USER">Usuário</option>
                <option value="SUPERADMIN">Superadmin</option>
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Sistemas liberados</label>
            <div className={styles.systemsGrid}>
              {ALL_SYSTEMS.map((sys) => (
                <button
                  key={sys}
                  type="button"
                  className={`${styles.sysToggle} ${form.permissions.includes(sys) ? styles.sysActive : ''}`}
                  onClick={() => togglePermission(sys)}
                >
                  <i className={`bx ${form.permissions.includes(sys) ? 'bx-check-circle' : 'bx-circle'}`} />
                  {sys}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.formActions}>
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={creating}>Criar Usuário</Button>
          </div>
        </form>
      </Modal>

      {/* Modal reset senha */}
      <Modal open={resetOpen} onClose={() => { setResetOpen(false); setNewPass('') }}
        title={`Redefinir senha — ${resetUser?.name}`} size="sm">
        <form onSubmit={handleResetPassword} className={styles.createForm}>
          <div className={styles.field}>
            <label className={styles.label}>Nova senha</label>
            <input className={styles.input} type="password" placeholder="Mínimo 8 caracteres"
              value={newPass} onChange={(e) => setNewPass(e.target.value)} required autoFocus />
          </div>
          <div className={styles.formActions}>
            <Button variant="ghost" type="button" onClick={() => setResetOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={resetting}>Salvar Senha</Button>
          </div>
        </form>
      </Modal>

      {/* Modal detalhe */}
      <Modal open={!!detailUser} onClose={() => setDetailUser(null)}
        title={`Detalhes — ${detailUser?.name}`} size="md">
        {detailUser && (
          <div className={styles.detailBody}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>E-mail</span>
              <span className={styles.detailValue}>{detailUser.email}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Tenant</span>
              <span className={styles.detailValue}>{detailUser.tenant?.name ?? '—'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Role</span>
              <RoleBadge role={detailUser.role} />
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Status</span>
              <StatusBadge active={detailUser.active} />
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Criado em</span>
              <span className={styles.detailValue}>
                {new Date(detailUser.createdAt).toLocaleString('pt-BR')}
              </span>
            </div>
            <div>
              <span className={styles.detailLabel}>Sistemas</span>
              <div className={styles.systemsList} style={{ marginTop: 8 }}>
                {detailUser.permissions.filter((p) => p.granted).length > 0
                  ? detailUser.permissions.filter((p) => p.granted).map((p) => (
                    <SystemBadge key={p.system} system={p.system} />
                  ))
                  : <span className={styles.noSystems}>Nenhum sistema liberado</span>
                }
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}