import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { financeiroApi } from '../../services/financeiroApi'
import { agendamentosApi } from '../../services/agendamentosApi'
import { barbeirosApi } from '../../services/barbeirosApi'
import type { DashboardData, Agendamento, Barbeiro } from '../../types'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import StatCard from '../../components/ui/StatCard/StatCard'
import Button from '../../components/ui/Button/Button'
import { SkeletonStatCard, SkeletonCard, SkeletonRow } from '../../components/ui/Skeleton/Skeleton'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import AgendamentoCard from '../../components/domain/AgendamentoCard/AgendamentoCard'
import { getAvatarGradient, getInitials } from '../../utils/avatarHelper'
import styles from './Dashboard.module.scss'


function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtCompact(v: number) {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`
  return fmt(v)
}

function getGreeting(name: string) {
  const h = new Date().getHours()
  const saudacao = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'
  const primeiro = name.split(' ')[0]
  return `${saudacao}, ${primeiro} 👋`
}

function getTodayString() {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

// Mapeamento de status para label e cor da barra
const STATUS_BAR = [
  { key: 'AGENDADO', label: 'Agendados', color: '#2F6E9A' },
  { key: 'CONFIRMADO', label: 'Confirmados', color: '#2D7A4E' },
  { key: 'EM_ATENDIMENTO', label: 'Em atendimento', color: '#FF6B2C' },
  { key: 'CONCLUIDO', label: 'Concluídos', color: '#5A3A22' },
  { key: 'CANCELADO', label: 'Cancelados', color: '#C13838' },
  { key: 'FALTOU', label: 'Faltaram', color: '#C58524' },
]

// ─────────────────────────────────────────────────────────────
//  Sub-componente: Barra de status do dia
// ─────────────────────────────────────────────────────────────

interface StatusBarProps {
  agendamentosHoje: { status: string; _count: number }[]
}

function DayStatusBar({ agendamentosHoje }: StatusBarProps) {
  const total = agendamentosHoje.reduce((s, a) => s + a._count, 0)
  if (total === 0) return null

  const byStatus = Object.fromEntries(
    agendamentosHoje.map((a) => [a.status, a._count])
  )

  return (
    <div className={styles.statusBar}>
      <div className={styles.statusBarTrack}>
        {STATUS_BAR.map((s) => {
          const count = byStatus[s.key] ?? 0
          if (count === 0) return null
          const pct = (count / total) * 100
          return (
            <div
              key={s.key}
              className={styles.statusBarSegment}
              style={{ width: `${pct}%`, background: s.color }}
              title={`${s.label}: ${count}`}
            />
          )
        })}
      </div>
      <div className={styles.statusBarLegend}>
        {STATUS_BAR.map((s) => {
          const count = byStatus[s.key] ?? 0
          if (count === 0) return null
          return (
            <span key={s.key} className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ background: s.color }}
              />
              {count} {s.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Sub-componente: Card de barbeiro no ranking
// ─────────────────────────────────────────────────────────────

interface RankingItemProps {
  barbeiro: Barbeiro
  faturamento: number
  atendimentos: number
  rank: number
}

function RankingItem({ barbeiro, faturamento, atendimentos, rank }: RankingItemProps) {
  const navigate = useNavigate()
  const gradient = getAvatarGradient(barbeiro.nome)
  const initials = getInitials(barbeiro.nome)
  const isTop = rank === 1

  return (
    <div
      className={`${styles.rankItem} ${isTop ? styles['rankItem--top'] : ''}`}
      onClick={() => navigate(`/barbeiros/${barbeiro.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/barbeiros/${barbeiro.id}`) }}
    >
      <span className={`${styles.rankNumber} ${isTop ? styles['rankNumber--top'] : ''}`}>
        {rank === 1 ? <i className="bx bxs-crown" /> : rank}
      </span>

      <div
        className={styles.rankAvatar}
        style={{ background: gradient }}
        aria-hidden="true"
      >
        <span className={styles.rankInitials}>{initials}</span>
      </div>

      <div className={styles.rankInfo}>
        <span className={styles.rankName}>{barbeiro.nome}</span>
        <span className={styles.rankAtend}>{atendimentos} atendimentos</span>
      </div>

      <span className={styles.rankValor}>{fmtCompact(faturamento)}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Página principal
// ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [dashData, setDashData] = useState<DashboardData | null>(null)
  const [agendHoje, setAgendHoje] = useState<Agendamento[]>([])
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([])
  const [loadingDash, setLoadingDash] = useState(true)
  const [loadingAgend, setLoadingAgend] = useState(true)
  const [loadingBarb, setLoadingBarb] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useAOSRefresh(dashData)

  // ── Carrega todos os dados ───────────────────────────────
  const loadAll = useCallback(async (silent = false) => {
    if (!silent) {
      setLoadingDash(true)
      setLoadingAgend(true)
      setLoadingBarb(true)
    } else {
      setRefreshing(true)
    }

    const today = new Date().toISOString().split('T')[0]

    const [dash, agend, barb] = await Promise.allSettled([
      financeiroApi.getDashboard(),
      agendamentosApi.list({ data: today, perPage: 10 }),
      barbeirosApi.list(true),
    ])

    if (dash.status === 'fulfilled') {
      setDashData(dash.value.data.data)
    } else {
      toast.error('Erro ao carregar dados do dashboard')
    }

    if (agend.status === 'fulfilled') {
      setAgendHoje(agend.value.data.data.agendamentos)
    }

    if (barb.status === 'fulfilled') {
      setBarbeiros(barb.value.data.data)
    }

    setLoadingDash(false)
    setLoadingAgend(false)
    setLoadingBarb(false)
    setRefreshing(false)
  }, [toast])

  useEffect(() => { loadAll() }, [])

  // ─────────────────────────────────────────────────────────
  //  Computed values
  // ─────────────────────────────────────────────────────────

  // Cruza top barbeiros do dashboard com os dados de barbeiro
  const topBarbeiros = (dashData?.topBarbeiros ?? [])
    .slice(0, 5)
    .map((tb) => ({
      barbeiro: barbeiros.find((b) => b.id === tb.barbeiroId),
      faturamento: tb._sum?.valorCobrado ?? 0,
      atendimentos: tb._count?.id ?? 0,
    }))
    .filter((tb) => !!tb.barbeiro)

  // Agendamentos ativos do dia (exclui concluídos/cancelados no topo)
  const agendAtivos = agendHoje.filter((a) =>
    ['AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO'].includes(a.status)
  )
  const agendFinished = agendHoje.filter((a) =>
    ['CONCLUIDO', 'CANCELADO', 'FALTOU'].includes(a.status)
  )

  const totalAgendDia = dashData?.agendamentosHoje?.reduce(
    (s, a) => s + a._count, 0
  ) ?? 0

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Painel"
        title={user ? getGreeting(user.name) : 'Dashboard'}
        subtitle={getTodayString()}
        actions={
          <Button
            variant="ghost"
            icon="bx bx-refresh"
            size="sm"
            loading={refreshing}
            onClick={() => loadAll(true)}
          >
            Atualizar
          </Button>
        }
      />

      <div className={styles.body}>

        {/* ── KPI Row ─────────────────────────────────── */}
        <div className={styles.kpiRow}>
          {loadingDash ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))
          ) : (
            <>
              <StatCard
                label="Faturamento hoje"
                value={fmt(dashData?.faturamentoDia ?? 0)}
                icon="bx bx-wallet-alt"
                sub={`${dashData?.atendimentosDia ?? 0} atendimentos`}
                aosDelay={0}
              />
              <StatCard
                label="Ticket médio"
                value={fmt(dashData?.ticketMedioDia ?? 0)}
                icon="bx bx-trending-up"
                aosDelay={60}
              />
              <StatCard
                label="Fila agora"
                value={dashData?.filaAtual ?? 0}
                icon="bx bx-list-ul"
                sub={dashData?.filaAtual
                  ? 'clientes aguardando'
                  : 'Fila vazia'}
                aosDelay={120}
              />
              <StatCard
                label="Alertas de estoque"
                value={dashData?.produtosAlerta ?? 0}
                icon="bx bx-package"
                variant={dashData?.produtosAlerta ? 'danger' : 'light'}
                sub={dashData?.produtosAlerta
                  ? 'produtos abaixo do mínimo'
                  : 'Estoque ok'}
                aosDelay={180}
              />
            </>
          )}
        </div>

        {/* ── Grid principal ───────────────────────────── */}
        <div className={styles.grid}>

          {/* ── Coluna principal ──────────────────────── */}
          <div className={styles.mainCol}>

            {/* Agenda do dia */}
            <div className={styles.card} data-aos="fade-up" data-aos-delay="100">
              <div className={styles.cardHead}>
                <div className={styles.cardHeadLeft}>
                  <h2 className={styles.cardTitle}>
                    <i className="bx bx-calendar" aria-hidden="true" />
                    Agenda de hoje
                  </h2>
                  {totalAgendDia > 0 && (
                    <span className={styles.cardBadge}>{totalAgendDia}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="bx bx-right-arrow-alt"
                  onClick={() => navigate('/agenda')}
                >
                  Ver agenda
                </Button>
              </div>

              {/* Barra de status visual */}
              {!loadingDash && dashData?.agendamentosHoje && (
                <DayStatusBar agendamentosHoje={dashData.agendamentosHoje} />
              )}

              {/* Lista de agendamentos */}
              <div className={styles.agendList}>
                {loadingAgend ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))
                ) : agendAtivos.length === 0 && agendFinished.length === 0 ? (
                  <EmptyState
                    icon="bx bx-calendar-x"
                    title="Nenhum agendamento hoje"
                    description="A agenda está livre. Que tal agendar algo?"
                    size="sm"
                    action={{
                      label: 'Novo agendamento',
                      icon: 'bx bx-plus',
                      onClick: () => navigate('/agenda'),
                    }}
                  />
                ) : (
                  <>
                    {agendAtivos.map((a, i) => (
                      <AgendamentoCard
                        key={a.id}
                        agendamento={a}
                        onDetalhes={() => navigate('/agenda')}
                        aosDelay={i * 40}
                      />
                    ))}
                    {agendFinished.slice(0, 3).map((a, i) => (
                      <AgendamentoCard
                        key={a.id}
                        agendamento={a}
                        compact
                        aosDelay={agendAtivos.length * 40 + i * 40}
                      />
                    ))}
                    {agendHoje.length > 6 && (
                      <button
                        className={styles.seeMore}
                        onClick={() => navigate('/agenda')}
                      >
                        Ver todos os {totalAgendDia} agendamentos
                        <i className="bx bx-right-arrow-alt" aria-hidden="true" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Ranking de barbeiros */}
            <div className={styles.card} data-aos="fade-up" data-aos-delay="160">
              <div className={styles.cardHead}>
                <div className={styles.cardHeadLeft}>
                  <h2 className={styles.cardTitle}>
                    <i className="bx bx-bar-chart-alt-2" aria-hidden="true" />
                    Ranking do mês
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="bx bx-right-arrow-alt"
                  onClick={() => navigate('/barbeiros')}
                >
                  Ver equipe
                </Button>
              </div>

              <div className={styles.rankList}>
                {loadingBarb || loadingDash ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonRow key={i} cols={4} />
                  ))
                ) : topBarbeiros.length === 0 ? (
                  <EmptyState
                    icon="bx bx-user-x"
                    title="Sem dados de ranking"
                    description="Conclua atendimentos para ver o ranking."
                    size="sm"
                  />
                ) : (
                  topBarbeiros.map((tb, i) => (
                    <RankingItem
                      key={tb.barbeiro!.id}
                      barbeiro={tb.barbeiro!}
                      faturamento={tb.faturamento}
                      atendimentos={tb.atendimentos}
                      rank={i + 1}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ── Side panel ────────────────────────────── */}
          <div className={styles.sideCol}>

            {/* Card hero escuro — faturamento do mês */}
            <div
              className={styles.heroCard}
              data-aos="fade-up"
              data-aos-delay="80"
            >
              {/* Overlay radial obrigatório Navalha 22 */}
              <div className={styles.heroRadial} aria-hidden="true" />

              <div className={styles.heroInner}>
                <span className={styles.heroEyebrow}>
                  <i className="bx bx-trending-up" aria-hidden="true" />
                  Mês atual
                </span>

                {loadingDash ? (
                  <div className={styles.heroValueSk} />
                ) : (
                  <div className={styles.heroValue}>
                    {fmtCompact(dashData?.faturamentoMes ?? 0)}
                  </div>
                )}

                <p className={styles.heroLabel}>faturamento total</p>

                <div className={styles.heroDivider} />

                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatVal}>
                      {loadingDash ? '—' : dashData?.agendamentosMes ?? 0}
                    </span>
                    <span className={styles.heroStatLabel}>atendimentos</span>
                  </div>
                  <div className={styles.heroStatDivider} />
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatVal}>
                      {loadingDash ? '—' : dashData?.assinaturasAtivas ?? 0}
                    </span>
                    <span className={styles.heroStatLabel}>assinantes</span>
                  </div>
                  <div className={styles.heroStatDivider} />
                  <div className={styles.heroStat}>
                    <span className={styles.heroStatVal}>
                      {loadingDash ? '—' : dashData?.totalClientes ?? 0}
                    </span>
                    <span className={styles.heroStatLabel}>clientes</span>
                  </div>
                </div>

                <Button
                  variant="soft"
                  size="sm"
                  fullWidth
                  icon="bx bx-wallet-alt"
                  onClick={() => navigate('/financeiro')}
                >
                  Ver financeiro
                </Button>
              </div>
            </div>

            {/* Clientes inativos */}
            {!loadingDash && (dashData?.clientesInativos ?? 0) > 0 && (
              <div
                className={styles.alertCard}
                data-aos="fade-up"
                data-aos-delay="140"
              >
                <div className={styles.alertIcon} aria-hidden="true">
                  <i className="bx bx-user-minus" />
                </div>
                <div className={styles.alertText}>
                  <strong>{dashData!.clientesInativos} clientes</strong>
                  <span>sem visita há mais de 30 dias</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/clientes')}
                >
                  Ver
                </Button>
              </div>
            )}

            {/* Estoque crítico */}
            {!loadingDash && (dashData?.produtosAlerta ?? 0) > 0 && (
              <div
                className={`${styles.alertCard} ${styles['alertCard--danger']}`}
                data-aos="fade-up"
                data-aos-delay="180"
              >
                <div className={`${styles.alertIcon} ${styles['alertIcon--danger']}`} aria-hidden="true">
                  <i className="bx bx-package" />
                </div>
                <div className={styles.alertText}>
                  <strong>{dashData!.produtosAlerta} produtos</strong>
                  <span>abaixo do estoque mínimo</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/estoque')}
                >
                  Ver
                </Button>
              </div>
            )}

            {/* Ações rápidas */}
            <div
              className={styles.quickActions}
              data-aos="fade-up"
              data-aos-delay="220"
            >
              <h3 className={styles.quickTitle}>Ações rápidas</h3>
              <div className={styles.quickGrid}>
                {[
                  { icon: 'bx bx-calendar-plus', label: 'Novo agendamento', to: '/agenda' },
                  { icon: 'bx bx-user-plus', label: 'Novo cliente', to: '/clientes' },
                  { icon: 'bx bx-list-ul', label: 'Abrir fila', to: '/fila' },
                  { icon: 'bx bx-wallet-alt', label: 'Fechar caixa', to: '/financeiro' },
                ].map((a) => (
                  <button
                    key={a.to}
                    className={styles.quickBtn}
                    onClick={() => navigate(a.to)}
                  >
                    <i className={a.icon} aria-hidden="true" />
                    <span>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}