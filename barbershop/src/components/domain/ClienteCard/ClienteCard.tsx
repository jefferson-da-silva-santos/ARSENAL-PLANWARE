import type { Cliente } from '../../../types'
import { AssinaturaStatusBadge } from '../../ui/Badge/Badge'
import { getAvatarGradient, getInitials } from '../../../utils/avatarHelper'
import styles from './ClienteCard.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface ClienteCardProps {
  cliente: Cliente
  onClick?: (cliente: Cliente) => void
  aosDelay?: number
}

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function fmtData(iso: string | null) {
  if (!iso) return 'Nunca esteve'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function ClienteCard({
  cliente,
  onClick,
  aosDelay = 0,
}: ClienteCardProps) {
  const gradient = getAvatarGradient(cliente.nome)
  const initials = getInitials(cliente.nome)

  // Cliente inativo há +30 dias = "em risco"
  const diasSemVisita = cliente.ultimaVisita
    ? Math.floor((Date.now() - new Date(cliente.ultimaVisita).getTime()) / 86_400_000)
    : null

  const emRisco = diasSemVisita !== null && diasSemVisita >= 20

  return (
    <div
      className={`${styles.card} ${onClick ? styles['card--clickable'] : ''}`}
      onClick={() => onClick?.(cliente)}
      data-aos="fade-up"
      data-aos-delay={aosDelay}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter') onClick(cliente) } : undefined}
      aria-label={`Ver perfil de ${cliente.nome}`}
    >
      {/* Avatar */}
      <div
        className={styles.avatar}
        style={{ background: gradient }}
        aria-hidden="true"
      >
        <span className={styles.initials}>{initials}</span>
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{cliente.nome}</h3>
          {emRisco && (
            <span className={styles.riskTag}>
              <i className="bx bx-error-alt" aria-hidden="true" />
              Em risco
            </span>
          )}
          {cliente.assinaturaAtiva && (
            <AssinaturaStatusBadge status={cliente.assinaturaAtiva.status} />
          )}
        </div>

        <div className={styles.meta}>
          {/* Telefone */}
          {cliente.telefone && (
            <span className={styles.metaItem}>
              <i className="bx bx-phone" aria-hidden="true" />
              {cliente.telefone}
            </span>
          )}

          {/* Visitas */}
          <span className={styles.metaItem}>
            <i className="bx bx-scissors" aria-hidden="true" />
            {cliente.totalVisitas} {cliente.totalVisitas === 1 ? 'visita' : 'visitas'}
          </span>

          {/* Última visita */}
          <span className={`${styles.metaItem} ${emRisco ? styles['metaItem--risk'] : ''}`}>
            <i className="bx bx-calendar" aria-hidden="true" />
            {fmtData(cliente.ultimaVisita)}
          </span>
        </div>

        {/* Pontos de fidelidade */}
        {cliente.pontosFidelidade > 0 && (
          <div className={styles.points}>
            <i className="bx bxs-star" aria-hidden="true" />
            <span>{cliente.pontosFidelidade} pontos</span>
          </div>
        )}
      </div>

      {/* Arrow */}
      {onClick && (
        <i className={`bx bx-chevron-right ${styles.arrow}`} aria-hidden="true" />
      )}
    </div>
  )
}