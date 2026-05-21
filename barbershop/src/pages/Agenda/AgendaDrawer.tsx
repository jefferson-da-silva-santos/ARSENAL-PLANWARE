import { useState, useEffect, type FormEvent } from 'react'
import Drawer from '../../components/ui/Drawer/Drawer'
import Button from '../../components/ui/Button/Button'
import SlotPicker from './SlotPicker'
import { AgendStatusBadge } from '../../components/ui/Badge/Badge'
import { agendamentosApi } from '../../services/agendamentosApi'
import { clientesApi } from '../../services/clientesApi'
import { useDebounce } from '../../hooks/useDebounce'
import type {
  Agendamento, Barbeiro, Servico,
  Disponibilidade, Slot, Cliente,
} from '../../types'
import styles from './Agenda.module.scss'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface AgendaDrawerProps {
  open        : boolean
  onClose     : () => void
  onSaved     : () => void
  onConcluir  : (id: string) => void
  onCancelar  : (id: string) => void
  // Dados pré-selecionados ao clicar num slot
  preData?    : string     // YYYY-MM-DD
  preBarbeiro?: string     // barbeiroId
  // Agendamento para detalhe/edição (null = criação)
  agendamento?: Agendamento | null
  barbeiros   : Barbeiro[]
  servicos    : Servico[]
  toast       : { success: (m: string) => void; error: (m: string) => void }
}

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

const ORIGENS = [
  { value: 'PRESENCIAL', label: 'Presencial' },
  { value: 'ONLINE',     label: 'Online'     },
  { value: 'WHATSAPP',   label: 'WhatsApp'   },
  { value: 'TELEFONE',   label: 'Telefone'   },
]

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtValor(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function AgendaDrawer({
  open,
  onClose,
  onSaved,
  onConcluir,
  onCancelar,
  preData,
  preBarbeiro,
  agendamento,
  barbeiros,
  servicos,
  toast,
}: AgendaDrawerProps) {
  const isEdit = !!agendamento

  // ── Form state ───────────────────────────────────────────
  const [barbeiroId,  setBarbeiroId]  = useState('')
  const [servicoId,   setServicoId]   = useState('')
  const [data,        setData]        = useState('')
  const [clienteId,   setClienteId]   = useState('')
  const [nomeCliente, setNomeCliente] = useState('')
  const [origem,      setOrigem]      = useState('PRESENCIAL')
  const [obs,         setObs]         = useState('')
  const [slotSel,     setSlotSel]     = useState<string | null>(null)

  // ── Disponibilidade ──────────────────────────────────────
  const [disponibilidade, setDisponibilidade] = useState<Disponibilidade | null>(null)
  const [loadingSlots,    setLoadingSlots]    = useState(false)

  // ── Busca de clientes ────────────────────────────────────
  const [clienteSearch,  setClienteSearch]  = useState('')
  const [clientes,       setClientes]       = useState<Cliente[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [showClientList, setShowClientList] = useState(false)
  const debouncedSearch = useDebounce(clienteSearch, 350)

  // ── Submit ───────────────────────────────────────────────
  const [saving, setSaving] = useState(false)

  // Preenche form ao abrir
  useEffect(() => {
    if (!open) return
    if (isEdit && agendamento) {
      setBarbeiroId(agendamento.barbeiro?.id ?? '')
      setServicoId(agendamento.servico?.id   ?? '')
      setData(agendamento.dataHora.split('T')[0])
      setClienteId(agendamento.clienteId ?? '')
      setNomeCliente(agendamento.nomeCliente ?? '')
      setOrigem(agendamento.origem)
      setObs(agendamento.observacoes ?? '')
      setSlotSel(null)
    } else {
      setBarbeiroId(preBarbeiro ?? '')
      setServicoId('')
      setData(preData ?? new Date().toISOString().split('T')[0])
      setClienteId('')
      setNomeCliente('')
      setOrigem('PRESENCIAL')
      setObs('')
      setSlotSel(null)
      setDisponibilidade(null)
    }
  }, [open, isEdit, agendamento, preData, preBarbeiro])

  // Busca disponibilidade quando barbeiro + serviço + data estão preenchidos
  useEffect(() => {
    if (!barbeiroId || !servicoId || !data || isEdit) return

    setLoadingSlots(true)
    setSlotSel(null)

    agendamentosApi
      .getDisponibilidade({ barbeiroId, servicoId, data })
      .then((r) => setDisponibilidade(r.data.data))
      .catch(() => setDisponibilidade(null))
      .finally(() => setLoadingSlots(false))
  }, [barbeiroId, servicoId, data, isEdit])

  // Busca clientes com debounce
  useEffect(() => {
    if (!debouncedSearch.trim() || isEdit) {
      setClientes([])
      return
    }
    setLoadingClients(true)
    clientesApi
      .list(debouncedSearch)
      .then((r) => setClientes(r.data.data.slice(0, 6)))
      .catch(() => setClientes([]))
      .finally(() => setLoadingClients(false))
  }, [debouncedSearch, isEdit])

  // ── Submit ───────────────────────────────────────────────
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!barbeiroId) { toast.error('Selecione o barbeiro');  return }
    if (!servicoId)  { toast.error('Selecione o serviço');   return }
    if (!slotSel && !isEdit) { toast.error('Selecione o horário'); return }
    if (!clienteId && !nomeCliente.trim()) {
      toast.error('Informe o cliente ou o nome')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        // Edição: só atualiza obs e origem por enquanto
        await agendamentosApi.update(agendamento!.id, {
          observacoes: obs || undefined,
        })
        toast.success('Agendamento atualizado')
      } else {
        await agendamentosApi.create({
          barbeiroId,
          servicoId,
          dataHora       : slotSel!,
          clienteId      : clienteId || undefined,
          nomeCliente    : !clienteId ? nomeCliente.trim() : undefined,
          origem,
          observacoes    : obs || undefined,
        })
        toast.success('Agendamento criado com sucesso!')
      }
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  // Seleciona cliente da lista
  function selectCliente(c: Cliente) {
    setClienteId(c.id)
    setNomeCliente(c.nome)
    setClienteSearch(c.nome)
    setShowClientList(false)
    setClientes([])
  }

  const servicoSelecionado = servicos.find((s) => s.id === servicoId)

  // ─────────────────────────────────────────────────────────
  //  Modo detalhe (agendamento concluído/cancelado — só leitura)
  // ─────────────────────────────────────────────────────────
  const isReadonly = isEdit && ['CONCLUIDO', 'CANCELADO', 'FALTOU'].includes(agendamento?.status ?? '')

  const drawerTitle = isEdit
    ? 'Detalhes do agendamento'
    : 'Novo agendamento'

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={drawerTitle}
      width="md"
      footer={
        !isReadonly ? (
          <div className={styles.drawerFooter}>
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            {isEdit && ['AGENDADO', 'CONFIRMADO'].includes(agendamento?.status ?? '') && (
              <Button
                variant="danger"
                icon="bx bx-x-circle"
                onClick={() => { onCancelar(agendamento!.id); onClose() }}
                disabled={saving}
              >
                Cancelar agend.
              </Button>
            )}
            {isEdit && ['AGENDADO','CONFIRMADO','EM_ATENDIMENTO'].includes(agendamento?.status ?? '') && (
              <Button
                variant="dark"
                icon="bx bx-check-circle"
                onClick={() => { onConcluir(agendamento!.id); onClose() }}
                disabled={saving}
              >
                Concluir
              </Button>
            )}
            {!isEdit && (
              <Button
                variant="primary"
                icon="bx bx-calendar-check"
                loading={saving}
                onClick={handleSubmit as any}
              >
                Confirmar
              </Button>
            )}
          </div>
        ) : undefined
      }
    >
      <form
        className={styles.drawerForm}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ── Modo detalhe (read-only) ─────────────────── */}
        {isReadonly && agendamento && (
          <div className={styles.detailBlock}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Status</span>
              <AgendStatusBadge status={agendamento.status} />
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Cliente</span>
              <span className={styles.detailVal}>
                {agendamento.cliente?.nome ?? agendamento.nomeCliente ?? '—'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Barbeiro</span>
              <span className={styles.detailVal}>{agendamento.barbeiro?.nome ?? '—'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Serviço</span>
              <span className={styles.detailVal}>{agendamento.servico?.nome ?? '—'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Data/hora</span>
              <span className={styles.detailVal}>{fmtDateTime(agendamento.dataHora)}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Valor</span>
              <span className={`${styles.detailVal} ${styles.detailValor}`}>
                {fmtValor(agendamento.valorCobrado)}
              </span>
            </div>
            {agendamento.observacoes && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Obs.</span>
                <span className={styles.detailVal}>{agendamento.observacoes}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Modo criação/edição ──────────────────────── */}
        {!isReadonly && (
          <>
            {/* Barbeiro */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Barbeiro <span className={styles.req}>*</span>
              </label>
              <select
                className={styles.select}
                value={barbeiroId}
                onChange={(e) => setBarbeiroId(e.target.value)}
                disabled={isEdit || saving}
                required
              >
                <option value="">Selecione o barbeiro</option>
                {barbeiros.map((b) => (
                  <option key={b.id} value={b.id}>{b.nome}</option>
                ))}
              </select>
            </div>

            {/* Serviço */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Serviço <span className={styles.req}>*</span>
              </label>
              <select
                className={styles.select}
                value={servicoId}
                onChange={(e) => setServicoId(e.target.value)}
                disabled={isEdit || saving}
                required
              >
                <option value="">Selecione o serviço</option>
                {servicos.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} — {s.duracaoMin}min — {fmtValor(s.preco)}
                  </option>
                ))}
              </select>
            </div>

            {/* Data */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>
                Data <span className={styles.req}>*</span>
              </label>
              <input
                type="date"
                className={styles.input}
                value={data}
                onChange={(e) => setData(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={isEdit || saving}
                required
              />
            </div>

            {/* Slot picker — só na criação */}
            {!isEdit && barbeiroId && servicoId && data && (
              <div className={styles.field}>
                <label className={styles.fieldLabel}>
                  Horário <span className={styles.req}>*</span>
                </label>
                {disponibilidade && !disponibilidade.disponivel && (
                  <p className={styles.noSlots}>
                    <i className="bx bx-info-circle" />
                    {disponibilidade.motivo ?? 'Sem horários disponíveis.'}
                  </p>
                )}
                <SlotPicker
                  slots={disponibilidade?.slots ?? []}
                  selected={slotSel}
                  onSelect={(slot) => setSlotSel(slot.dataHora)}
                  loading={loadingSlots}
                  motivo={disponibilidade?.motivo}
                />
                {slotSel && servicoSelecionado && (
                  <div className={styles.slotConfirm}>
                    <i className="bx bx-check-circle" />
                    <span>
                      {new Date(slotSel).toLocaleTimeString('pt-BR', {
                        hour: '2-digit', minute: '2-digit',
                      })}
                      {' '}— {servicoSelecionado.duracaoMin} min
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Cliente — busca com autocomplete */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Cliente</label>
              <div className={styles.autocomplete}>
                <input
                  type="text"
                  className={styles.input}
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value)
                    setClienteId('')
                    setNomeCliente('')
                    setShowClientList(true)
                  }}
                  onFocus={() => setShowClientList(true)}
                  placeholder="Buscar cliente cadastrado..."
                  disabled={saving}
                  autoComplete="off"
                />
                {loadingClients && (
                  <div className={styles.autocompleteLoading}>
                    <i className="bx bx-loader-alt bx-spin" />
                  </div>
                )}
                {showClientList && clientes.length > 0 && (
                  <ul className={styles.autocompleteList} role="listbox">
                    {clientes.map((c) => (
                      <li
                        key={c.id}
                        className={styles.autocompleteItem}
                        onClick={() => selectCliente(c)}
                        role="option"
                        aria-selected={c.id === clienteId}
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') selectCliente(c) }}
                      >
                        <span className={styles.autoName}>{c.nome}</span>
                        {c.telefone && (
                          <span className={styles.autoPhone}>{c.telefone}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Cliente eventual (não cadastrado) */}
              {!clienteId && (
                <div className={styles.fieldRow}>
                  <input
                    type="text"
                    className={styles.input}
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    placeholder="Ou informe o nome (cliente eventual)"
                    disabled={saving}
                  />
                </div>
              )}
            </div>

            {/* Origem */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Origem</label>
              <div className={styles.origemGrid}>
                {ORIGENS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    className={`${styles.origemBtn} ${origem === o.value ? styles['origemBtn--active'] : ''}`}
                    onClick={() => setOrigem(o.value)}
                    disabled={saving}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Observações</label>
              <textarea
                className={styles.textarea}
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                rows={3}
                placeholder="Alguma informação importante sobre este agendamento..."
                disabled={saving}
              />
            </div>
          </>
        )}
      </form>
    </Drawer>
  )
}