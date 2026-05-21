import { useState, useEffect, useCallback, useRef } from 'react'
import { errorsApi } from '@/services/errorsApi'
import type { SystemError, ErrorStats, ErrorsListParams } from '@/services/errorsApi'
import PageHeader from '@/components/PageHeader/PageHeader'
import StatCard from '@/components/StatCard/StatCard'
import styles from './Errors.module.scss'

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const MODULES = [
  'AUTH', 'ADMIN', 'CLIENTPRO', 'STOCKPRO', 'FINVAULT',
  'FINFLOW', 'FINANCEFLOW', 'KANBAN', 'CLINICA', 'ORDEMTECH', 'FIADO', 'FEEDBACK',
]

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
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

function statusColor(code: number) {
  if (code >= 500) return styles.statusCritical
  if (code >= 400) return styles.statusWarning
  return styles.statusInfo
}

function methodColor(method: string) {
  const m: Record<string, string> = {
    GET: styles.methodGet, POST: styles.methodPost,
    PUT: styles.methodPut, PATCH: styles.methodPatch,
    DELETE: styles.methodDelete,
  }
  return m[method] ?? ''
}

// ─────────────────────────────────────────────────────────────
//  BADGE DE MÓDULO
// ─────────────────────────────────────────────────────────────
function ModuleBadge({ module }: { module: string }) {
  return <span className={`${styles.moduleBadge} ${styles[`mod${module}`] ?? ''}`}>{module}</span>
}

// ─────────────────────────────────────────────────────────────
//  PAINEL DE DETALHE (drawer lateral)
// ─────────────────────────────────────────────────────────────
interface DetailPanelProps {
  error: SystemError
  onClose: () => void
  onResolved: () => void
}

function DetailPanel({ error, onClose, onResolved }: DetailPanelProps) {
  const [full, setFull] = useState<SystemError | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [resolution, setResolution] = useState('')
  const [showResolveForm, setShowResolveForm] = useState(false)

  useEffect(() => {
    setLoading(true)
    errorsApi.get(error.id)
      .then((r: any) => setFull(r.data.data))
      .finally(() => setLoading(false))
  }, [error.id])

  async function handleResolve(all = false) {
    setResolving(true)
    try {
      await errorsApi.resolve(error.id, {
        resolution: resolution || undefined,
        fingerprint: all && error.fingerprint ? error.fingerprint : undefined,
      })
      onResolved()
      onClose()
    } finally {
      setResolving(false)
    }
  }

  async function handleUnresolve() {
    setResolving(true)
    try {
      await errorsApi.unresolve(error.id)
      onResolved()
      onClose()
    } finally {
      setResolving(false)
    }
  }

  const data = full ?? error

  return (
    <div className={styles.drawerOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.drawer}>
        {/* Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderLeft}>
            <span className={`${styles.statusBadge} ${statusColor(data.statusCode)}`}>
              {data.statusCode}
            </span>
            <span className={`${styles.methodTag} ${methodColor(data.method)}`}>
              {data.method}
            </span>
            <ModuleBadge module={data.module} />
          </div>
          <button className={styles.drawerClose} onClick={onClose}>
            <i className="bx bx-x" />
          </button>
        </div>

        <div className={styles.drawerBody}>
          {/* Mensagem */}
          <div className={styles.drawerSection}>
            <div className={styles.drawerErrorType}>{data.errorType}</div>
            <p className={styles.drawerMessage}>{data.message}</p>
            <div className={styles.drawerRoute}>
              <i className="bx bx-link" />
              {data.route}
            </div>
          </div>

          {/* Meta */}
          <div className={styles.drawerMeta}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Ocorreu em</span>
              <span className={styles.metaValue}>{fmtDate(data.createdAt)}</span>
            </div>
            {data.tenantName && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Tenant</span>
                <span className={styles.metaValue}>{data.tenantName}</span>
              </div>
            )}
            {data.userEmail && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Usuário</span>
                <span className={styles.metaValue}>{data.userEmail}</span>
              </div>
            )}
            {data.ip && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>IP</span>
                <span className={styles.metaValue}>{data.ip}</span>
              </div>
            )}
            {data.fingerprint && (
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Fingerprint</span>
                <span className={`${styles.metaValue} ${styles.mono}`}>{data.fingerprint}</span>
              </div>
            )}
          </div>

          {/* Request Body */}
          {!loading && data.requestBody && (
            <div className={styles.drawerSection}>
              <h4 className={styles.drawerSectionTitle}>
                <i className="bx bx-code-curly" /> Request Body
              </h4>
              <pre className={styles.codeBlock}>
                {(() => {
                  try { return JSON.stringify(JSON.parse(data.requestBody!), null, 2) }
                  catch { return data.requestBody }
                })()}
              </pre>
            </div>
          )}

          {/* Stack Trace */}
          {!loading && data.stack && (
            <div className={styles.drawerSection}>
              <h4 className={styles.drawerSectionTitle}>
                <i className="bx bx-terminal" /> Stack Trace
              </h4>
              <pre className={styles.codeBlock}>{data.stack}</pre>
            </div>
          )}

          {loading && (
            <div className={styles.drawerLoading}>
              <div className={styles.skeletonBlock} />
              <div className={styles.skeletonBlock} style={{ height: 120 }} />
            </div>
          )}

          {/* Resolução existente */}
          {data.resolved && (
            <div className={styles.resolvedBanner}>
              <i className="bx bx-check-circle" />
              <div>
                <strong>Resolvido por {data.resolvedBy}</strong>
                <span>{fmtDate(data.resolvedAt)}</span>
                {data.resolution && <p>{data.resolution}</p>}
              </div>
            </div>
          )}

          {/* Form de resolução */}
          {showResolveForm && !data.resolved && (
            <div className={styles.resolveForm}>
              <label>Nota de resolução (opcional)</label>
              <textarea
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                placeholder="Descreva o que foi corrigido..."
                rows={3}
              />
              <div className={styles.resolveFormActions}>
                <button
                  className={styles.btnGhost}
                  onClick={() => setShowResolveForm(false)}
                  disabled={resolving}
                >
                  Cancelar
                </button>
                {error.fingerprint && (
                  <button
                    className={styles.btnOutline}
                    onClick={() => handleResolve(true)}
                    disabled={resolving}
                  >
                    <i className="bx bx-check-double" />
                    Resolver grupo
                  </button>
                )}
                <button
                  className={styles.btnPrimary}
                  onClick={() => handleResolve(false)}
                  disabled={resolving}
                >
                  {resolving ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-check" />}
                  Resolver este
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer ações */}
        <div className={styles.drawerFooter}>
          {data.resolved ? (
            <button className={styles.btnOutline} onClick={handleUnresolve} disabled={resolving}>
              <i className="bx bx-revision" /> Reabrir
            </button>
          ) : (
            !showResolveForm && (
              <button className={styles.btnPrimary} onClick={() => setShowResolveForm(true)}>
                <i className="bx bx-check-shield" /> Marcar como resolvido
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function Errors() {
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [errors, setErrors] = useState<SystemError[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [selected, setSelected] = useState<SystemError | null>(null)

  // Filtros
  const [filters, setFilters] = useState<ErrorsListParams>({
    resolved: 'false',
    grouped: 'true',
    page: 1,
    perPage: 50,
  })
  const [search, setSearch] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const loadStats = useCallback(() => {
    setStatsLoading(true)
    errorsApi.stats()
      .then((r: any) => setStats(r.data.data))
      .finally(() => setStatsLoading(false))
  }, [])

  const loadErrors = useCallback(() => {
    setLoading(true)
    errorsApi.list(filters)
      .then((r: any) => {
        setErrors(r.data.data.errors)
        setTotal(r.data.data.total)
      })
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadErrors() }, [loadErrors])

  function setFilter(key: keyof ErrorsListParams, value: string | number) {
    setFilters((f: any) => ({ ...f, [key]: value, page: 1 }))
  }

  function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value
    setSearch(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setFilter('q', q), 350)
  }

  function handleResolved() {
    loadStats()
    loadErrors()
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Monitor de Erros"
        subtitle="Rastreamento em tempo real de erros da API Planware"
        actions={
          <button className={styles.btnGhost} onClick={() => { loadStats(); loadErrors() }}>
            <i className="bx bx-refresh" /> Atualizar
          </button>
        }
      />

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Total de erros"
          value={statsLoading ? '—' : stats?.total ?? 0}
          icon="bx-error-circle"
          accent="rgba(239,68,68,.15)"
        />
        <StatCard
          label="Não resolvidos"
          value={statsLoading ? '—' : stats?.unresolved ?? 0}
          icon="bx-bell"
          accent="rgba(234,179,8,.15)"
          sub={stats?.unresolved && stats.unresolved > 0 ? 'Atenção necessária' : 'Tudo em ordem'}
        />
        <StatCard
          label="Críticos (5xx)"
          value={statsLoading ? '—' : stats?.critical ?? 0}
          icon="bx-bug"
          accent="rgba(239,68,68,.2)"
          sub="Erros não resolvidos"
        />
        <StatCard
          label="Últimas 24h"
          value={statsLoading ? '—' : stats?.last24h ?? 0}
          icon="bx-time-five"
          accent="rgba(59,130,246,.15)"
        />
      </div>

      {/* ── Top erros frequentes ── */}
      {stats?.topErrors && stats.topErrors.length > 0 && (
        <div className={styles.topCard}>
          <div className={styles.topCardHeader}>
            <h3><i className="bx bx-trending-up" /> Top erros mais frequentes (7 dias)</h3>
          </div>
          <div className={styles.topList}>
            {stats.topErrors.map((e: any) => (
              <div key={e.fingerprint} className={styles.topItem}>
                <div className={styles.topCount}>{e.count}×</div>
                <ModuleBadge module={e.module} />
                <span className={`${styles.methodTag} ${methodColor(e.method)}`}>{e.method}</span>
                <span className={styles.topRoute}>{e.route}</span>
                <span className={styles.topMessage}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className={styles.filtersBar}>
        {/* Busca */}
        <div className={styles.searchWrap}>
          <i className="bx bx-search" />
          <input
            className={styles.searchInput}
            placeholder="Buscar por mensagem, rota, usuário..."
            value={search}
            onChange={handleSearch}
          />
          {search && (
            <button onClick={() => { setSearch(''); setFilter('q', '') }}>
              <i className="bx bx-x" />
            </button>
          )}
        </div>

        {/* Módulo */}
        <select
          className={styles.filterSelect}
          value={filters.module ?? ''}
          onChange={e => setFilter('module', e.target.value)}
        >
          <option value="">Todos os módulos</option>
          {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* Status HTTP */}
        <select
          className={styles.filterSelect}
          value={filters.statusCode ?? ''}
          onChange={e => setFilter('statusCode', e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="400">400 Bad Request</option>
          <option value="401">401 Unauthorized</option>
          <option value="403">403 Forbidden</option>
          <option value="404">404 Not Found</option>
          <option value="409">409 Conflict</option>
          <option value="500">500 Internal Error</option>
        </select>

        {/* Resolvidos */}
        <select
          className={styles.filterSelect}
          value={filters.resolved ?? ''}
          onChange={e => setFilter('resolved', e.target.value)}
        >
          <option value="false">Não resolvidos</option>
          <option value="true">Resolvidos</option>
          <option value="">Todos</option>
        </select>

        {/* Agrupado */}
        <button
          className={`${styles.filterToggle} ${filters.grouped === 'true' ? styles.filterToggleActive : ''}`}
          onClick={() => setFilter('grouped', filters.grouped === 'true' ? 'false' : 'true')}
          title="Agrupar erros idênticos"
        >
          <i className="bx bx-layer" />
          {filters.grouped === 'true' ? 'Agrupado' : 'Individual'}
        </button>

        {/* Data de */}
        <input
          type="date"
          className={styles.filterSelect}
          value={filters.from ?? ''}
          onChange={e => setFilter('from', e.target.value)}
          title="A partir de"
        />
        <input
          type="date"
          className={styles.filterSelect}
          value={filters.to ?? ''}
          onChange={e => setFilter('to', e.target.value)}
          title="Até"
        />
      </div>

      {/* ── Tabela ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <span className={styles.tableTitle}>
            <i className="bx bx-list-ul" />
            {total} erro{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className={styles.skeletonRows}>
            {[...Array(8)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}
          </div>
        ) : errors.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="bx bx-check-shield" />
            <p>Nenhum erro encontrado com os filtros aplicados.</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Módulo</th>
                  <th>Rota</th>
                  <th>Tipo</th>
                  <th>Mensagem</th>
                  <th>Tenant</th>
                  <th>Quando</th>
                  {filters.grouped === 'true' && <th>Freq.</th>}
                  <th />
                </tr>
              </thead>
              <tbody>
                {errors.map(err => (
                  <tr
                    key={err.id}
                    className={`${styles.row} ${err.resolved ? styles.rowResolved : ''} ${err.statusCode >= 500 ? styles.rowCritical : ''}`}
                    onClick={() => setSelected(err)}
                  >
                    <td>
                      <span className={`${styles.statusBadge} ${statusColor(err.statusCode)}`}>
                        {err.statusCode}
                      </span>
                    </td>
                    <td><ModuleBadge module={err.module} /></td>
                    <td>
                      <div className={styles.routeCell}>
                        <span className={`${styles.methodTag} ${methodColor(err.method)}`}>
                          {err.method}
                        </span>
                        <span className={styles.routePath}>{err.route}</span>
                      </div>
                    </td>
                    <td>
                      <span className={styles.errorType}>{err.errorType}</span>
                    </td>
                    <td>
                      <span className={styles.errorMessage}>{err.message}</span>
                    </td>
                    <td>
                      <span className={styles.tenantName}>{err.tenantName ?? '—'}</span>
                    </td>
                    <td>
                      <span className={styles.timeAgo} title={fmtDate(err.createdAt)}>
                        {timeAgo(err.createdAt)}
                      </span>
                    </td>
                    {filters.grouped === 'true' && (
                      <td>
                        {(err.count ?? 1) > 1 && (
                          <span className={styles.freqBadge}>{err.count}×</span>
                        )}
                      </td>
                    )}
                    <td onClick={e => e.stopPropagation()}>
                      {err.resolved ? (
                        <span className={styles.resolvedTag}>
                          <i className="bx bx-check" /> Resolvido
                        </span>
                      ) : (
                        <i className={`bx bx-chevron-right ${styles.arrowIcon}`} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {total > (filters.perPage ?? 50) && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={(filters.page ?? 1) <= 1}
              onClick={() => setFilter('page', (filters.page ?? 1) - 1)}
            >
              <i className="bx bx-chevron-left" />
            </button>
            <span className={styles.pageInfo}>
              Página {filters.page ?? 1} de {Math.ceil(total / (filters.perPage ?? 50))}
            </span>
            <button
              className={styles.pageBtn}
              disabled={(filters.page ?? 1) >= Math.ceil(total / (filters.perPage ?? 50))}
              onClick={() => setFilter('page', (filters.page ?? 1) + 1)}
            >
              <i className="bx bx-chevron-right" />
            </button>
          </div>
        )}
      </div>

      {/* ── Detalhe lateral ── */}
      {selected && (
        <DetailPanel
          error={selected}
          onClose={() => setSelected(null)}
          onResolved={handleResolved}
        />
      )}
    </div>
  )
}