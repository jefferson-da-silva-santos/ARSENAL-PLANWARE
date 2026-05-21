import { useState, useEffect, useCallback } from 'react'
import { usersApi, permissionsApi, tenantsApi } from '@/services/api'
import { notyf } from '@/services/notyf'
import type { User, Tenant, System } from '@/types'
import PageHeader from '@/components/PageHeader/PageHeader'
import Button from '@/components/Button/Button'
import { SystemBadge, StatusBadge } from '@/components/Badge/Badge'
import styles from './Permissions.module.scss'

const ALL_SYSTEMS: System[] = [
  'CLIENTPRO', 'STOCKPRO', 'FINVAULT', 'FINFLOW',
  'FINANCEFLOW', 'KANBAN', 'CLINICA', 'ORDEMTECH', 'FIADO',
]

const SYSTEM_LABELS: Record<System, string> = {
  CLIENTPRO: 'CRM e Clientes',
  STOCKPRO: 'Estoque',
  FINVAULT: 'Financeiro Padrão',
  FINFLOW: 'Financeiro 50/30/20',
  FINANCEFLOW: 'Financeiro Personalizável',
  KANBAN: 'Kanban',
  CLINICA: 'Clínica',
  ORDEMTECH: 'Ordem de Serviço',
  FIADO: 'Contas a Receber',
}

export default function Permissions() {
  const [users, setUsers] = useState<User[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selected, setSelected] = useState<User | null>(null)
  const [perms, setPerms] = useState<System[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [u, t] = await Promise.all([
        usersApi.list(tenantFilter || undefined),
        tenantsApi.list(),
      ])
      setUsers(u.data.data)
      setTenants(t.data.data)
    } catch { notyf.error('Erro ao carregar dados') }
    finally { setLoading(false) }
  }, [tenantFilter])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function selectUser(user: User) {
    setSelected(user)
    try {
      const { data } = await permissionsApi.get(user.id)
      setPerms(data.data.filter((p) => p.granted).map((p) => p.system))
    } catch { notyf.error('Erro ao carregar permissões') }
  }

  async function handleSave() {
    if (!selected) return
    setSaving(true)
    try {
      await permissionsApi.update(selected.id, perms)
      notyf.success('Permissões salvas com sucesso')
      fetchAll()
    } catch { notyf.error('Erro ao salvar permissões') }
    finally { setSaving(false) }
  }

  function toggle(sys: System) {
    setPerms((p) =>
      p.includes(sys) ? p.filter((s) => s !== sys) : [...p, sys]
    )
  }

  function selectAll() { setPerms([...ALL_SYSTEMS]) }
  function selectNone() { setPerms([]) }

  const filtered = users
    .filter((u) => u.role !== 'SUPERADMIN')
    .filter((u) => {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    })

  return (
    <div className={styles.page}>
      <PageHeader
        title="Permissões"
        subtitle="Gerencie quais sistemas cada usuário pode acessar"
      />

      <div className={styles.layout}>
        {/* Lista de usuários */}
        <div className={styles.userPanel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Usuários</h2>
            <div className={styles.panelSearch}>
              <i className="bx bx-search" />
              <input
                className={styles.panelSearchInput}
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.tenantFilter}>
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
          </div>

          <div className={styles.userList}>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))
            ) : filtered.length === 0 ? (
              <div className={styles.emptyList}>
                <i className="bx bx-group" />
                <span>Nenhum usuário</span>
              </div>
            ) : (
              filtered.map((u) => (
                <button
                  key={u.id}
                  className={`${styles.userItem} ${selected?.id === u.id ? styles.userItemActive : ''}`}
                  onClick={() => selectUser(u)}
                >
                  <div className={styles.itemAvatar}>{u.name.charAt(0).toUpperCase()}</div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemName}>{u.name}</span>
                    <span className={styles.itemSub}>{u.tenant?.name ?? u.email}</span>
                  </div>
                  <div className={styles.itemRight}>
                    <StatusBadge active={u.active} />
                    <span className={styles.itemPermCount}>
                      {u.permissions.filter((p) => p.granted).length} sistemas
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Painel de permissões */}
        <div className={styles.permPanel}>
          {!selected ? (
            <div className={styles.emptyPermPanel}>
              <div className={styles.emptyIcon}>
                <i className="bx bx-shield-alt-2" />
              </div>
              <h3>Selecione um usuário</h3>
              <p>Escolha um usuário na lista ao lado para gerenciar suas permissões de sistema</p>
            </div>
          ) : (
            <>
              <div className={styles.permHeader}>
                <div className={styles.permUserInfo}>
                  <div className={styles.permAvatar}>{selected.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <h3 className={styles.permUserName}>{selected.name}</h3>
                    <span className={styles.permUserEmail}>{selected.email}</span>
                  </div>
                </div>
                <div className={styles.permActions}>
                  <Button variant="ghost" size="sm" onClick={selectAll}>Todos</Button>
                  <Button variant="ghost" size="sm" onClick={selectNone}>Nenhum</Button>
                  <Button size="sm" loading={saving} onClick={handleSave} icon="bx-save">
                    Salvar
                  </Button>
                </div>
              </div>

              <div className={styles.permGrid}>
                {ALL_SYSTEMS.map((sys) => {
                  const granted = perms.includes(sys)
                  return (
                    <button
                      key={sys}
                      className={`${styles.permCard} ${granted ? styles.permCardActive : ''}`}
                      onClick={() => toggle(sys)}
                    >
                      <div className={styles.permCardCheck}>
                        <i className={`bx ${granted ? 'bxs-check-circle' : 'bx-circle'}`} />
                      </div>
                      <div className={styles.permCardInfo}>
                        <SystemBadge system={sys} />
                        <span className={styles.permCardLabel}>{SYSTEM_LABELS[sys]}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className={styles.permSummary}>
                <span className={styles.permSummaryText}>
                  <i className="bx bx-shield-alt-2" />
                  {perms.length} de {ALL_SYSTEMS.length} sistemas liberados
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}