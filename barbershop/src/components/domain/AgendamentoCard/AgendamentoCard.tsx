import type { Agendamento } from '../../../types'
import { AgendStatusBadge } from '../../ui/Badge/Badge'
import { getAvatarGradient, getInitials } from '../../../utils/avatarHelper'
import styles from './AgendamentoCard.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface AgendamentoCardProps {
  agendamento: Agendamento
  onConcluir?: (id: string) => void
  onCancelar?: (id: string) => void
  onDetalhes?: (id: string) => void
  compact?: boolean    // versão reduzida para listas densas
  aosDelay?: number
}

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  })
}

function fmtValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function AgendamentoCard({
  agendamento: a,
  onConcluir,
  onCancelar,
  onDetalhes,
  compact = false,
  aosDelay = 0,
}: AgendamentoCardProps) {
  const nomeCliente = a.cliente?.nome ?? a.nomeCliente ?? 'Cliente eventual'
  const nomeBarbeiro = a.barbeiro?.nome ?? '—'
  const gradient = getAvatarGradient(nomeCliente)
  const initials = getInitials(nomeCliente)

  const canConcluir = ['AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO'].includes(a.status)
  const canCancelar = ['AGENDADO', 'CONFIRMADO'].includes(a.status)

  return (
    <div
      className={`${styles.card} ${styles[`card--${a.status.toLowerCase()}`]} ${compact ? styles['card--compact'] : ''}`}
      data-aos="fade-up"
      data-aos-delay={aosDelay}
    >
      {/* Linha de cor por status (borda esquerda) */}
      <div className={styles.statusBar} aria-hidden="true" />

      <div className={styles.inner}>
        {/* Avatar do cliente */}
        <div
          className={styles.avatar}
          style={{ background: gradient }}
          aria-hidden="true"
        >
          <span className={styles.initials}>{initials}</span>
        </div>

        {/* Conteúdo central */}
        <div className={styles.content}>
          <div className={styles.topRow}>
            <span className={styles.clienteName}>{nomeCliente}</span>
            <AgendStatusBadge status={a.status} />
          </div>

          <div className={styles.details}>
            {/* Serviço */}
            {a.servico && (
              <span className={styles.detail}>
                <i className="bx bxs-scissors" aria-hidden="true" />
                {a.servico.nome}
              </span>
            )}

            {/* Horário */}
            <span className={styles.detail}>
              <i className="bx bx-time" aria-hidden="true" />
              <span className={styles.time}>{fmtHora(a.dataHora)}</span>
              <span className={styles.date}>{fmtData(a.dataHora)}</span>
            </span>

            {/* Duração */}
            <span className={styles.detail}>
              <i className="bx bx-timer" aria-hidden="true" />
              {a.duracaoMin} min
            </span>

            {/* Barbeiro — oculto no compact */}
            {!compact && (
              <span className={styles.detail}>
                <i className="bx bx-user" aria-hidden="true" />
                {nomeBarbeiro}
              </span>
            )}
          </div>
        </div>

        {/* Valor + ações */}
        <div className={styles.right}>
          <span className={styles.valor}>{fmtValor(a.valorCobrado)}</span>

          {!compact && (
            <div className={styles.actions}>
              {onDetalhes && (
                <button
                  className={styles.actionBtn}
                  onClick={() => onDetalhes(a.id)}
                  title="Ver detalhes"
                  aria-label="Ver detalhes do agendamento"
                >
                  <i className="bx bx-show" />
                </button>
              )}
              {canConcluir && onConcluir && (
                <button
                  className={`${styles.actionBtn} ${styles['actionBtn--success']}`}
                  onClick={() => onConcluir(a.id)}
                  title="Concluir"
                  aria-label="Concluir agendamento"
                >
                  <i className="bx bx-check" />
                </button>
              )}
              {canCancelar && onCancelar && (
                <button
                  className={`${styles.actionBtn} ${styles['actionBtn--danger']}`}
                  onClick={() => onCancelar(a.id)}
                  title="Cancelar"
                  aria-label="Cancelar agendamento"
                >
                  <i className="bx bx-x" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}