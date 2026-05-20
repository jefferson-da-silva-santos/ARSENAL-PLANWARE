import type { ReactNode } from 'react'
import styles from './Badge.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

type BadgeVariant =
  | 'orange'
  | 'success'
  | 'danger'
  | 'warn'
  | 'info'
  | 'neutral'
  | 'dark'

type AgendStatus =
  | 'AGENDADO'
  | 'CONFIRMADO'
  | 'EM_ATENDIMENTO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'FALTOU'

type AssinaturaStatus = 'ATIVA' | 'SUSPENSA' | 'CANCELADA' | 'VENCIDA'

type FilaStatus =
  | 'AGUARDANDO'
  | 'CHAMADO'
  | 'EM_ATENDIMENTO'
  | 'CONCLUIDO'
  | 'DESISTIU'

type BarberNivel = 'JUNIOR' | 'PLENO' | 'SENIOR' | 'MASTER'

interface BadgeProps {
  variant?: BadgeVariant
  icon?: string      // classe Boxicon
  pulse?: boolean     // dot pulsante (status ao vivo)
  children: ReactNode
  className?: string
}

// ─────────────────────────────────────────────────────────────
//  Badge base
// ─────────────────────────────────────────────────────────────

export default function Badge({
  variant = 'neutral',
  icon,
  pulse = false,
  children,
  className = '',
}: BadgeProps) {
  const cls = [
    styles.badge,
    styles[`badge--${variant}`],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={cls}>
      {pulse && <span className={styles.dot} aria-hidden="true" />}
      {icon && <i className={`${icon} ${styles.icon}`} aria-hidden="true" />}
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
//  Helpers — mapeia enums da API para variante + label
// ─────────────────────────────────────────────────────────────

const AGEND_MAP: Record<AgendStatus, { variant: BadgeVariant; label: string; pulse?: boolean }> = {
  AGENDADO: { variant: 'info', label: 'Agendado' },
  CONFIRMADO: { variant: 'success', label: 'Confirmado' },
  EM_ATENDIMENTO: { variant: 'orange', label: 'Em atendimento', pulse: true },
  CONCLUIDO: { variant: 'dark', label: 'Concluído' },
  CANCELADO: { variant: 'danger', label: 'Cancelado' },
  FALTOU: { variant: 'warn', label: 'Faltou' },
}

const ASSINATURA_MAP: Record<AssinaturaStatus, { variant: BadgeVariant; label: string }> = {
  ATIVA: { variant: 'success', label: 'Ativa' },
  SUSPENSA: { variant: 'warn', label: 'Suspensa' },
  CANCELADA: { variant: 'danger', label: 'Cancelada' },
  VENCIDA: { variant: 'neutral', label: 'Vencida' },
}

const FILA_MAP: Record<FilaStatus, { variant: BadgeVariant; label: string; pulse?: boolean }> = {
  AGUARDANDO: { variant: 'warn', label: 'Aguardando' },
  CHAMADO: { variant: 'orange', label: 'Chamado', pulse: true },
  EM_ATENDIMENTO: { variant: 'success', label: 'Em atendimento', pulse: true },
  CONCLUIDO: { variant: 'dark', label: 'Concluído' },
  DESISTIU: { variant: 'neutral', label: 'Desistiu' },
}

const NIVEL_MAP: Record<BarberNivel, { variant: BadgeVariant; label: string }> = {
  JUNIOR: { variant: 'neutral', label: 'Júnior' },
  PLENO: { variant: 'info', label: 'Pleno' },
  SENIOR: { variant: 'success', label: 'Sênior' },
  MASTER: { variant: 'orange', label: 'Master' },
}

// ─────────────────────────────────────────────────────────────
//  Componentes especializados (conveniência)
// ─────────────────────────────────────────────────────────────

export function AgendStatusBadge({ status }: { status: AgendStatus }) {
  const cfg = AGEND_MAP[status]
  return (
    <Badge variant={cfg.variant} pulse={cfg.pulse}>
      {cfg.label}
    </Badge>
  )
}

export function AssinaturaStatusBadge({ status }: { status: AssinaturaStatus }) {
  const cfg = ASSINATURA_MAP[status]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

export function FilaStatusBadge({ status }: { status: FilaStatus }) {
  const cfg = FILA_MAP[status]
  return (
    <Badge variant={cfg.variant} pulse={cfg.pulse}>
      {cfg.label}
    </Badge>
  )
}

export function NivelBadge({ nivel }: { nivel: BarberNivel }) {
  const cfg = NIVEL_MAP[nivel]
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}