import styles from './Badge.module.scss'

interface BadgeProps {
  label: string
  color?: string
  active?: boolean
}

const SYSTEM_COLORS: Record<string, string> = {
  CLIENTPRO: '#7c3aed',
  STOCKPRO: '#0891b2',
  FINVAULT: '#d97706',
  FINFLOW: '#059669',
  FINANCEFLOW: '#db2777',
  KANBAN: '#2563eb',
  CLINICA: '#dc2626',
  ORDEMTECH: '#7c2d12',
  FIADO: '#4f46e5',
  BARBERSHOP: '#FF6B2C', 
}

export function SystemBadge({ system }: { system: string }) {
  const color = SYSTEM_COLORS[system] || '#6b7280'
  return (
    <span
      className={styles.badge}
      style={{
        backgroundColor: color + '20',
        color,
        borderColor: color + '40',
      }}
    >
      {system}
    </span>
  )
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`${styles.badge} ${active ? styles.active : styles.inactive}`}>
      <span className={styles.dot} />
      {active ? 'Ativo' : 'Inativo'}
    </span>
  )
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`${styles.badge} ${role === 'SUPERADMIN' ? styles.superadmin : styles.user}`}>
      {role === 'SUPERADMIN' ? 'Superadmin' : 'Usuário'}
    </span>
  )
}