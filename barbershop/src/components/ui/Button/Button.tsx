import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

type Variant = 'primary' | 'dark' | 'ghost' | 'soft' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: string        // classe do Boxicon, ex: 'bx bx-plus'
  iconRight?: string        // ícone à direita do label
  loading?: boolean
  fullWidth?: boolean
  children?: ReactNode
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const cls = [
    styles.btn,
    styles[`btn--${variant}`],
    styles[`btn--${size}`],
    fullWidth ? styles['btn--full'] : '',
    loading ? styles['btn--loading'] : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      {...rest}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {/* Spinner — visível só no estado loading */}
      {loading && (
        <span className={styles.spinner} aria-hidden="true" />
      )}

      {/* Ícone esquerdo */}
      {!loading && icon && (
        <i className={`${icon} ${styles.icon}`} aria-hidden="true" />
      )}

      {/* Label */}
      {children && (
        <span className={styles.label}>{children}</span>
      )}

      {/* Ícone direito */}
      {!loading && iconRight && (
        <i className={`${iconRight} ${styles.iconRight}`} aria-hidden="true" />
      )}
    </button>
  )
}