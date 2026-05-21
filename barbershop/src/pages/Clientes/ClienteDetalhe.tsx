import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useToast } from '../../hooks/useToast'
import { useAOSRefresh } from '../../hooks/useAOS'
import { clientesApi } from '../../services/clientesApi'
import { agendamentosApi } from '../../services/agendamentosApi'
import { fidelidadeApi } from '../../services/fidelidadeApi'
import PageHeader from '../../components/ui/PageHeader/PageHeader'
import Button from '../../components/ui/Button/Button'
import StatCard from '../../components/ui/StatCard/StatCard'
import EmptyState from '../../components/ui/EmptyState/EmptyState'
import { SkeletonStatCard, SkeletonCard } from '../../components/ui/Skeleton/Skeleton'
import { AssinaturaStatusBadge, AgendStatusBadge } from '../../components/ui/Badge/Badge'
import { getAvatarGradient, getInitials } from '../../components/domain/avatarHelper'
import AgendamentoCard from '../../components/domain/AgendamentoCard/AgendamentoCard'
import type { Cliente, Agendamento, Resgate, Recompensa } from '../../types'
import styles from './Clientes.module.scss'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

type Tab = 'historico' | 'fidelidade'

// ─────────────────────────────────────────────────────────────
//  Página
// ─────────────────────────────────────────────────────────────

export default function ClienteDetalhe() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast    = useToast()

  const [cliente,      setCliente]      = useState<Cliente | null>(null)
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [resgates,     setResgates]     = useState<Resgate[]>([])
  const [recompensas,  setRecompensas]  = useState<Recompensa[]>([])

  const [loadingC,    setLoadingC]    = useState(true)
  const [loadingA,    setLoadingA]    = useState(false)
  const [loadingF,    setLoadingF]    = useState(false)

  const [tab, setTab] = useState<Tab>('historico')

  useAOSRefresh(tab)

  useEffect(() => {
    if (!id) return
    setLoadingC(true)
    clientesApi.get(id)
      .then(r => setCliente(r.data.data))
      .catch(() => { toast.error('Cliente não encontrado'); navigate('/clientes') })
      .finally(() => setLoadingC(false))
  }, [id, navigate, toast])

  useEffect(() => {
    if (!id) return
    if (tab === 'historico') {
      setLoadingA(true)
      agendamentosApi.list({ clienteId: id, perPage: 20 })
        .then(r => setAgendamentos(r.data.data.agendamentos))
        .finally(() => setLoadingA(false))
    }
    if (tab === 'fidelidade') {
      setLoadingF(true)
      Promise.allSettled([
        fidelidadeApi.getClienteFidelidade(id),
        fidelidadeApi.listRecompensas(),
      ]).then(([fl, rw]) => {
        if (fl.status === 'fulfilled') setResgates(fl.value.data.data.resgates)
        if (rw.status === 'fulfilled') setRecompensas(rw.value.data.data)
      }).finally(() => setLoadingF(false))
    }
  }, [id, tab])

  if (loadingC) {
    return (
      <div className={styles.page}>
        <div className={styles.body}>
          <div className={styles.kpiRow}>
            {Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!cliente) return null

  const gradient = getAvatarGradient(cliente.nome)
  const initials = getInitials(cliente.nome)

  const totalGasto = agendamentos
    .filter(a => a.status === 'CONCLUIDO')
    .reduce((s, a) => s + a.valorCobrado, 0)

  return (
    <div className={styles.page}>
      <PageHeader
        crumb="Clientes"
        title={cliente.nome}
        subtitle={`Cliente desde ${fmtDate(cliente.createdAt)}`}
        actions={
          <Button variant="ghost" icon="bx bx-arrow-back" onClick={() => navigate('/clientes')}>
            Voltar
          </Button>
        }
      />

      <div className={styles.body}>

        {/* ── Hero ────────────────────────────────── */}
        <div className={styles.clienteHero} data-aos="fade-up">
          <div className={styles.heroLeft}>
            <div className={styles.heroAvatar} style={{ background: gradient }} aria-hidden="true">
              <span>{initials}</span>
            </div>
            <div className={styles.heroInfo}>
              <div className={styles.heroNameRow}>
                <h2 className={styles.heroNome}>{cliente.nome}</h2>
                {cliente.assinaturaAtiva && (
                  <AssinaturaStatusBadge status={cliente.assinaturaAtiva.status} />
                )}
              </div>
              <div className={styles.heroMeta}>
                {cliente.telefone && (
                  <span><i className="bx bx-phone" />{cliente.telefone}</span>
                )}
                {cliente.email && (
                  <span><i className="bx bx-envelope" />{cliente.email}</span>
                )}
                {cliente.dataNascimento && (
                  <span><i className="bx bx-cake" />{fmtDate(cliente.dataNascimento)}</span>
                )}
              </div>
              {cliente.observacoes && (
                <p className={styles.heroObs}>{cliente.observacoes}</p>
              )}
            </div>
          </div>
        </div>

        {/* ── KPI Row ───────────────────────────────── */}
        <div className={styles.kpiRow}>
          <StatCard
            label="Total de visitas"
            value={cliente.totalVisitas}
            icon="bx bx-scissors"
            sub={`Última: ${fmtDate(cliente.ultimaVisita)}`}
            aosDelay={0}
          />
          <StatCard
            label="Pontos de fidelidade"
            value={cliente.pontosFidelidade}
            icon="bx bxs-star"
            aosDelay={60}
          />
          <StatCard
            label="Total investido"
            value={fmt(totalGasto)}
            icon="bx bx-wallet-alt"
            variant={totalGasto > 0 ? 'dark' : 'light'}
            aosDelay={120}
          />
        </div>

        {/* ── Tabs ──────────────────────────────────── */}
        <div className={styles.tabs}>
          {(['historico', 'fidelidade'] as Tab[]).map(t => (
            <button
              key={t}
              className={`${styles.tab} ${tab === t ? styles['tab--active'] : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'historico'  && <><i className="bx bx-history" />Histórico</>}
              {t === 'fidelidade' && <><i className="bx bxs-star" />Fidelidade</>}
            </button>
          ))}
        </div>

        {/* ── Tab: Histórico ──────────────────────── */}
        {tab === 'historico' && (
          <div className={styles.histList}>
            {loadingA ? (
              Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            ) : agendamentos.length === 0 ? (
              <EmptyState
                icon="bx bx-calendar-x"
                title="Sem histórico"
                description="Este cliente ainda não tem agendamentos registrados."
                size="sm"
              />
            ) : (
              agendamentos.map((a, i) => (
                <AgendamentoCard key={a.id} agendamento={a} compact aosDelay={i * 30} />
              ))
            )}
          </div>
        )}

        {/* ── Tab: Fidelidade ─────────────────────── */}
        {tab === 'fidelidade' && (
          <div className={styles.fidelidade} data-aos="fade-up">
            {/* Recompensas disponíveis */}
            {recompensas.length > 0 && (
              <div className={styles.card}>
                <div className={styles.cardHead}>
                  <h3 className={styles.cardTitle}>
                    <i className="bx bxs-gift" />Recompensas disponíveis
                  </h3>
                </div>
                <div className={styles.recompensaGrid}>
                  {recompensas.map(r => {
                    const podeResgatar = cliente.pontosFidelidade >= r.pontosNecessarios
                    return (
                      <div
                        key={r.id}
                        className={`${styles.recompensaCard} ${podeResgatar ? styles['recompensaCard--ok'] : ''}`}
                      >
                        <div className={styles.recompensaIcon} aria-hidden="true">
                          <i className="bx bxs-gift" />
                        </div>
                        <div className={styles.recompensaInfo}>
                          <strong>{r.nome}</strong>
                          {r.descricao && <span>{r.descricao}</span>}
                        </div>
                        <div className={styles.recompensaPontos}>
                          <span>{r.pontosNecessarios} pts</span>
                          {podeResgatar && (
                            <span className={styles.recompensaOk}>✓ Pode resgatar</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Histórico de resgates */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <h3 className={styles.cardTitle}><i className="bx bx-history" />Resgates realizados</h3>
              </div>
              {loadingF ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              ) : resgates.length === 0 ? (
                <EmptyState
                  icon="bx bxs-star"
                  title="Nenhum resgate ainda"
                  description="O cliente ainda não resgatou recompensas."
                  size="sm"
                />
              ) : (
                <div className={styles.resgateList}>
                  {resgates.map(r => (
                    <div key={r.id} className={styles.resgateItem}>
                      <i className="bx bxs-gift" aria-hidden="true" />
                      <div className={styles.resgateInfo}>
                        <span>{r.recompensa?.nome ?? 'Recompensa'}</span>
                        <span className={styles.resgateData}>
                          {fmtDate(r.createdAt)} · {r.pontosUsados} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}