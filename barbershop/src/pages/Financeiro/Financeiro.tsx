import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { financeiroApi } from '../../services/financeiroApi'
import { barbeirosApi } from '../../services/barbeirosApi'
import { ModalConfirm } from '../../components/ui/Modal/Modal'
import Modal from '../../components/ui/Modal/Modal'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import StatCard from '../../components/ui/StatCard/StatCard'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { SkeletonStatCard, SkeletonRow } from '../../components/ui/Skeleton/Skeleton'
import { getAvatarGradient, getInitials } from '../../utils/avatarHelper'
import type { DashboardFinanceiro, Despesa, Fechamento, Barbeiro } from '../../types'
import styles from './Financeiro.module.scss'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short',
  })
}

function getPeriodoDates(periodo: string): { de: string; ate: string } {
  const hoje = new Date()
  switch (periodo) {
    case 'semana': {
      const seg = new Date(hoje)
      seg.setDate(hoje.getDate() - hoje.getDay() + 1)
      return {
        de : seg.toISOString().split('T')[0],
        ate: hoje.toISOString().split('T')[0],
      }
    }
    case 'mes':
      return {
        de : new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0],
        ate: hoje.toISOString().split('T')[0],
      }
    case 'trimestre': {
      const q = Math.floor(hoje.getMonth() / 3)
      return {
        de : new Date(hoje.getFullYear(), q * 3, 1).toISOString().split('T')[0],
        ate: hoje.toISOString().split('T')[0],
      }
    }
    default: // hoje
      return {
        de : hoje.toISOString().split('T')[0],
        ate: hoje.toISOString().split('T')[0],
      }
  }
}

// ─────────────────────────────────────────────────────────────
//  Formulário de despesa
// ─────────────────────────────────────────────────────────────

const CATEGORIAS = ['aluguel', 'produto', 'energia', 'água', 'equipamento', 'marketing', 'outro']

interface DespesaFormProps {
  onSubmit: (d: Record<string, any>) => Promise<void>
  onClose : () => void
  saving  : boolean
}

function DespesaForm({ onSubmit, onClose, saving }: DespesaFormProps) {
  const [descricao,   setDescricao]   = useState('')
  const [valor,       setValor]       = useState('')
  const [categoria,   setCategoria]   = useState('')
  const [data,        setData]        = useState(new Date().toISOString().split('T')[0])
  const [observacoes, setObservacoes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit({
      descricao  : descricao.trim(),
      valor      : parseFloat(valor),
      categoria  : categoria   || undefined,
      data,
      observacoes: observacoes.trim() || undefined,
    })
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label}>Descrição <span className={styles.req}>*</span></label>
        <input className={styles.input} value={descricao}
          onChange={e => setDescricao(e.target.value)}
          placeholder="Ex: Aluguel do espaço" required disabled={saving} />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label}>Valor (R$) <span className={styles.req}>*</span></label>
          <input className={styles.input} type="number" min="0" step="0.01"
            value={valor} onChange={e => setValor(e.target.value)}
            placeholder="0,00" required disabled={saving} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Data</label>
          <input className={styles.input} type="date" value={data}
            onChange={e => setData(e.target.value)} disabled={saving} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Categoria</label>
        <div className={styles.categoriaGrid}>
          <button type="button"
            className={`${styles.catBtn} ${categoria === '' ? styles['catBtn--active'] : ''}`}
            onClick={() => setCategoria('')} disabled={saving}>
            Sem categoria
          </button>
          {CATEGORIAS.map(c => (
            <button key={c} type="button"
              className={`${styles.catBtn} ${categoria === c ? styles['catBtn--active'] : ''}`}
              onClick={() => setCategoria(c)} disabled={saving}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Observações</label>
        <textarea className={styles.textarea} value={observacoes}
          onChange={e => setObservacoes(e.target.value)} rows={2} disabled={saving} />
      </div>

      <div className={styles.formActions}>
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" icon="bx bx-check" loading={saving}>Lançar despesa</Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────
//  Barra de distribuição financeira
// ─────────────────────────────────────────────────────────────

interface DistBar {
  label : string
  valor : number
  total : number
  color : string
}

function DistBar({ label, valor, total, color }: DistBar) {
  const pct = total > 0 ? (valor / total) * 100 : 0
  return (
    <div className={styles.distBar}>
      <div className={styles.distBarHeader}>
        <span className={styles.distBarLabel}>{label}</span>
        <span className={styles.distBarVal}>{fmt(valor)}</span>
      </div>
      <div className={styles.distBarTrack}>
        <div className={styles.distBarFill} style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={styles.distBarPct}>{pct.toFixed(1)}%</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Tipos de tab
// ─────────────────────────────────────────────────────────────

type Tab = 'visao' | 'despesas' | 'comissoes' | 'fechamento'
type Periodo = 'hoje' | 'semana' | 'mes' | 'trimestre'

// ─────────────────────────────────────────────────────────────
//  Página
// ─────────────────────────────────────────────────────────────

export default function Financeiro() {
  const toast = useToast()

  const [periodo,    setPeriodo]    = useState<Periodo>('mes')
  const [tab,        setTab]        = useState<Tab>('visao')

  const [dashboard,  setDashboard]  = useState<DashboardFinanceiro | null>(null)
  const [despesas,   setDespesas]   = useState<Despesa[]>([])
  const [fechamentos,setFechamentos]= useState<Fechamento[]>([])
  const [barbeiros,  setBarbeiros]  = useState<Barbeiro[]>([])

  const [loadingD,   setLoadingD]   = useState(true)
  const [loadingDe,  setLoadingDe]  = useState(false)
  const [loadingF,   setLoadingF]   = useState(false)

  // Modal despesa
  const [despModal,  setDespModal]  = useState(false)
  const [savingD,    setSavingD]    = useState(false)

  // Modal fechamento
  const [fechModal,  setFechModal]  = useState(false)
  const [fechLoading,setFechLoading]= useState(false)

  // Confirm delete despesa
  const [deleteId,      setDeleteId]      = useState('')
  const [deleteOpen,    setDeleteOpen]    = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useAOSRefresh(tab + periodo)

  // ── Carrega dashboard ─────────────────────────────────────
  const loadDash = useCallback(async () => {
    setLoadingD(true)
    const { de, ate } = getPeriodoDates(periodo)
    try {
      const [d, b] = await Promise.all([
        financeiroApi.getDashboardFinanceiro({ de, ate }),
        barbeirosApi.list(true),
      ])
      setDashboard(d.data.data)
      setBarbeiros(b.data.data)
    } catch { toast.error('Erro ao carregar financeiro') }
    finally  { setLoadingD(false) }
  }, [periodo, toast])

  useEffect(() => { loadDash() }, [])

  // ── Carrega despesas ──────────────────────────────────────
  const loadDespesas = useCallback(async () => {
    setLoadingDe(true)
    const { de, ate } = getPeriodoDates(periodo)
    try {
      const r = await financeiroApi.listDespesas({ de, ate })
      setDespesas(r.data.data)
    } catch { toast.error('Erro ao carregar despesas') }
    finally  { setLoadingDe(false) }
  }, [periodo, toast])

  // ── Carrega fechamentos ───────────────────────────────────
  const loadFechamentos = useCallback(async () => {
    setLoadingF(true)
    const { de, ate } = getPeriodoDates(periodo)
    try {
      const r = await financeiroApi.listFechamentos({ de, ate })
      setFechamentos(r.data.data)
    } catch { toast.error('Erro ao carregar fechamentos') }
    finally  { setLoadingF(false) }
  }, [periodo, toast])

  useEffect(() => {
    if (tab === 'despesas')   loadDespesas()
    if (tab === 'fechamento') loadFechamentos()
  }, [tab])

  // ── Ações ─────────────────────────────────────────────────
  async function handleDespesa(data: Record<string, any>) {
    setSavingD(true)
    try {
      await financeiroApi.createDespesa(data as any)
      toast.success('Despesa lançada!')
      setDespModal(false)
      loadDash()
      if (tab === 'despesas') loadDespesas()
    } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Erro') }
    finally { setSavingD(false) }
  }

  async function handleDeleteDespesa() {
    setDeleteLoading(true)
    try {
      await financeiroApi.deleteDespesa(deleteId)
      toast.success('Despesa removida')
      loadDespesas(); loadDash()
    } catch { toast.error('Erro ao remover') }
    finally { setDeleteLoading(false); setDeleteOpen(false) }
  }

  async function handleFechamento() {
    setFechLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      await financeiroApi.createFechamento({ data: today })
      toast.success('Caixa fechado com sucesso!')
      setFechModal(false)
      loadFechamentos(); loadDash()
    } catch (err: any) { toast.error(err?.response?.data?.error ?? 'Erro ao fechar caixa') }
    finally { setFechLoading(false) }
  }

  // ── Computed ──────────────────────────────────────────────
  const d = dashboard

  // Mapa barbeiroId → nome
  const barbMap = Object.fromEntries(barbeiros.map(b => [b.id, b]))

  const PERIODOS: { value: Periodo; label: string }[] = [
    { value: 'hoje',      label: 'Hoje'       },
    { value: 'semana',    label: 'Semana'     },
    { value: 'mes',       label: 'Mês atual'  },
    { value: 'trimestre', label: 'Trimestre'  },
  ]

  const TABS: { value: Tab; icon: string; label: string }[] = [
    { value: 'visao',      icon: 'bx bx-bar-chart-alt-2', label: 'Visão geral'  },
    { value: 'despesas',   icon: 'bx bx-minus-circle',     label: 'Despesas'     },
    { value: 'comissoes',  icon: 'bx bx-dollar-circle',    label: 'Comissões'    },
    { value: 'fechamento', icon: 'bx bx-lock',             label: 'Fechamento'   },
  ]

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Gestão"
        title="Financeiro"
        subtitle="Controle de faturamento, despesas e comissões"
        actions={
          <div className={styles.headerActions}>
            <Button variant="ghost" size="sm" icon="bx bx-minus-circle"
              onClick={() => setDespModal(true)}>
              Lançar despesa
            </Button>
            <Button variant="dark" size="sm" icon="bx bx-lock"
              onClick={() => setFechModal(true)}>
              Fechar caixa
            </Button>
          </div>
        }
      />

      <div className={styles.body}>

        {/* ── Filtro de período ─────────────────────── */}
        <div className={styles.periodoRow}>
          {PERIODOS.map(p => (
            <button key={p.value}
              className={`${styles.chip} ${periodo === p.value ? styles['chip--active'] : ''}`}
              onClick={() => setPeriodo(p.value)}>
              {p.label}
            </button>
          ))}
        </div>

        {/* ── KPI Row ───────────────────────────────── */}
        <div className={styles.kpiRow}>
          {loadingD ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Faturamento bruto"
                value={fmt(d?.totalFaturado ?? 0)}
                icon="bx bx-trending-up"
                variant="dark"
                delta={d?.variacaoFaturamento != null
                  ? `${d.variacaoFaturamento > 0 ? '+' : ''}${d.variacaoFaturamento.toFixed(1)}% vs anterior`
                  : undefined}
                deltaDir={d?.variacaoFaturamento != null
                  ? d.variacaoFaturamento >= 0 ? 'up' : 'down'
                  : 'neutral'}
                aosDelay={0}
              />
              <StatCard
                label="Comissões"
                value={fmt(d?.totalComissoes ?? 0)}
                icon="bx bx-dollar-circle"
                aosDelay={60}
              />
              <StatCard
                label="Despesas"
                value={fmt(d?.totalDespesas ?? 0)}
                icon="bx bx-minus-circle"
                variant={d?.totalDespesas ? 'danger' : 'light'}
                aosDelay={120}
              />
              <StatCard
                label="Lucro líquido"
                value={fmt(d?.lucroLiquido ?? 0)}
                icon="bx bx-wallet-alt"
                variant={(d?.lucroLiquido ?? 0) >= 0 ? 'light' : 'danger'}
                sub={`${d?.atendimentos ?? 0} atendimentos`}
                aosDelay={180}
              />
            </>
          )}
        </div>

        {/* ── Tabs ──────────────────────────────────── */}
        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.value}
              className={`${styles.tab} ${tab === t.value ? styles['tab--active'] : ''}`}
              onClick={() => setTab(t.value)}>
              <i className={t.icon} />{t.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════
            Tab: VISÃO GERAL
        ════════════════════════════════════════════ */}
        {tab === 'visao' && (
          <div className={styles.visaoGrid}>

            {/* Distribuição */}
            <div className={styles.card} data-aos="fade-up">
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}><i className="bx bx-pie-chart-alt-2" />Distribuição</h3>
              </div>
              <div className={styles.cardBody}>
                {loadingD ? (
                  Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={2} />)
                ) : (
                  <>
                    <DistBar label="Faturamento bruto" valor={d?.totalFaturado  ?? 0} total={d?.totalFaturado ?? 1} color="#2D7A4E" />
                    <DistBar label="Comissões"          valor={d?.totalComissoes ?? 0} total={d?.totalFaturado ?? 1} color="#C58524" />
                    <DistBar label="Despesas"           valor={d?.totalDespesas  ?? 0} total={d?.totalFaturado ?? 1} color="#C13838" />
                    <div className={styles.lucroBox}>
                      <span>Lucro líquido</span>
                      <span className={`${styles.lucroVal} ${(d?.lucroLiquido ?? 0) < 0 ? styles.lucroNeg : ''}`}>
                        {fmt(d?.lucroLiquido ?? 0)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Ticket médio */}
            <div className={styles.card} data-aos="fade-up" data-aos-delay="60">
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}><i className="bx bx-receipt" />Ticket médio</h3>
              </div>
              <div className={styles.ticketBox}>
                <div className={styles.ticketHero}>
                  <span className={styles.ticketVal}>{fmt(d?.ticketMedio ?? 0)}</span>
                  <span className={styles.ticketLabel}>por atendimento</span>
                </div>
                <div className={styles.ticketSub}>
                  <span><i className="bx bx-scissors" />{d?.atendimentos ?? 0} atendimentos no período</span>
                </div>
              </div>
            </div>

            {/* Por barbeiro */}
            <div className={`${styles.card} ${styles.cardFull}`} data-aos="fade-up" data-aos-delay="100">
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}><i className="bx bx-user" />Faturamento por barbeiro</h3>
              </div>
              <div className={styles.barberList}>
                {loadingD ? (
                  Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
                ) : !d?.porBarbeiro.length ? (
                  <EmptyState icon="bx bx-user-x" title="Sem dados" size="sm" />
                ) : (
                  d.porBarbeiro.map((b, i) => {
                    const barb     = barbMap[b.barbeiroId]
                    const gradient = barb ? getAvatarGradient(barb.nome) : '#8A6034'
                    const initials = barb ? getInitials(barb.nome) : '?'
                    const pct      = d.totalFaturado > 0
                      ? (b.faturamento / d.totalFaturado) * 100
                      : 0

                    return (
                      <div key={b.barbeiroId} className={styles.barberItem}>
                        <span className={styles.barberRank}>{i + 1}</span>
                        <div className={styles.barberAvatar} style={{ background: gradient }} aria-hidden="true">
                          <span>{initials}</span>
                        </div>
                        <div className={styles.barberInfo}>
                          <span className={styles.barberNome}>{barb?.nome ?? 'Barbeiro'}</span>
                          <div className={styles.barberBar}>
                            <div className={styles.barberBarFill} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className={styles.barberValores}>
                          <span className={styles.barberFat}>{fmt(b.faturamento)}</span>
                          <span className={styles.barberAtend}>{b.atendimentos} atend.</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            Tab: DESPESAS
        ════════════════════════════════════════════ */}
        {tab === 'despesas' && (
          <div className={styles.card} data-aos="fade-up">
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}><i className="bx bx-minus-circle" />Despesas</h3>
              <Button variant="soft" size="sm" icon="bx bx-plus" onClick={() => setDespModal(true)}>
                Nova despesa
              </Button>
            </div>
            <div className={styles.despList}>
              {loadingDe ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
              ) : despesas.length === 0 ? (
                <EmptyState icon="bx bx-receipt" title="Sem despesas no período" size="sm"
                  action={{ label: 'Lançar despesa', icon: 'bx bx-plus', onClick: () => setDespModal(true) }} />
              ) : (
                despesas.map(de => (
                  <div key={de.id} className={styles.despItem}>
                    <div className={styles.despIcon} aria-hidden="true">
                      <i className="bx bx-minus-circle" />
                    </div>
                    <div className={styles.despInfo}>
                      <span className={styles.despDesc}>{de.descricao}</span>
                      <div className={styles.despMeta}>
                        {de.categoria && <span className={styles.despCat}>{de.categoria}</span>}
                        <span>{fmtDate(de.data)}</span>
                        {de.observacoes && <span className={styles.despObs}>{de.observacoes}</span>}
                      </div>
                    </div>
                    <span className={styles.despValor}>{fmt(de.valor)}</span>
                    <button className={styles.deleteBtn}
                      onClick={() => { setDeleteId(de.id); setDeleteOpen(true) }}
                      title="Remover" aria-label={`Remover despesa ${de.descricao}`}>
                      <i className="bx bx-trash" />
                    </button>
                  </div>
                ))
              )}
            </div>
            {despesas.length > 0 && (
              <div className={styles.despTotal}>
                <span>Total</span>
                <span className={styles.despTotalVal}>
                  {fmt(despesas.reduce((s, d) => s + d.valor, 0))}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════
            Tab: COMISSÕES
        ════════════════════════════════════════════ */}
        {tab === 'comissoes' && (
          <div className={styles.card} data-aos="fade-up">
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}><i className="bx bx-dollar-circle" />Comissões por barbeiro</h3>
            </div>
            <div className={styles.comissaoResumList}>
              {loadingD ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
              ) : !d?.porBarbeiro.length ? (
                <EmptyState icon="bx bx-dollar" title="Sem comissões no período" size="sm" />
              ) : (
                d.porBarbeiro.map(b => {
                  const barb     = barbMap[b.barbeiroId]
                  const gradient = barb ? getAvatarGradient(barb.nome) : '#8A6034'
                  const initials = barb ? getInitials(barb.nome) : '?'
                  const comissaoPct = barb?.comissaoPct ?? 50
                  const comissao    = b.faturamento * (comissaoPct / 100)

                  return (
                    <div key={b.barbeiroId} className={styles.comissaoResumItem}>
                      <div className={styles.comissaoAvatar} style={{ background: gradient }} aria-hidden="true">
                        <span>{initials}</span>
                      </div>
                      <div className={styles.comissaoInfo}>
                        <span className={styles.comissaoNome}>{barb?.nome ?? 'Barbeiro'}</span>
                        <span className={styles.comissaoBase}>
                          {fmt(b.faturamento)} faturado · {comissaoPct}%
                        </span>
                      </div>
                      <div className={styles.comissaoRight}>
                        <span className={styles.comissaoTotal}>{fmt(comissao)}</span>
                        <span className={styles.comissaoLabel}>a repassar</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════
            Tab: FECHAMENTO
        ════════════════════════════════════════════ */}
        {tab === 'fechamento' && (
          <div className={styles.card} data-aos="fade-up">
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}><i className="bx bx-lock" />Fechamentos de caixa</h3>
              <Button variant="dark" size="sm" icon="bx bx-lock"
                onClick={() => setFechModal(true)}>
                Fechar hoje
              </Button>
            </div>
            <div className={styles.fechList}>
              {loadingF ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
              ) : fechamentos.length === 0 ? (
                <EmptyState icon="bx bx-lock" title="Sem fechamentos no período"
                  description="Feche o caixa ao final de cada dia para registrar o resumo financeiro."
                  size="sm"
                  action={{ label: 'Fechar caixa hoje', icon: 'bx bx-lock', onClick: () => setFechModal(true) }}
                />
              ) : (
                fechamentos.map(f => (
                  <div key={f.id} className={styles.fechItem}>
                    <div className={styles.fechData}>
                      <span className={styles.fechDia}>{fmtShort(f.data)}</span>
                      <span className={styles.fechAtend}>{f.qtdAtendimentos} atend.</span>
                    </div>
                    <div className={styles.fechValores}>
                      <div className={styles.fechValItem}>
                        <span>Faturado</span>
                        <span>{fmt(f.totalFaturado)}</span>
                      </div>
                      <div className={styles.fechValItem}>
                        <span>Comissões</span>
                        <span className={styles.fechWarn}>-{fmt(f.totalComissoes)}</span>
                      </div>
                      <div className={styles.fechValItem}>
                        <span>Despesas</span>
                        <span className={styles.fechDanger}>-{fmt(f.totalDespesas)}</span>
                      </div>
                    </div>
                    <div className={styles.fechLiquido}>
                      <span className={styles.fechLiquidoVal}>{fmt(f.totalLiquido)}</span>
                      <span className={styles.fechLiquidoLabel}>líquido</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <Modal open={despModal} onClose={() => setDespModal(false)} title="Lançar despesa" size="md">
        <DespesaForm onSubmit={handleDespesa} onClose={() => setDespModal(false)} saving={savingD} />
      </Modal>

      <ModalConfirm
        open={fechModal}
        onClose={() => setFechModal(false)}
        onConfirm={handleFechamento}
        loading={fechLoading}
        title="Fechar caixa do dia"
        message="Fechar o caixa de hoje? Um resumo financeiro será gerado automaticamente com faturamento, comissões e despesas do dia."
        confirmLabel="Sim, fechar caixa"
      />

      <ModalConfirm
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteDespesa}
        loading={deleteLoading}
        title="Remover despesa"
        message="Remover esta despesa? A ação não pode ser desfeita."
        confirmLabel="Sim, remover"
      />
    </div>
  )
}