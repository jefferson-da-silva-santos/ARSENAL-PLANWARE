import { useState, useEffect, useCallback, useRef } from 'react'
import { feedbacksApi } from '@/services/feedbacksApi'
import type { Feedback, FeedbackType, FeedbackStatus } from '@/services/feedbacksApi'
import PageHeader from '@/components/PageHeader/PageHeader'
import StatCard from '@/components/StatCard/StatCard'
import styles from './Feedbacks.module.scss'

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `${m}m atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}

const TYPE_CONFIG: Record<FeedbackType, { label: string; icon: string; cls: string }> = {
  BUG: { label: 'Bug', icon: 'bx-bug', cls: 'typeBug' },
  FEATURE: { label: 'Feature', icon: 'bx-bulb', cls: 'typeFeature' },
  REQUISITO: { label: 'Requisito', icon: 'bx-list-check', cls: 'typeRequisito' },
  OUTRO: { label: 'Outro', icon: 'bx-chat', cls: 'typeOutro' },
}

const STATUS_CONFIG: Record<FeedbackStatus, { label: string; cls: string }> = {
  ABERTO: { label: 'Aberto', cls: 'statusAberto' },
  EM_ANALISE: { label: 'Em análise', cls: 'statusAnalise' },
  RESOLVIDO: { label: 'Resolvido', cls: 'statusResolvido' },
  RECUSADO: { label: 'Recusado', cls: 'statusRecusado' },
}

const STATUS_NEXT: Partial<Record<FeedbackStatus, FeedbackStatus[]>> = {
  ABERTO: ['EM_ANALISE', 'RESOLVIDO', 'RECUSADO'],
  EM_ANALISE: ['RESOLVIDO', 'RECUSADO', 'ABERTO'],
  RESOLVIDO: ['ABERTO', 'EM_ANALISE'],
  RECUSADO: ['ABERTO', 'EM_ANALISE'],
}

function TypeBadge({ type }: { type: FeedbackType }) {
  const cfg = TYPE_CONFIG[type]
  return (
    <span className={`${styles.typeBadge} ${styles[cfg.cls]}`}>
      <i className={`bx ${cfg.icon}`} />
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: FeedbackStatus }) {
  const cfg = STATUS_CONFIG[status]
  return <span className={`${styles.statusBadge} ${styles[cfg.cls]}`}>{cfg.label}</span>
}

// ─────────────────────────────────────────────────────────────
//  DRAWER DE DETALHE
// ─────────────────────────────────────────────────────────────

interface DetailDrawerProps {
  feedback: Feedback
  onClose: () => void
  onUpdated: (fb: Feedback) => void
  onDeleted: (id: string) => void
}

function DetailDrawer({ feedback, onClose, onUpdated, onDeleted }: DetailDrawerProps) {
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [replies, setReplies] = useState(feedback.replies ?? [])
  const [status, setStatus] = useState<FeedbackStatus>(feedback.status)
  const [showStatus, setShowStatus] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!reply.trim()) return
    setSending(true)
    try {
      const res = await feedbacksApi.reply(feedback.id, reply.trim())
      setReplies(r => [...r, res.data.data])
      setReply('')
      onUpdated({ ...feedback, status, replies: [...replies, res.data.data] })
    } finally {
      setSending(false)
    }
  }

  async function handleStatusChange(newStatus: FeedbackStatus) {
    setUpdating(true)
    setShowStatus(false)
    try {
      const res = await feedbacksApi.updateStatus(feedback.id, newStatus)
      setStatus(newStatus)
      onUpdated(res.data.data)
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Excluir o feedback "${feedback.title}"?`)) return
    setDeleting(true)
    try {
      await feedbacksApi.delete(feedback.id)
      onDeleted(feedback.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className={styles.drawerOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawer}>

        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderLeft}>
            <TypeBadge type={feedback.type} />
            <StatusBadge status={status} />
          </div>
          <button className={styles.drawerClose} onClick={onClose}>
            <i className="bx bx-x" />
          </button>
        </div>

        <div className={styles.drawerBody}>

          {/* Título e descrição */}
          <div className={styles.drawerSection}>
            <h3 className={styles.drawerTitle}>{feedback.title}</h3>
            <p className={styles.drawerDesc}>{feedback.description}</p>
          </div>

          {/* Meta */}
          <div className={styles.drawerMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Enviado por</span>
              <span className={styles.metaValue}>{feedback.user?.name ?? '—'}</span>
              <span className={styles.metaSub}>{feedback.user?.email}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Empresa</span>
              <span className={styles.metaValue}>{feedback.tenant?.name ?? '—'}</span>
              <span className={styles.metaSub}>/{feedback.tenant?.slug}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Aberto em</span>
              <span className={styles.metaValue}>{fmtDate(feedback.createdAt)}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Última atualização</span>
              <span className={styles.metaValue}>{fmtDate(feedback.updatedAt)}</span>
            </div>
          </div>

          {/* Alterar status */}
          <div className={styles.statusSection}>
            <span className={styles.statusSectionLabel}>Status</span>
            <div className={styles.statusControl}>
              <StatusBadge status={status} />
              <div className={styles.statusDropdownWrap}>
                <button
                  className={styles.btnOutline}
                  onClick={() => setShowStatus(s => !s)}
                  disabled={updating}
                >
                  {updating
                    ? <i className="bx bx-loader-alt bx-spin" />
                    : <><i className="bx bx-transfer-alt" /> Alterar</>
                  }
                </button>
                {showStatus && (
                  <div className={styles.statusDropdown}>
                    {(STATUS_NEXT[status] ?? []).map(s => (
                      <button
                        key={s}
                        className={styles.statusOption}
                        onClick={() => handleStatusChange(s)}
                      >
                        <span className={`${styles.statusDot} ${styles[STATUS_CONFIG[s].cls]}`} />
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Histórico de respostas */}
          <div className={styles.drawerSection}>
            <h4 className={styles.drawerSectionTitle}>
              <i className="bx bx-message-square-detail" />
              Respostas ({replies.length})
            </h4>

            {replies.length === 0 ? (
              <div className={styles.noReplies}>
                <i className="bx bx-message-square-x" />
                <span>Nenhuma resposta ainda</span>
              </div>
            ) : (
              <div className={styles.repliesList}>
                {replies.map(r => (
                  <div
                    key={r.id}
                    className={`${styles.replyBubble} ${r.user.role === 'SUPERADMIN' ? styles.replyAdmin : styles.replyUser}`}
                  >
                    <div className={styles.replyHeader}>
                      <span className={styles.replyAuthor}>
                        {r.user.name}
                        {r.user.role === 'SUPERADMIN' && (
                          <span className={styles.adminTag}>Admin</span>
                        )}
                      </span>
                      <span className={styles.replyDate}>{fmtDate(r.createdAt)}</span>
                    </div>
                    <p className={styles.replyText}>{r.message}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Form de resposta */}
            <form className={styles.replyForm} onSubmit={handleSendReply}>
              <textarea
                ref={textareaRef}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Escreva uma resposta ao cliente..."
                rows={3}
                disabled={sending}
              />
              <div className={styles.replyFormActions}>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={sending || !reply.trim()}
                >
                  {sending
                    ? <><i className="bx bx-loader-alt bx-spin" /> Enviando...</>
                    : <><i className="bx bx-send" /> Responder</>
                  }
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <button
            className={styles.btnDanger}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting
              ? <i className="bx bx-loader-alt bx-spin" />
              : <i className="bx bx-trash" />
            }
            Excluir feedback
          </button>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Feedback | null>(null)

  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTenant, setFilterTenant] = useState('')
  const [search, setSearch] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    feedbacksApi.list({
      type: filterType || undefined,
      status: filterStatus || undefined,
      tenantId: filterTenant || undefined,
    })
      .then((r: any) => setFeedbacks(r.data.data))
      .finally(() => setLoading(false))
  }, [filterType, filterStatus, filterTenant])

  useEffect(() => { load() }, [load])

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current)
    }
    setSearch(e.target.value)
    searchTimer.current = setTimeout(() => { }, 300)
  }

  const filtered = feedbacks.filter(fb => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      fb.title.toLowerCase().includes(q) ||
      fb.description.toLowerCase().includes(q) ||
      fb.user?.name?.toLowerCase().includes(q) ||
      fb.tenant?.name?.toLowerCase().includes(q)
    )
  })

  function handleUpdated(updated: Feedback) {
    setFeedbacks(prev => prev.map(fb => fb.id === updated.id ? { ...fb, ...updated } : fb))
    if (selected?.id === updated.id) setSelected({ ...selected, ...updated })
  }

  function handleDeleted(id: string) {
    setFeedbacks(prev => prev.filter(fb => fb.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  // ── Stats ──────────────────────────────────────────────────
  const total = feedbacks.length
  const abertos = feedbacks.filter(f => f.status === 'ABERTO').length
  const analise = feedbacks.filter(f => f.status === 'EM_ANALISE').length
  const bugs = feedbacks.filter(f => f.type === 'BUG').length

  return (
    <div className={styles.page}>
      <PageHeader
        title="Feedbacks & Sugestões"
        subtitle="Solicitações enviadas pelos clientes via Planware Hub"
        actions={
          <button className={styles.btnGhost} onClick={load}>
            <i className="bx bx-refresh" /> Atualizar
          </button>
        }
      />

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Total"
          value={loading ? '—' : total}
          icon="bx-message-square-detail"
          accent="rgba(99,102,241,.15)"
        />
        <StatCard
          label="Abertos"
          value={loading ? '—' : abertos}
          icon="bx-envelope-open"
          accent="rgba(234,179,8,.15)"
          sub={abertos > 0 ? 'Aguardando resposta' : 'Nenhum pendente'}
        />
        <StatCard
          label="Em análise"
          value={loading ? '—' : analise}
          icon="bx-search-alt"
          accent="rgba(59,130,246,.15)"
        />
        <StatCard
          label="Bugs reportados"
          value={loading ? '—' : bugs}
          icon="bx-bug"
          accent="rgba(239,68,68,.15)"
        />
      </div>

      {/* ── Filtros ── */}
      <div className={styles.filtersBar}>
        <div className={styles.searchWrap}>
          <i className="bx bx-search" />
          <input
            className={styles.searchInput}
            placeholder="Buscar por título, usuário ou empresa..."
            value={search}
            onChange={handleSearch}
          />
          {search && (
            <button onClick={() => setSearch('')}>
              <i className="bx bx-x" />
            </button>
          )}
        </div>

        <select
          className={styles.filterSelect}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="ABERTO">Aberto</option>
          <option value="EM_ANALISE">Em análise</option>
          <option value="RESOLVIDO">Resolvido</option>
          <option value="RECUSADO">Recusado</option>
        </select>

        <select
          className={styles.filterSelect}
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="BUG">Bug</option>
          <option value="FEATURE">Feature</option>
          <option value="REQUISITO">Requisito</option>
          <option value="OUTRO">Outro</option>
        </select>

        {(filterType || filterStatus || filterTenant || search) && (
          <button
            className={styles.btnGhost}
            onClick={() => {
              setFilterType('')
              setFilterStatus('')
              setFilterTenant('')
              setSearch('')
            }}
          >
            <i className="bx bx-x" /> Limpar filtros
          </button>
        )}
      </div>

      {/* ── Lista ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <span className={styles.tableTitle}>
            <i className="bx bx-list-ul" />
            {filtered.length} feedback{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className={styles.skeletonRows}>
            {[...Array(6)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="bx bx-message-square-x" />
            <p>Nenhum feedback encontrado.</p>
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map(fb => (
              <div
                key={fb.id}
                className={`${styles.feedbackItem} ${fb.status === 'RESOLVIDO' || fb.status === 'RECUSADO' ? styles.feedbackItemDim : ''}`}
                onClick={() => setSelected(fb)}
              >
                {/* Ícone do tipo */}
                <div className={`${styles.typeIcon} ${styles[TYPE_CONFIG[fb.type].cls]}`}>
                  <i className={`bx ${TYPE_CONFIG[fb.type].icon}`} />
                </div>

                {/* Conteúdo */}
                <div className={styles.feedbackInfo}>
                  <div className={styles.feedbackHeader}>
                    <span className={styles.feedbackTitle}>{fb.title}</span>
                    <div className={styles.feedbackBadges}>
                      <TypeBadge type={fb.type} />
                      <StatusBadge status={fb.status} />
                    </div>
                  </div>
                  <p className={styles.feedbackDesc}>{fb.description}</p>
                  <div className={styles.feedbackMeta}>
                    <span>
                      <i className="bx bx-user" />
                      {fb.user?.name ?? '—'}
                    </span>
                    <span>
                      <i className="bx bx-buildings" />
                      {fb.tenant?.name ?? '—'}
                    </span>
                    <span>
                      <i className="bx bx-time" />
                      {timeAgo(fb.createdAt)}
                    </span>
                    {(fb.replies?.length ?? 0) > 0 && (
                      <span className={styles.replyCount}>
                        <i className="bx bx-message-square-check" />
                        {fb.replies!.length} resposta{fb.replies!.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <i className={`bx bx-chevron-right ${styles.arrowIcon}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Drawer ── */}
      {selected && (
        <DetailDrawer
          feedback={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  )
}