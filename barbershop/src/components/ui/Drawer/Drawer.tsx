import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import styles from './Drawer.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

type DrawerSide = 'right' | 'left' | 'bottom'
type DrawerWidth = 'sm' | 'md' | 'lg'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  side?: DrawerSide
  width?: DrawerWidth
  children: ReactNode
  footer?: ReactNode
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  width = 'md',
  children,
  footer,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // ESC fecha
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Trava scroll
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Foco ao abrir
  useEffect(() => {
    if (open) setTimeout(() => panelRef.current?.focus(), 60)
  }, [open])

  if (!open) return null

  const panelCls = [
    styles.panel,
    styles[`panel--${side}`],
    side !== 'bottom' ? styles[`panel--${width}`] : '',
  ]
    .filter(Boolean)
    .join(' ')

  return createPortal(
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={panelRef}
        className={panelCls}
        tabIndex={-1}
      >
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {/* Handle visual no mobile (bottom drawer) */}
            {side === 'bottom' && (
              <div className={styles.handle} aria-hidden="true" />
            )}
            {title && <h2 className={styles.title}>{title}</h2>}
          </div>

          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Fechar"
          >
            <i className="bx bx-x" aria-hidden="true" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className={styles.body}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={styles.footer}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}