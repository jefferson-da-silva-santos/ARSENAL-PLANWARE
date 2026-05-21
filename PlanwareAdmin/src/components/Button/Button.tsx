import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.scss'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: string
  children?: ReactNode
}

export default function Button({
  variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...rest
}: ButtonProps) {
  return (
    <button
      className={[styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className={styles.spinner} />
      ) : icon ? (
        <i className={`bx ${icon}`} />
      ) : null}
      {children && <span>{children}</span>}
    </button>
  )
}