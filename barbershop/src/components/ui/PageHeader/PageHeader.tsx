import type { ReactNode } from 'react'
import styles from './PageHeader.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface PageHeaderProps {
  crumb?: string     // breadcrumb: "Operação / Agenda"
  title: string     // título principal da tela
  subtitle?: string     // linha opcional abaixo do título
  actions?: ReactNode  // botões à direita (CTA, filtros, etc.)
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function PageHeader({
  crumb,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Breadcrumb — eyebrow uppercase */}
        {crumb && (
          <span className={styles.crumb} aria-label="Navegação">
            {crumb}
          </span>
        )}

        {/* Título principal */}
        <h1 className={styles.title}>{title}</h1>

        {/* Subtítulo opcional */}
        {subtitle && (
          <p className={styles.subtitle}>{subtitle}</p>
        )}
      </div>

      {/* Ações (botões, chips de filtro, etc.) */}
      {actions && (
        <div className={styles.actions}>
          {actions}
        </div>
      )}
    </header>
  )
}