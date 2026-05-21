import styles from './StatCard.module.scss'

interface StatCardProps {
  label: string
  value: string | number
  icon: string
  accent?: string
  sub?: string
}

export default function StatCard({ label, value, icon, accent, sub }: StatCardProps) {
  return (
    <div className={styles.card} style={{ '--card-accent': accent } as React.CSSProperties}>
      <div className={styles.iconWrap}>
        <i className={`bx ${icon}`} />
      </div>
      <div className={styles.info}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
        {sub && <span className={styles.sub}>{sub}</span>}
      </div>
    </div>
  )
}