import styles from './Agenda.module.scss'
import type { Slot } from '../../types'

// ─────────────────────────────────────────────────────────────
//  SlotPicker
//  Renderiza os slots de horário disponíveis em grade visual.
//  Slots ocupados não aparecem — a API já os filtra.
//  Responsivo: grid fluido que quebra conforme o espaço.
// ─────────────────────────────────────────────────────────────

interface SlotPickerProps {
  slots      : Slot[]
  selected   : string | null   // dataHora ISO do slot selecionado
  onSelect   : (slot: Slot) => void
  loading?   : boolean
  motivo?    : string          // mensagem quando não há slots
}

export default function SlotPicker({
  slots,
  selected,
  onSelect,
  loading = false,
  motivo,
}: SlotPickerProps) {
  // ── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.slotGrid}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={styles.slotSkeleton} />
        ))}
      </div>
    )
  }

  // ── Sem slots disponíveis ────────────────────────────────
  if (slots.length === 0) {
    return (
      <div className={styles.slotEmpty}>
        <i className="bx bx-calendar-x" aria-hidden="true" />
        <span>
          {motivo ?? 'Nenhum horário disponível para este dia.'}
        </span>
      </div>
    )
  }

  return (
    <div className={styles.slotGrid} role="group" aria-label="Horários disponíveis">
      {slots.map((slot) => {
        const isSelected = slot.dataHora === selected
        return (
          <button
            key={slot.dataHora}
            type="button"
            className={`${styles.slot} ${isSelected ? styles['slot--selected'] : ''}`}
            onClick={() => onSelect(slot)}
            aria-pressed={isSelected}
            aria-label={`Selecionar horário ${slot.horaFormatada}`}
          >
            {slot.horaFormatada}
          </button>
        )
      })}
    </div>
  )
}