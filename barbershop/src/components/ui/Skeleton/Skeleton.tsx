import styles from './Skeleton.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface SkeletonProps {
  width?: string | number
  height?: string | number
  radius?: string | number
  className?: string
}

// ─────────────────────────────────────────────────────────────
//  Skeleton base — bloco único
// ─────────────────────────────────────────────────────────────

export default function Skeleton({
  width,
  height = 16,
  radius = 6,
  className = '',
}: SkeletonProps) {
  return (
    <span
      className={`${styles.skeleton} ${className}`}
      style={{
        width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : '100%',
        height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        borderRadius: typeof radius === 'number' ? `${radius}px` : radius,
      }}
      aria-hidden="true"
    />
  )
}

// ─────────────────────────────────────────────────────────────
//  Skeleton de texto — linhas de texto com última menor
// ─────────────────────────────────────────────────────────────

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className={styles.textGroup}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={13}
          radius={4}
          width={i === lines - 1 ? '65%' : '100%'}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Skeleton de KPI card — imita a estrutura do StatCard
// ─────────────────────────────────────────────────────────────

export function SkeletonStatCard() {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardTop}>
        <Skeleton width={40} height={12} radius={4} />
        <Skeleton width={38} height={38} radius={10} />
      </div>
      <Skeleton width={120} height={32} radius={6} />
      <Skeleton width={80} height={12} radius={4} />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Skeleton de linha de tabela
// ─────────────────────────────────────────────────────────────

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div className={styles.tableRow}>
      {/* Avatar */}
      <Skeleton width={32} height={32} radius={999} />

      {/* Colunas de texto */}
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <Skeleton
          key={i}
          height={13}
          radius={4}
          width={i === 0 ? '30%' : i % 2 === 0 ? '20%' : '15%'}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Skeleton de card de agendamento / barbeiro / cliente
// ─────────────────────────────────────────────────────────────

export function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <Skeleton width={48} height={48} radius={999} />
        <div className={styles.cardHeadText}>
          <Skeleton width={140} height={14} radius={4} />
          <Skeleton width={90} height={11} radius={4} />
        </div>
      </div>
      <Skeleton height={1} radius={0} className={styles.divider} />
      <div className={styles.cardBody}>
        <Skeleton height={12} radius={4} />
        <Skeleton height={12} radius={4} width="70%" />
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Skeleton de avatar
// ─────────────────────────────────────────────────────────────

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} radius={999} />
}