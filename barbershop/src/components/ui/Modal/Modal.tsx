import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Button from '../Button/Button'
import styles from './Modal.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

type ModalSize = 'sm' | 'md' | 'lg'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  hideClose?: boolean
  children: ReactNode
  footer?: ReactNode   // slot para botões de ação
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  hideClose = false,
  children,
  footer,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // ── ESC fecha o modal ─────────────────────────────────────
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // ── Trava scroll do body enquanto aberto ─────────────────
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // ── Foco no painel ao abrir ───────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => panelRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

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
        className={`${styles.panel} ${styles[`panel--${size}`]}`}
        tabIndex={-1}
      >
        {/* Header */}
        {(title || !hideClose) && (
          <div className={styles.header}>
            {title && (
              <h2 className={styles.title}>{title}</h2>
            )}
            {!hideClose && (
              <button
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Fechar"
              >
                <i className="bx bx-x" aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Conteúdo */}
        <div className={styles.body}>
          {children}
        </div>

        {/* Footer com ações */}
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

// ─────────────────────────────────────────────────────────────
//  ModalConfirm — confirmações destrutivas
// ─────────────────────────────────────────────────────────────

interface ModalConfirmProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
}

export function ModalConfirm({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  loading = false,
}: ModalConfirmProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className={styles.confirmMessage}>{message}</p>
    </Modal>
  )
}