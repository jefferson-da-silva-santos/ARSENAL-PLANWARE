import type { Agendamento, Barbeiro } from '../../types'
import { getAvatarGradient, getInitials } from '../../utils/avatarHelper'
// import { AgendStatusBadge } from '../../components/ui/Badge/Badge'
import styles from './Agenda.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface AgendaCalendarProps {
  barbeiros    : Barbeiro[]
  agendamentos : Agendamento[]
  abertura     : string   // HH:mm
  fechamento   : string   // HH:mm
  onSlotClick  : (barbeiroId: string, dataHora: string) => void
  onCardClick  : (agendamento: Agendamento) => void
  selectedDate : string   // YYYY-MM-DD
}

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

/** Gera array de horas HH:00 entre abertura e fechamento */
function generateHours(abertura: string, fechamento: string): string[] {
  const [hA] = abertura.split(':').map(Number)
  const [hF] = fechamento.split(':').map(Number)
  return Array.from({ length: hF - hA }, (_, i) => {
    const h = hA + i
    return `${String(h).padStart(2, '0')}:00`
  })
}

/** Minutos desde meia-noite de uma string HH:mm */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** Minutos desde meia-noite de um ISO datetime */
function isoToMinutes(iso: string): number {
  const d = new Date(iso)
  return d.getHours() * 60 + d.getMinutes()
}

/** Cor de fundo do card por status */
const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  AGENDADO      : { bg: '#D5E5F0', border: '#2F6E9A', text: '#2F6E9A' },
  CONFIRMADO    : { bg: '#D6EDDA', border: '#2D7A4E', text: '#2D7A4E' },
  EM_ATENDIMENTO: { bg: '#FFEEDE', border: '#FF6B2C', text: '#FF6B2C' },
  CONCLUIDO     : { bg: '#E4CFA9', border: '#8A6034', text: '#5A3A22' },
  CANCELADO     : { bg: '#F8D9D9', border: '#C13838', text: '#C13838' },
  FALTOU        : { bg: '#FBE9C7', border: '#C58524', text: '#C58524' },
}

// Altura em px de cada hora na grade
const HOUR_H = 64

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function AgendaCalendar({
  barbeiros,
  agendamentos,
  abertura,
  fechamento,
  onSlotClick,
  onCardClick,
  selectedDate,
}: AgendaCalendarProps) {
  const hours       = generateHours(abertura, fechamento)
  const abeMin      = toMinutes(abertura)
  const totalMin    = toMinutes(fechamento) - abeMin

  // Hora atual — para a linha "agora"
  const now         = new Date()
  const nowMin      = now.getHours() * 60 + now.getMinutes()
  const isToday     = selectedDate === now.toISOString().split('T')[0]
  const nowPct      = isToday && nowMin >= abeMin && nowMin <= toMinutes(fechamento)
    ? ((nowMin - abeMin) / totalMin) * 100
    : null

  return (
    <div className={styles.calendar}>
      {/* ── Header: avatar dos barbeiros ─────────────────── */}
      <div className={styles.calHeader}>
        {/* Célula vazia no canto esquerdo (coluna de horas) */}
        <div className={styles.calCorner} aria-hidden="true" />

        {barbeiros.map((b) => {
          const gradient = getAvatarGradient(b.nome)
          const initials = getInitials(b.nome)
          return (
            <div key={b.id} className={styles.calBarbeiro}>
              <div
                className={styles.calBarbeiroAvatar}
                style={{ background: gradient }}
                aria-hidden="true"
              >
                <span>{initials}</span>
              </div>
              <span className={styles.calBarbeiroNome}>{b.nome.split(' ')[0]}</span>
            </div>
          )
        })}
      </div>

      {/* ── Grade principal ───────────────────────────────── */}
      <div className={styles.calBody}>
        {/* Coluna de horas */}
        <div className={styles.calHours}>
          {hours.map((h) => (
            <div key={h} className={styles.calHour} style={{ height: HOUR_H }}>
              <span>{h}</span>
            </div>
          ))}
        </div>

        {/* Colunas por barbeiro */}
        {barbeiros.map((b) => {
          const agendBarb = agendamentos.filter(
            (a) => a.barbeiro?.id === b.id || a.barbeiroId === b.id
          )

          return (
            <div
              key={b.id}
              className={styles.calCol}
              style={{ height: hours.length * HOUR_H }}
            >
              {/* Linhas guia por hora */}
              {hours.map((h, i) => (
                <div
                  key={h}
                  className={styles.calGuide}
                  style={{ top: i * HOUR_H, height: HOUR_H }}
                  onClick={() => {
                    // Clique num slot vazio
                    const [hh] = h.split(':')
                    onSlotClick(b.id, `${selectedDate}T${hh}:00:00`)
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Agendar às ${h} com ${b.nome}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const [hh] = h.split(':')
                      onSlotClick(b.id, `${selectedDate}T${hh}:00:00`)
                    }
                  }}
                />
              ))}

              {/* Cards de agendamento posicionados absolutamente */}
              {agendBarb.map((a) => {
                const startMin = isoToMinutes(a.dataHora)
                const topPct   = ((startMin - abeMin) / totalMin) * 100
                const heightPct = (a.duracaoMin / totalMin) * 100

                const colors = STATUS_COLORS[a.status] ?? STATUS_COLORS.AGENDADO
                const nome   = a.cliente?.nome ?? a.nomeCliente ?? 'Eventual'

                return (
                  <div
                    key={a.id}
                    className={styles.calCard}
                    style={{
                      top        : `${topPct}%`,
                      height     : `${Math.max(heightPct, 3)}%`,
                      background : colors.bg,
                      borderColor: colors.border,
                      color      : colors.text,
                    }}
                    onClick={(e) => { e.stopPropagation(); onCardClick(a) }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onCardClick(a) }}
                    aria-label={`${nome} — ${a.servico?.nome ?? ''}`}
                  >
                    <span className={styles.calCardNome}>{nome}</span>
                    {a.servico && (
                      <span className={styles.calCardServico}>{a.servico.nome}</span>
                    )}
                    {a.status === 'EM_ATENDIMENTO' && (
                      <span className={styles.calCardPulse} aria-hidden="true" />
                    )}
                  </div>
                )
              })}

              {/* Linha do "agora" */}
              {nowPct !== null && (
                <div
                  className={styles.nowLine}
                  style={{ top: `${nowPct}%` }}
                  aria-hidden="true"
                >
                  <div className={styles.nowDot} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}