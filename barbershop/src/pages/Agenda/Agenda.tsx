import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { agendamentosApi } from '../../services/agendamentosApi'
import { barbeirosApi } from '../../services/barbeirosApi'
import { servicosApi } from '../../services/servicosApi'
import { configApi } from '../../services/configApi'
import { ModalConfirm } from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import AgendamentoCard from '../../components/domain/AgendamentoCard/AgendamentoCard'
import { SkeletonCard } from '../../components/ui/Skeleton/Skeleton'
import AgendaCalendar from './AgendaCalendar'
import AgendaDrawer from './AgendaDrawer'
import type { Agendamento, Barbeiro, Servico, BarberConfig } from '../../types'
import styles from './Agenda.module.scss'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

type ViewMode = 'lista' | 'grade'

function formatDateDisplay(yyyy_mm_dd: string): string {
  return new Date(yyyy_mm_dd + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0]
}

// Status visíveis nos chips de filtro
const STATUS_FILTERS = [
  { value: '',               label: 'Todos'          },
  { value: 'AGENDADO',      label: 'Agendados'       },
  { value: 'CONFIRMADO',    label: 'Confirmados'     },
  { value: 'EM_ATENDIMENTO',label: 'Em atendimento'  },
  { value: 'CONCLUIDO',     label: 'Concluídos'      },
  { value: 'CANCELADO',     label: 'Cancelados'      },
]

// ─────────────────────────────────────────────────────────────
//  Componente
// ─────────────────────────────────────────────────────────────

export default function Agenda() {
  const toast = useToast()

  // ── Data selecionada ─────────────────────────────────────
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split('T')[0]
  )

  // ── Modo de visualização ─────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>('lista')

  // ── Filtros ──────────────────────────────────────────────
  const [filterStatus,    setFilterStatus]    = useState('')
  const [filterBarbeiro,  setFilterBarbeiro]  = useState('')

  // ── Dados ────────────────────────────────────────────────
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [barbeiros,    setBarbeiros]    = useState<Barbeiro[]>([])
  const [servicos,     setServicos]     = useState<Servico[]>([])
  const [config,       setConfig]       = useState<BarberConfig | null>(null)

  const [loadingAgend, setLoadingAgend] = useState(true)
  const [loadingMeta,  setLoadingMeta]  = useState(true)

  // ── Drawer de criação/detalhe ────────────────────────────
  const [drawerOpen,     setDrawerOpen]     = useState(false)
  const [drawerAgend,    setDrawerAgend]    = useState<Agendamento | null>(null)
  const [preData,        setPreData]        = useState<string | undefined>()
  const [preBarbeiro,    setPreBarbeiro]    = useState<string | undefined>()

  // ── Modal de confirmação ─────────────────────────────────
  const [confirmOpen,    setConfirmOpen]    = useState(false)
  const [confirmAction,  setConfirmAction]  = useState<'cancelar' | 'concluir'>('cancelar')
  const [confirmId,      setConfirmId]      = useState<string>('')
  const [confirmLoading, setConfirmLoading] = useState(false)

  useAOSRefresh(agendamentos.length)

  // ── Carrega dados estáticos (barbeiros, serviços, config) ──
  useEffect(() => {
    setLoadingMeta(true)
    Promise.allSettled([
      barbeirosApi.list(true),
      servicosApi.list(true),
      configApi.get(),
    ]).then(([b, s, c]) => {
      if (b.status === 'fulfilled') setBarbeiros(b.value.data.data)
      if (s.status === 'fulfilled') setServicos(s.value.data.data)
      if (c.status === 'fulfilled') setConfig(c.value.data.data)
    }).finally(() => setLoadingMeta(false))
  }, [])

  // ── Carrega agendamentos da data selecionada ──────────────
  const loadAgendamentos = useCallback(async () => {
    setLoadingAgend(true)
    try {
      const params: Record<string, any> = { data: selectedDate, perPage: 100 }
      if (filterBarbeiro) params.barbeiroId = filterBarbeiro
      if (filterStatus)   params.status     = filterStatus

      const r = await agendamentosApi.list(params)
      setAgendamentos(r.data.data.agendamentos)
    } catch {
      toast.error('Erro ao carregar agendamentos')
    } finally {
      setLoadingAgend(false)
    }
  }, [selectedDate, filterBarbeiro, filterStatus, toast])

  useEffect(() => { loadAgendamentos() }, [loadAgendamentos])

  // ── Ações ─────────────────────────────────────────────────

  function openNew(barbeiroId?: string, dataHora?: string) {
    setDrawerAgend(null)
    setPreBarbeiro(barbeiroId)
    setPreData(selectedDate)
    setDrawerOpen(true)
  }

  function openDetalhe(a: Agendamento) {
    setDrawerAgend(a)
    setPreBarbeiro(undefined)
    setPreData(undefined)
    setDrawerOpen(true)
  }

  function triggerCancelar(id: string) {
    setConfirmId(id)
    setConfirmAction('cancelar')
    setConfirmOpen(true)
  }

  function triggerConcluir(id: string) {
    setConfirmId(id)
    setConfirmAction('concluir')
    setConfirmOpen(true)
  }

  async function handleConfirm() {
    setConfirmLoading(true)
    try {
      if (confirmAction === 'cancelar') {
        await agendamentosApi.cancelar(confirmId)
        toast.success('Agendamento cancelado')
      } else {
        await agendamentosApi.concluir(confirmId)
        toast.success('Agendamento concluído!')
      }
      loadAgendamentos()
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? 'Erro na operação')
    } finally {
      setConfirmLoading(false)
      setConfirmOpen(false)
    }
  }

  // ── Agendamentos filtrados para exibição ──────────────────
  const agendVisiveis = agendamentos.filter((a) => {
    if (filterBarbeiro && a.barbeiro?.id !== filterBarbeiro) return false
    if (filterStatus   && a.status        !== filterStatus)   return false
    return true
  })

  // Ordena por horário
  const agendOrdenados = [...agendVisiveis].sort(
    (a, b) => new Date(a.dataHora).getTime() - new Date(b.dataHora).getTime()
  )

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Operação"
        title="Agenda"
        subtitle={formatDateDisplay(selectedDate)}
        actions={
          <Button
            variant="primary"
            icon="bx bx-plus"
            onClick={() => openNew()}
          >
            Novo agendamento
          </Button>
        }
      />

      <div className={styles.body}>

        {/* ── Navegação de data ─────────────────────────── */}
        <div className={styles.dateNav}>
          <button
            className={styles.dateNavBtn}
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            aria-label="Dia anterior"
          >
            <i className="bx bx-chevron-left" />
          </button>

          <div className={styles.dateCenter}>
            <span className={styles.dateLabel}>
              {isToday(selectedDate) && (
                <span className={styles.todayPill}>Hoje</span>
              )}
              {formatDateDisplay(selectedDate)}
            </span>

            <input
              type="date"
              className={styles.dateInput}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              aria-label="Selecionar data"
            />
          </div>

          <button
            className={styles.dateNavBtn}
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            aria-label="Próximo dia"
          >
            <i className="bx bx-chevron-right" />
          </button>
        </div>

        {/* ── Filtros ───────────────────────────────────── */}
        <div className={styles.filters}>
          {/* Status */}
          <div className={styles.filterChips}>
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                className={`${styles.chip} ${filterStatus === f.value ? styles['chip--active'] : ''}`}
                onClick={() => setFilterStatus(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Barbeiro */}
          <div className={styles.filterRight}>
            <select
              className={styles.filterSelect}
              value={filterBarbeiro}
              onChange={(e) => setFilterBarbeiro(e.target.value)}
              aria-label="Filtrar por barbeiro"
            >
              <option value="">Todos os barbeiros</option>
              {barbeiros.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>

            {/* Alternar modo de visualização — grade só em desktop */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${viewMode === 'lista' ? styles['viewBtn--active'] : ''}`}
                onClick={() => setViewMode('lista')}
                title="Modo lista"
                aria-label="Visualização em lista"
                aria-pressed={viewMode === 'lista'}
              >
                <i className="bx bx-list-ul" />
              </button>
              <button
                className={`${styles.viewBtn} ${viewMode === 'grade' ? styles['viewBtn--active'] : ''}`}
                onClick={() => setViewMode('grade')}
                title="Modo grade"
                aria-label="Visualização em grade"
                aria-pressed={viewMode === 'grade'}
              >
                <i className="bx bx-grid-alt" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Contador ──────────────────────────────────── */}
        {!loadingAgend && (
          <div className={styles.counter}>
            <span>
              <strong>{agendOrdenados.length}</strong>
              {agendOrdenados.length === 1 ? ' agendamento' : ' agendamentos'}
              {filterStatus && ` · ${STATUS_FILTERS.find(f => f.value === filterStatus)?.label}`}
            </span>
          </div>
        )}

        {/* ── Modo LISTA ────────────────────────────────── */}
        {viewMode === 'lista' && (
          <div className={styles.lista}>
            {loadingAgend ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : agendOrdenados.length === 0 ? (
              <EmptyState
                icon="bx bx-calendar-x"
                title="Nenhum agendamento"
                description={
                  filterStatus || filterBarbeiro
                    ? 'Tente ajustar os filtros.'
                    : 'A agenda está livre para este dia.'
                }
                action={{
                  label  : 'Novo agendamento',
                  icon   : 'bx bx-plus',
                  onClick: () => openNew(),
                }}
              />
            ) : (
              agendOrdenados.map((a, i) => (
                <AgendamentoCard
                  key={a.id}
                  agendamento={a}
                  onDetalhes={openDetalhe}
                  onConcluir={triggerConcluir}
                  onCancelar={triggerCancelar}
                  aosDelay={i * 35}
                />
              ))
            )}
          </div>
        )}

        {/* ── Modo GRADE (desktop only) ─────────────────── */}
        {viewMode === 'grade' && (
          <div className={styles.gradeWrap}>
            {loadingAgend || loadingMeta ? (
              <div className={styles.gradeLoading}>
                <i className="bx bx-loader-alt bx-spin" />
                <span>Carregando grade...</span>
              </div>
            ) : barbeiros.length === 0 ? (
              <EmptyState
                icon="bx bx-user-x"
                title="Nenhum barbeiro ativo"
                description="Cadastre barbeiros para usar a visualização em grade."
              />
            ) : (
              <AgendaCalendar
                barbeiros={filterBarbeiro
                  ? barbeiros.filter((b) => b.id === filterBarbeiro)
                  : barbeiros}
                agendamentos={agendamentos}
                abertura={config?.horarioAbertura   ?? '08:00'}
                fechamento={config?.horarioFechamento ?? '20:00'}
                selectedDate={selectedDate}
                onSlotClick={(barbeiroId, dataHora) => {
                  setPreBarbeiro(barbeiroId)
                  openNew(barbeiroId, dataHora)
                }}
                onCardClick={openDetalhe}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Drawer ──────────────────────────────────────── */}
      <AgendaDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSaved={loadAgendamentos}
        onConcluir={triggerConcluir}
        onCancelar={triggerCancelar}
        preData={preData}
        preBarbeiro={preBarbeiro}
        agendamento={drawerAgend}
        barbeiros={barbeiros}
        servicos={servicos}
        toast={toast}
      />

      {/* ── Confirm modal ────────────────────────────────── */}
      <ModalConfirm
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={confirmLoading}
        title={confirmAction === 'cancelar' ? 'Cancelar agendamento' : 'Concluir agendamento'}
        message={
          confirmAction === 'cancelar'
            ? 'Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.'
            : 'Confirmar a conclusão deste atendimento? Comissão e pontos de fidelidade serão gerados automaticamente.'
        }
        confirmLabel={confirmAction === 'cancelar' ? 'Sim, cancelar' : 'Sim, concluir'}
      />
    </div>
  )
}