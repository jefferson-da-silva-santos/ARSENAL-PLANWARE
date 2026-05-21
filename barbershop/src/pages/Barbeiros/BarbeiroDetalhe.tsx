import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { barbeirosApi } from '../../services/barbeirosApi'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import StatCard from '../../components/ui/StatCard/StatCard'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { SkeletonStatCard, SkeletonRow } from '../../components/ui/Skeleton/Skeleton'
import { NivelBadge } from '../../components/ui/Badge/Badge'
import { ModalConfirm } from '../../components/ui/Modal/Modal'
import { getAvatarGradient, getInitials } from '../../utils/avatarHelper'
import type { DesempenhoBarbeiro, Comissao, Bloqueio } from '../../types'
import styles from './Barbeiros.module.scss'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─────────────────────────────────────────────────────────────
//  Progress bar de meta
// ─────────────────────────────────────────────────────────────

function MetaBar({ label, value, meta, formatter }: {
  label    : string
  value    : number
  meta     : number
  formatter: (v: number) => string
}) {
  const pct = Math.min((value / meta) * 100, 100)
  const cor = pct >= 100 ? '#2D7A4E' : pct >= 60 ? '#C58524' : '#C13838'

  return (
    <div className={styles.metaBar}>
      <div className={styles.metaBarHeader}>
        <span className={styles.metaBarLabel}>{label}</span>
        <span className={styles.metaBarValues}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatter(value)}</span>
          <span className={styles.metaBarDivider}>/</span>
          <span className={styles.metaBarMeta}>{formatter(meta)}</span>
        </span>
      </div>
      <div className={styles.metaBarTrack}>
        <div
          className={styles.metaBarFill}
          style={{ width: `${pct}%`, background: cor }}
        />
      </div>
      <span className={styles.metaBarPct}>{pct.toFixed(0)}%</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Tabs
// ─────────────────────────────────────────────────────────────

type Tab = 'desempenho' | 'comissoes' | 'bloqueios'

// ─────────────────────────────────────────────────────────────
//  Página
// ─────────────────────────────────────────────────────────────

export default function BarbeiroDetalhe() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const toast     = useToast()

  const [barbeiro,    setBarbeiro]    = useState<any | null>(null)
  const [desempenho,  setDesempenho]  = useState<DesempenhoBarbeiro | null>(null)
  const [comissoes,   setComissoes]   = useState<Comissao[]>([])
  const [bloqueios,   setBloqueios]   = useState<Bloqueio[]>([])

  const [loadingB,  setLoadingB]  = useState(true)
  const [loadingD,  setLoadingD]  = useState(true)
  const [loadingC,  setLoadingC]  = useState(false)
  const [loadingBl, setLoadingBl] = useState(false)

  const [tab,       setTab]       = useState<Tab>('desempenho')

  // Repassar comissões
  const [selectedIds,    setSelectedIds]   = useState<string[]>([])
  const [confirmRepasse, setConfirmRepasse] = useState(false)
  const [repasseLoading, setRepasseLoading] = useState(false)

  useAOSRefresh(tab)

  // ── Carrega dados base ────────────────────────────────────
  useEffect(() => {
    if (!id) return
    setLoadingB(true)
    setLoadingD(true)

    Promise.allSettled([
      barbeirosApi.get(id),
      barbeirosApi.getDesempenho(id),
    ]).then(([b, d]) => {
      if (b.status === 'fulfilled') setBarbeiro(b.value.data.data)
      else { toast.error('Barbeiro não encontrado'); navigate('/barbeiros') }
      if (d.status === 'fulfilled') setDesempenho(d.value.data.data)
    }).finally(() => { setLoadingB(false); setLoadingD(false) })
  }, [id, navigate, toast])

  // ── Carrega dados da aba ──────────────────────────────────
  useEffect(() => {
    if (!id) return
    if (tab === 'comissoes') {
      setLoadingC(true)
      barbeirosApi.listComissoes(id, { repassado: false })
        .then(r => setComissoes(r.data.data))
        .catch(() => toast.error('Erro ao carregar comissões'))
        .finally(() => setLoadingC(false))
    }
    if (tab === 'bloqueios') {
      setLoadingBl(true)
      barbeirosApi.listBloqueios(id)
        .then(r => setBloqueios(r.data.data))
        .catch(() => toast.error('Erro ao carregar bloqueios'))
        .finally(() => setLoadingBl(false))
    }
  }, [id, tab, toast])

  // ── Marcar repasse ────────────────────────────────────────
  async function handleRepasse() {
    if (!id || selectedIds.length === 0) return
    setRepasseLoading(true)
    try {
      const r = await barbeirosApi.marcarRepassadas(id, selectedIds)
      toast.success(`${r.data.data.repassadas} comissão(ões) marcadas como repassadas`)
      setSelectedIds([])
      setConfirmRepasse(false)
      // Recarrega comissões
      const rc = await barbeirosApi.listComissoes(id, { repassado: false })
      setComissoes(rc.data.data)
    } catch {
      toast.error('Erro ao marcar repasse')
    } finally {
      setRepasseLoading(false)
    }
  }

  function toggleSelect(comId: string) {
    setSelectedIds(prev =>
      prev.includes(comId) ? prev.filter(i => i !== comId) : [...prev, comId]
    )
  }

  const totalSelecionado = comissoes
    .filter(c => selectedIds.includes(c.id))
    .reduce((s, c) => s + c.valorComissao, 0)

  if (loadingB) {
    return (
      <div className={styles.page}>
        <div className={styles.body}>
          <div className={styles.kpiRow}>
            {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!barbeiro) return null

  const gradient = getAvatarGradient(barbeiro.nome)
  const initials = getInitials(barbeiro.nome)
  const d        = desempenho

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Equipe / Barbeiros"
        title={barbeiro.nome}
        subtitle={`Nível ${barbeiro.nivel.charAt(0) + barbeiro.nivel.slice(1).toLowerCase()}`}
        actions={
          <Button variant="ghost" icon="bx bx-arrow-back" onClick={() => navigate('/barbeiros')}>
            Voltar
          </Button>
        }
      />

      <div className={styles.body}>

        {/* ── Hero do barbeiro ──────────────────────── */}
        <div className={styles.barbeiroHero} data-aos="fade-up">
          <div className={styles.barbeiroHeroLeft}>
            <div
              className={styles.barbeiroAvatar}
              style={{ background: gradient }}
              aria-hidden="true"
            >
              <span>{initials}</span>
            </div>
            <div className={styles.barbeiroInfo}>
              <div className={styles.barbeiroInfoRow}>
                <h2 className={styles.barbeiroNome}>{barbeiro.nome}</h2>
                <NivelBadge nivel={barbeiro.nivel} />
              </div>
              <div className={styles.barbeiroMeta}>
                {barbeiro.telefone && (
                  <span><i className="bx bx-phone" />{barbeiro.telefone}</span>
                )}
                {barbeiro.email && (
                  <span><i className="bx bx-envelope" />{barbeiro.email}</span>
                )}
                {barbeiro.comissaoPct && (
                  <span><i className="bx bx-percent" />{barbeiro.comissaoPct}% comissão</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Row ───────────────────────────────── */}
        <div className={styles.kpiRow}>
          {loadingD ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          ) : (
            <>
              <StatCard
                label="Faturamento do mês"
                value={fmt(d?.financeiro.totalFaturado ?? 0)}
                icon="bx bx-wallet-alt"
                variant="dark"
                aosDelay={0}
              />
              <StatCard
                label="Ticket médio"
                value={fmt(d?.financeiro.ticketMedio ?? 0)}
                icon="bx bx-trending-up"
                aosDelay={60}
              />
              <StatCard
                label="Atendimentos"
                value={d?.atendimentos.concluidos ?? 0}
                icon="bx bx-scissors"
                sub={`${d?.atendimentos.cancelados ?? 0} cancelados`}
                aosDelay={120}
              />
              <StatCard
                label="Avaliação média"
                value={`${(d?.avaliacao.media ?? 0).toFixed(1)} ★`}
                icon="bx bxs-star"
                sub={`${d?.avaliacao.totalAvaliacoes ?? 0} avaliações`}
                aosDelay={180}
              />
            </>
          )}
        </div>

        {/* ── Metas ─────────────────────────────────── */}
        {!loadingD && (barbeiro.metaMensal || barbeiro.metaCortes) && (
          <div className={styles.card} data-aos="fade-up" data-aos-delay="100">
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>
                <i className="bx bx-target-lock" />Progresso das metas
              </h3>
            </div>
            <div className={styles.cardBody}>
              {barbeiro.metaMensal && (
                <MetaBar
                  label="Meta de faturamento"
                  value={d?.financeiro.totalFaturado ?? 0}
                  meta={barbeiro.metaMensal}
                  formatter={fmt}
                />
              )}
              {barbeiro.metaCortes && (
                <MetaBar
                  label="Meta de cortes"
                  value={d?.atendimentos.concluidos ?? 0}
                  meta={barbeiro.metaCortes}
                  formatter={v => `${v}`}
                />
              )}
            </div>
          </div>
        )}

        {/* ── Tabs ──────────────────────────────────── */}
        <div className={styles.tabs}>
          {(['desempenho', 'comissoes', 'bloqueios'] as Tab[]).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles['tab--active'] : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'desempenho' && <><i className="bx bx-bar-chart-alt-2" />Desempenho</>}
              {t === 'comissoes'  && <><i className="bx bx-dollar-circle" />Comissões</>}
              {t === 'bloqueios'  && <><i className="bx bx-block" />Bloqueios</>}
            </button>
          ))}
        </div>

        {/* ── Tab: Desempenho ───────────────────────── */}
        {tab === 'desempenho' && (
          <div className={styles.card} data-aos="fade-up">
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}><i className="bx bx-list-check" />Serviços mais realizados</h3>
            </div>
            <div className={styles.rankList}>
              {loadingD ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
              ) : !d?.servicosMaisFeitos.length ? (
                <EmptyState icon="bx bx-scissors" title="Sem dados de serviços" size="sm" />
              ) : (
                d.servicosMaisFeitos.map((s, i) => (
                  <div key={s.servicoId} className={styles.rankItem}>
                    <span className={styles.rankPos}>{i + 1}</span>
                    <div className={styles.rankInfo}>
                      <span className={styles.rankName}>Serviço #{s.servicoId.slice(-6)}</span>
                      <span className={styles.rankSub}>{s.quantidade} realizações</span>
                    </div>
                    <span className={styles.rankVal}>{fmt(s.totalFaturado)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Comissões ────────────────────────── */}
        {tab === 'comissoes' && (
          <div className={styles.card} data-aos="fade-up">
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}><i className="bx bx-dollar-circle" />Comissões a repassar</h3>
              {selectedIds.length > 0 && (
                <div className={styles.cardHeadRight}>
                  <span className={styles.selectedTotal}>
                    {fmt(totalSelecionado)} selecionados
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    icon="bx bx-check-double"
                    onClick={() => setConfirmRepasse(true)}
                  >
                    Marcar como repassado
                  </Button>
                </div>
              )}
            </div>
            <div className={styles.comissaoList}>
              {loadingC ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={4} />)
              ) : comissoes.length === 0 ? (
                <EmptyState
                  icon="bx bx-check-circle"
                  title="Tudo em dia"
                  description="Não há comissões pendentes de repasse."
                  size="sm"
                />
              ) : (
                comissoes.map(c => (
                  <div
                    key={c.id}
                    className={`${styles.comissaoItem} ${selectedIds.includes(c.id) ? styles['comissaoItem--selected'] : ''}`}
                    onClick={() => toggleSelect(c.id)}
                    role="checkbox"
                    aria-checked={selectedIds.includes(c.id)}
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') toggleSelect(c.id) }}
                  >
                    <div className={`${styles.checkbox} ${selectedIds.includes(c.id) ? styles['checkbox--checked'] : ''}`}>
                      {selectedIds.includes(c.id) && <i className="bx bx-check" />}
                    </div>
                    <div className={styles.comissaoInfo}>
                      <span className={styles.comissaoServico}>
                        {c.agendamento?.servico?.nome ?? 'Serviço'}
                      </span>
                      <span className={styles.comissaoData}>
                        {c.agendamento?.dataHora ? fmtDateTime(c.agendamento.dataHora) : '—'}
                      </span>
                    </div>
                    <div className={styles.comissaoValores}>
                      <span className={styles.comissaoBase}>{fmt(c.valorServico)}</span>
                      <span className={styles.comissaoPct}>{c.percentual}%</span>
                      <span className={styles.comissaoTotal}>{fmt(c.valorComissao)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Tab: Bloqueios ────────────────────────── */}
        {tab === 'bloqueios' && (
          <div className={styles.card} data-aos="fade-up">
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}><i className="bx bx-block" />Bloqueios de agenda</h3>
            </div>
            <div className={styles.bloqueioList}>
              {loadingBl ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
              ) : bloqueios.length === 0 ? (
                <EmptyState
                  icon="bx bx-calendar-check"
                  title="Sem bloqueios"
                  description="A agenda do barbeiro está completamente livre."
                  size="sm"
                />
              ) : (
                bloqueios.map(bl => (
                  <div key={bl.id} className={styles.bloqueioItem}>
                    <div className={styles.bloqueioTipo}>
                      <i className={
                        bl.tipo === 'FERIAS' ? 'bx bx-sun' :
                        bl.tipo === 'FOLGA'  ? 'bx bx-coffee' :
                        bl.tipo === 'PAUSA'  ? 'bx bx-time' : 'bx bx-block'
                      } />
                      {bl.tipo.charAt(0) + bl.tipo.slice(1).toLowerCase()}
                    </div>
                    <div className={styles.bloqueioInfo}>
                      <span>{fmtDateTime(bl.inicio)}</span>
                      <i className="bx bx-right-arrow-alt" />
                      <span>{fmtDateTime(bl.fim)}</span>
                    </div>
                    {bl.motivo && (
                      <span className={styles.bloqueioMotivo}>{bl.motivo}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Confirm repasse ───────────────────────── */}
      <ModalConfirm
        open={confirmRepasse}
        onClose={() => setConfirmRepasse(false)}
        onConfirm={handleRepasse}
        loading={repasseLoading}
        title="Confirmar repasse"
        message={`Confirmar repasse de ${fmt(totalSelecionado)} para ${barbeiro.nome}? Esta ação não pode ser desfeita.`}
        confirmLabel="Confirmar repasse"
      />
    </div>
  )
}