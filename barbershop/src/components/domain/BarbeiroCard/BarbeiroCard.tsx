import { useNavigate } from 'react-router-dom'
import type { Barbeiro } from '../../../types'
import { NivelBadge } from '../../ui/Badge/Badge'
import { getAvatarGradient, getInitials, AVATAR_SIZES } from '../../../utils/avatarHelper'
import styles from './BarbeiroCard.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface BarbeiroCardProps {
  barbeiro: Barbeiro
  // Métricas opcionais vindas do dashboard
  faturamento?: number
  atendimentos?: number
  mediaAvaliacao?: number
  // Posição no ranking (1, 2, 3, ...)
  rank?: number
  aosDelay?: number
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function BarbeiroCard({
  barbeiro,
  faturamento,
  atendimentos,
  mediaAvaliacao,
  rank,
  aosDelay = 0,
}: BarbeiroCardProps) {
  const navigate = useNavigate()
  const gradient = getAvatarGradient(barbeiro.nome)
  const initials = getInitials(barbeiro.nome)
  const avatarPx = AVATAR_SIZES.lg  // 56px

  const isTop3 = rank !== undefined && rank <= 3

  // Progresso da meta de faturamento (0–100)
  const progressoMeta = barbeiro.metaMensal && faturamento !== undefined
    ? Math.min((faturamento / barbeiro.metaMensal) * 100, 100)
    : null

  function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  return (
    <div
      className={`${styles.card} ${!barbeiro.ativo ? styles['card--inativo'] : ''}`}
      onClick={() => navigate(`/barbeiros/${barbeiro.id}`)}
      data-aos="fade-up"
      data-aos-delay={aosDelay}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/barbeiros/${barbeiro.id}`) }}
      aria-label={`Ver perfil de ${barbeiro.nome}`}
    >
      {/* Rank badge (top 3) */}
      {isTop3 && (
        <div className={`${styles.rankBadge} ${styles[`rankBadge--${rank}`]}`}>
          <i className="bx bx-crown" aria-hidden="true" />
          {rank}º
        </div>
      )}

      {/* Avatar */}
      <div
        className={styles.avatar}
        style={{
          background: gradient,
          width: avatarPx,
          height: avatarPx,
        }}
        aria-hidden="true"
      >
        {barbeiro.foto
          ? <img src={barbeiro.foto} alt={barbeiro.nome} className={styles.avatarImg} />
          : <span className={styles.initials}>{initials}</span>
        }
      </div>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.nameRow}>
          <h3 className={styles.name}>{barbeiro.nome}</h3>
          <NivelBadge nivel={barbeiro.nivel} />
        </div>

        {/* Métricas */}
        {(faturamento !== undefined || atendimentos !== undefined) && (
          <div className={styles.metrics}>
            {faturamento !== undefined && (
              <div className={styles.metric}>
                <span className={styles.metricVal}>{fmt(faturamento)}</span>
                <span className={styles.metricLabel}>faturamento</span>
              </div>
            )}
            {atendimentos !== undefined && (
              <div className={styles.metric}>
                <span className={styles.metricVal}>{atendimentos}</span>
                <span className={styles.metricLabel}>atendimentos</span>
              </div>
            )}
            {mediaAvaliacao !== undefined && (
              <div className={styles.metric}>
                <span className={styles.metricVal}>
                  <i className="bx bxs-star" aria-hidden="true" />
                  {mediaAvaliacao.toFixed(1)}
                </span>
                <span className={styles.metricLabel}>avaliação</span>
              </div>
            )}
          </div>
        )}

        {/* Progress bar da meta */}
        {progressoMeta !== null && (
          <div className={styles.meta}>
            <div className={styles.metaBar}>
              <div
                className={styles.metaFill}
                style={{ width: `${progressoMeta}%` }}
              />
            </div>
            <span className={styles.metaLabel}>
              {progressoMeta.toFixed(0)}% da meta
            </span>
          </div>
        )}
      </div>

      {/* Arrow */}
      <i className={`bx bx-chevron-right ${styles.arrow}`} aria-hidden="true" />
    </div>
  )
}