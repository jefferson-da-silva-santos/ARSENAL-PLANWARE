import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { tenantsApi, usersApi } from '@/services/api'
import type { Tenant, User } from '@/types'
import { useAuth } from '@/contexts/AuthContext'
import PageHeader from '@/components/PageHeader/PageHeader'
import StatCard from '@/components/StatCard/StatCard'
import { StatusBadge } from '@/components/Badge/Badge'
import styles from './Dashboard.module.scss'

export default function Dashboard() {
  const { user } = useAuth()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([tenantsApi.list(), usersApi.list()])
      .then(([t, u]) => {
        setTenants(t.data.data)
        setUsers(u.data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const activeTenants = tenants.filter((t) => t.active).length
  const activeUsers = users.filter((u) => u.active).length
  const superadmins = users.filter((u) => u.role === 'SUPERADMIN').length
  const recentTenants = [...tenants].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 5)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className={styles.page}>
      <PageHeader
        title={`${greeting}, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Visão geral da plataforma Planware"
      />

      {/* Stats */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Total de Tenants"
          value={loading ? '—' : tenants.length}
          icon="bx-buildings"
          sub={`${activeTenants} ativos`}
          accent="rgba(0,255,132,.15)"
        />
        <StatCard
          label="Total de Usuários"
          value={loading ? '—' : users.length}
          icon="bx-group"
          sub={`${activeUsers} ativos`}
          accent="rgba(76,201,240,.15)"
        />
        <StatCard
          label="Tenants Ativos"
          value={loading ? '—' : activeTenants}
          icon="bx-check-shield"
          sub={`${tenants.length - activeTenants} inativos`}
          accent="rgba(0,153,82,.15)"
        />
        <StatCard
          label="Superadmins"
          value={loading ? '—' : superadmins}
          icon="bx-crown"
          sub="acesso total"
          accent="rgba(124,58,237,.15)"
        />
      </div>

      <div className={styles.grid2col}>
        {/* Tenants recentes */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <i className="bx bx-buildings" />
              Tenants Recentes
            </h2>
            <Link to="/tenants" className={styles.cardLink}>
              Ver todos <i className="bx bx-right-arrow-alt" />
            </Link>
          </div>

          {loading ? (
            <div className={styles.loadingRows}>
              {[...Array(5)].map((_, i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : (
            <div className={styles.list}>
              {recentTenants.map((tenant) => (
                <div key={tenant.id} className={styles.listItem}>
                  <div className={styles.tenantIcon}>
                    {tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.listInfo}>
                    <span className={styles.listName}>{tenant.name}</span>
                    <span className={styles.listSub}>/{tenant.slug}</span>
                  </div>
                  <div className={styles.listMeta}>
                    <StatusBadge active={tenant.active} />
                    <span className={styles.listCount}>
                      <i className="bx bx-user" />
                      {(tenant._count?.users ?? 0)} users
                    </span>
                  </div>
                </div>
              ))}
              {recentTenants.length === 0 && (
                <div className={styles.empty}>Nenhum tenant cadastrado</div>
              )}
            </div>
          )}
        </div>

        {/* Usuários recentes */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>
              <i className="bx bx-group" />
              Usuários Recentes
            </h2>
            <Link to="/users" className={styles.cardLink}>
              Ver todos <i className="bx bx-right-arrow-alt" />
            </Link>
          </div>

          {loading ? (
            <div className={styles.loadingRows}>
              {[...Array(5)].map((_, i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : (
            <div className={styles.list}>
              {users.slice(0, 5).map((u) => (
                <div key={u.id} className={styles.listItem}>
                  <div className={styles.userAvatar}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.listInfo}>
                    <span className={styles.listName}>{u.name}</span>
                    <span className={styles.listSub}>{u.email}</span>
                  </div>
                  <div className={styles.listMeta}>
                    <StatusBadge active={u.active} />
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className={styles.empty}>Nenhum usuário cadastrado</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}