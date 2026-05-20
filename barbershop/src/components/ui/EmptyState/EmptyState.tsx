import type { ReactNode } from 'react'
import Button from '../Button/Button'
import styles from './EmptyState.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: string    // classe Boxicon
  title: string
  description?: string
  action?: {
    label: string
    icon?: string
    onClick: () => void
  }
  size?: 'sm' | 'md' | 'lg'
  children?: ReactNode   // slot para conteúdo extra
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function EmptyState({
  icon = 'bx bx-inbox',
  title,
  description,
  action,
  size = 'md',
  children,
}: EmptyStateProps) {
  return (
    <div
      className={`${styles.empty} ${styles[`empty--${size}`]}`}
      data-aos="fade-up"
    >
      {/* Ícone em container circular creme */}
      <div className={styles.iconWrap}>
        <i className={`${icon} ${styles.icon}`} aria-hidden="true" />
      </div>

      {/* Textos */}
      <div className={styles.text}>
        <h3 className={styles.title}>{title}</h3>
        {description && (
          <p className={styles.description}>{description}</p>
        )}
      </div>

      {/* Slot extra */}
      {children}

      {/* Ação primária */}
      {action && (
        <Button
          variant="dark"
          icon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}