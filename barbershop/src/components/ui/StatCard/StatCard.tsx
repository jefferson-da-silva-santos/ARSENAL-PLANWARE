import type { ReactNode } from 'react'
import styles from './StatCard.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

type StatVariant = 'light' | 'dark' | 'orange' | 'danger'
type DeltaDir = 'up' | 'down' | 'neutral'

interface StatCardProps {
  label: string
  value: string | number
  icon?: string       // classe Boxicon
  delta?: string       // ex: "+12,4%"
  deltaDir?: DeltaDir
  sub?: string       // linha auxiliar abaixo do delta
  variant?: StatVariant
  className?: string
  children?: ReactNode    // slot para conteúdo extra (gráfico mini, etc.)
  // AOS
  aosDelay?: number
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function StatCard({
  label,
  value,
  icon,
  delta,
  deltaDir = 'neutral',
  sub,
  variant = 'light',
  className = '',
  children,
  aosDelay = 0,
}: StatCardProps) {
  const cls = [
    styles.card,
    styles[`card--${variant}`],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cls}
      data-aos="fade-up"
      data-aos-delay={aosDelay}
    >
      {/* Overlay radial laranja — só no card dark (Navalha 22) */}
      {variant === 'dark' && (
        <div className={styles.radialOverlay} aria-hidden="true" />
      )}

      {/* Topo: label + ícone */}
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        {icon && (
          <div className={styles.iconWrap}>
            <i className={`${icon} ${styles.icon}`} aria-hidden="true" />
          </div>
        )}
      </div>

      {/* Valor principal */}
      <div className={styles.value}>{value}</div>

      {/* Delta + sub */}
      {(delta || sub) && (
        <div className={styles.footer}>
          {delta && (
            <span className={`${styles.delta} ${styles[`delta--${deltaDir}`]}`}>
              {deltaDir === 'up' && <i className="bx bx-trending-up" aria-hidden="true" />}
              {deltaDir === 'down' && <i className="bx bx-trending-down" aria-hidden="true" />}
              {delta}
            </span>
          )}
          {sub && (
            <span className={styles.sub}>{sub}</span>
          )}
        </div>
      )}

      {/* Slot extra (mini chart, progress bar, etc.) */}
      {children && (
        <div className={styles.extra}>{children}</div>
      )}
    </div>
  )
}