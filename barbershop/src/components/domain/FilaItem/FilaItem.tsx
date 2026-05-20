import type { FilaEntry } from '../../../types'
import { FilaStatusBadge } from '../../ui/Badge/Badge'
import { getAvatarGradient, getInitials } from '../../../utils/avatarHelper'
import styles from './FilaItem.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface FilaItemProps {
  entry: FilaEntry
  onChamar?: (id: string) => void
  onRemover?: (id: string) => void
  // Tempo estimado de espera em minutos
  tempoEstimado?: number
}

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function fmtEspera(entrada: string): string {
  const mins = Math.floor((Date.now() - new Date(entrada).getTime()) / 60_000)
  if (mins < 1) return 'Acabou de entrar'
  if (mins < 60) return `${mins} min esperando`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h${m > 0 ? ` ${m}min` : ''} esperando`
}

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function FilaItem({
  entry: e,
  onChamar,
  onRemover,
  tempoEstimado,
}: FilaItemProps) {
  const nome = e.cliente?.nome ?? e.nomeCliente ?? 'Avulso'
  const gradient = getAvatarGradient(nome)
  const initials = getInitials(nome)

  const isAtivo = ['AGUARDANDO', 'CHAMADO'].includes(e.status)
  const isChamado = e.status === 'CHAMADO'

  return (
    <div
      className={`
        ${styles.item}
        ${styles[`item--${e.status.toLowerCase()}`]}
      `}
    >
      {/* Número de posição */}
      <div
        className={`${styles.position} ${isChamado ? styles['position--active'] : ''}`}
        aria-label={`Posição ${e.posicao} na fila`}
      >
        {e.posicao}
      </div>

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
          <span className={styles.name}>{nome}</span>
          <FilaStatusBadge status={e.status} />
        </div>

        <div className={styles.meta}>
          {/* Horário de entrada */}
          <span className={styles.metaItem}>
            <i className="bx bx-log-in" aria-hidden="true" />
            Entrou às {fmtHora(e.entradaEm)}
          </span>

          {/* Tempo esperando */}
          {isAtivo && (
            <span className={`${styles.metaItem} ${styles['metaItem--wait']}`}>
              <i className="bx bx-time" aria-hidden="true" />
              {fmtEspera(e.entradaEm)}
            </span>
          )}

          {/* Barbeiro preferido */}
          {e.barbeiro && (
            <span className={styles.metaItem}>
              <i className="bx bx-user" aria-hidden="true" />
              {e.barbeiro.nome}
            </span>
          )}

          {/* Tempo estimado */}
          {tempoEstimado !== undefined && isAtivo && (
            <span className={styles.metaItem}>
              <i className="bx bx-hourglass" aria-hidden="true" />
              ~{tempoEstimado} min de espera
            </span>
          )}
        </div>
      </div>

      {/* Ações */}
      {isAtivo && (
        <div className={styles.actions}>
          {e.status === 'AGUARDANDO' && onChamar && (
            <button
              className={`${styles.actionBtn} ${styles['actionBtn--call']}`}
              onClick={() => onChamar(e.id)}
              title="Chamar cliente"
              aria-label={`Chamar ${nome}`}
            >
              <i className="bx bx-bell" />
              <span>Chamar</span>
            </button>
          )}
          {onRemover && (
            <button
              className={`${styles.actionBtn} ${styles['actionBtn--remove']}`}
              onClick={() => onRemover(e.id)}
              title="Remover da fila"
              aria-label={`Remover ${nome} da fila`}
            >
              <i className="bx bx-x" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}