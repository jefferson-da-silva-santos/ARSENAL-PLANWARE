import { useState, useEffect, useCallback } from 'react'
import { billingApi } from '@/services/billingApi'
import type {
  BillingStats, Plan, Charge, TenantFinancial,
  ChargeStatus, ChargeType, PaymentMethod, BillingType,
} from '@/services/billingApi'
import PageHeader from '@/components/PageHeader/PageHeader'
import StatCard from '@/components/StatCard/StatCard'
import styles from './Financial.module.scss'

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

function fmtDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

const CHARGE_STATUS: Record<ChargeStatus, { label: string; cls: string }> = {
  PENDING:   { label: 'Pendente',   cls: 'sPending'   },
  PARTIAL:   { label: 'Parcial',    cls: 'sPartial'   },
  PAID:      { label: 'Pago',       cls: 'sPaid'      },
  OVERDUE:   { label: 'Vencido',    cls: 'sOverdue'   },
  CANCELLED: { label: 'Cancelado',  cls: 'sCancelled' },
}

const CHARGE_TYPE: Record<ChargeType, string> = {
  SUBSCRIPTION: 'Mensalidade',
  SETUP:        'Setup',
  EXTRA:        'Extra',
  CUSTOM:       'Personalizado',
}

const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  PIX:         'Pix',
  TRANSFER:    'Transferência',
  CASH:        'Dinheiro',
  CREDIT_CARD: 'Cartão Crédito',
  DEBIT_CARD:  'Cartão Débito',
  OTHER:       'Outro',
}

const BILLING_TYPE: Record<BillingType, string> = {
  MONTHLY:  'Mensal',
  ANNUAL:   'Anual',
  LIFETIME: 'Vitalício',
  CUSTOM:   'Personalizado',
}

const SYSTEMS_ALL = [
  'CLIENTPRO','STOCKPRO','FINVAULT','FINFLOW',
  'FINANCEFLOW','KANBAN','CLINICA','ORDEMTECH','FIADO',
]

function ChargeStatusBadge({ status }: { status: ChargeStatus }) {
  const cfg = CHARGE_STATUS[status]
  return <span className={`${styles.statusBadge} ${styles[cfg.cls]}`}>{cfg.label}</span>
}

// ─────────────────────────────────────────────────────────────
//  ABAS
// ─────────────────────────────────────────────────────────────
type Tab = 'overview' | 'charges' | 'plans'

// ─────────────────────────────────────────────────────────────
//  MODAL — NOVA COBRANÇA
// ─────────────────────────────────────────────────────────────
interface NewChargeModalProps {
  tenants: { id: string; name: string }[]
  onClose: () => void
  onCreated: () => void
}

function NewChargeModal({ tenants, onClose, onCreated }: NewChargeModalProps) {
  const [form, setForm] = useState({
    tenantId: '', description: '', amount: '', dueDate: '', type: 'SUBSCRIPTION' as ChargeType, notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await billingApi.createCharge({
        tenantId:    form.tenantId,
        description: form.description,
        amount:      parseFloat(form.amount),
        dueDate:     form.dueDate,
        type:        form.type,
        notes:       form.notes || undefined,
      })
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3><i className="bx bx-plus-circle" /> Nova Cobrança</h3>
          <button className={styles.modalClose} onClick={onClose}><i className="bx bx-x" /></button>
        </div>
        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div className={styles.fieldGroup}>
            <label>Cliente (Tenant) *</label>
            <select className={styles.select} value={form.tenantId} onChange={e => set('tenantId', e.target.value)} required>
              <option value="">Selecione o cliente</option>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label>Descrição *</label>
            <input className={styles.input} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ex: Mensalidade Maio/2025" required />
          </div>
          <div className={styles.formRow}>
            <div className={styles.fieldGroup}>
              <label>Valor (R$) *</label>
              <input className={styles.input} type="number" step="0.01" min="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="99,90" required />
            </div>
            <div className={styles.fieldGroup}>
              <label>Vencimento *</label>
              <input className={styles.input} type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} required />
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label>Tipo</label>
            <select className={styles.select} value={form.type} onChange={e => set('type', e.target.value as ChargeType)}>
              {Object.entries(CHARGE_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label>Observações</label>
            <textarea className={styles.textarea} value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Opcional..." />
          </div>
          {error && <p className={styles.formError}><i className="bx bx-error-circle" /> {error}</p>}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-check" />}
              Criar cobrança
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  MODAL — REGISTRAR PAGAMENTO
// ─────────────────────────────────────────────────────────────
interface PaymentModalProps {
  charge: Charge
  onClose: () => void
  onPaid: () => void
}

function PaymentModal({ charge, onClose, onPaid }: PaymentModalProps) {
  const paidSoFar = (charge.payments ?? []).reduce((s, p) => s + p.amount, 0)
  const remaining = charge.amount - paidSoFar

  const [form, setForm] = useState({
    amount: remaining.toFixed(2), method: 'PIX' as PaymentMethod,
    paidAt: new Date().toISOString().split('T')[0], reference: '', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await billingApi.registerPayment(charge.id, {
        amount:    parseFloat(form.amount),
        method:    form.method,
        paidAt:    form.paidAt,
        reference: form.reference || undefined,
        notes:     form.notes     || undefined,
      })
      onPaid()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3><i className="bx bx-money" /> Registrar Pagamento</h3>
          <button className={styles.modalClose} onClick={onClose}><i className="bx bx-x" /></button>
        </div>
        <div className={styles.paymentInfo}>
          <div className={styles.paymentInfoRow}>
            <span>Cobrança</span>
            <strong>{charge.description}</strong>
          </div>
          <div className={styles.paymentInfoRow}>
            <span>Valor total</span>
            <strong>{fmt(charge.amount)}</strong>
          </div>
          <div className={styles.paymentInfoRow}>
            <span>Já pago</span>
            <strong className={styles.paid}>{fmt(paidSoFar)}</strong>
          </div>
          <div className={styles.paymentInfoRow}>
            <span>Em aberto</span>
            <strong className={styles.overdue}>{fmt(remaining)}</strong>
          </div>
        </div>
        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.fieldGroup}>
              <label>Valor a registrar (R$) *</label>
              <input className={styles.input} type="number" step="0.01" min="0.01" max={remaining.toFixed(2)} value={form.amount} onChange={e => set('amount', e.target.value)} required />
            </div>
            <div className={styles.fieldGroup}>
              <label>Data do pagamento *</label>
              <input className={styles.input} type="date" value={form.paidAt} onChange={e => set('paidAt', e.target.value)} required />
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label>Forma de pagamento *</label>
            <div className={styles.methodGrid}>
              {(Object.entries(PAYMENT_METHOD) as [PaymentMethod, string][]).map(([k, v]) => (
                <button key={k} type="button"
                  className={`${styles.methodBtn} ${form.method === k ? styles.methodBtnActive : ''}`}
                  onClick={() => set('method', k)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label>Referência / comprovante</label>
            <input className={styles.input} value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="Chave Pix, nº transferência..." />
          </div>
          <div className={styles.fieldGroup}>
            <label>Observações</label>
            <textarea className={styles.textarea} value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>
          {error && <p className={styles.formError}><i className="bx bx-error-circle" /> {error}</p>}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-check" />}
              Confirmar pagamento
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  MODAL — CRIAR/EDITAR PLANO
// ─────────────────────────────────────────────────────────────
interface PlanModalProps {
  plan?: Plan
  onClose: () => void
  onSaved: () => void
}

function PlanModal({ plan, onClose, onSaved }: PlanModalProps) {
  const [form, setForm] = useState({
    name:        plan?.name        ?? '',
    description: plan?.description ?? '',
    price:       plan?.price?.toString() ?? '',
    systems:     plan?.systems     ?? [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))

  function toggleSystem(sys: string) {
    setForm(f => ({
      ...f,
      systems: f.systems.includes(sys)
        ? f.systems.filter(s => s !== sys)
        : [...f.systems, sys],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, price: parseFloat(form.price) }
      if (plan) await billingApi.updatePlan(plan.id, payload)
      else      await billingApi.createPlan(payload)
      onSaved()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3><i className={`bx ${plan ? 'bx-edit' : 'bx-plus-circle'}`} /> {plan ? 'Editar Plano' : 'Novo Plano'}</h3>
          <button className={styles.modalClose} onClick={onClose}><i className="bx bx-x" /></button>
        </div>
        <form className={styles.modalBody} onSubmit={handleSubmit}>
          <div className={styles.formRow}>
            <div className={styles.fieldGroup}>
              <label>Nome do plano *</label>
              <input className={styles.input} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Profissional" required />
            </div>
            <div className={styles.fieldGroup}>
              <label>Valor mensal (R$) *</label>
              <input className={styles.input} type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="99,90" required />
            </div>
          </div>
          <div className={styles.fieldGroup}>
            <label>Descrição</label>
            <input className={styles.input} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Breve descrição do plano" />
          </div>
          <div className={styles.fieldGroup}>
            <label>Sistemas incluídos</label>
            <div className={styles.systemsGrid}>
              {SYSTEMS_ALL.map(sys => (
                <button key={sys} type="button"
                  className={`${styles.systemBtn} ${form.systems.includes(sys) ? styles.systemBtnActive : ''}`}
                  onClick={() => toggleSystem(sys)}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>
          {error && <p className={styles.formError}><i className="bx bx-error-circle" /> {error}</p>}
          <div className={styles.modalFooter}>
            <button type="button" className={styles.btnGhost} onClick={onClose} disabled={saving}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={saving}>
              {saving ? <i className="bx bx-loader-alt bx-spin" /> : <i className="bx bx-check" />}
              {plan ? 'Salvar' : 'Criar plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  PÁGINA PRINCIPAL
// ─────────────────────────────────────────────────────────────
export default function Financial() {
  const [tab,     setTab]     = useState<Tab>('overview')
  const [stats,   setStats]   = useState<BillingStats | null>(null)
  const [charges, setCharges] = useState<Charge[]>([])
  const [plans,   setPlans]   = useState<Plan[]>([])
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([])

  const [statsLoading,   setStatsLoading]   = useState(true)
  const [chargesLoading, setChargesLoading] = useState(false)
  const [plansLoading,   setPlansLoading]   = useState(false)

  const [filterStatus, setFilterStatus] = useState('')
  const [filterType,   setFilterType]   = useState('')

  const [showNewCharge,  setShowNewCharge]  = useState(false)
  const [payingCharge,   setPayingCharge]   = useState<Charge | null>(null)
  const [editingPlan,    setEditingPlan]    = useState<Plan | undefined>(undefined)
  const [showNewPlan,    setShowNewPlan]    = useState(false)

  const loadStats = useCallback(() => {
    setStatsLoading(true)
    billingApi.stats()
      .then(r => setStats(r.data.data))
      .finally(() => setStatsLoading(false))
  }, [])

  const loadCharges = useCallback(() => {
    setChargesLoading(true)
    billingApi.listCharges({
      status: filterStatus || undefined,
      type:   filterType   || undefined,
    })
      .then(r => setCharges(r.data.data.charges))
      .finally(() => setChargesLoading(false))
  }, [filterStatus, filterType])

  const loadPlans = useCallback(() => {
    setPlansLoading(true)
    billingApi.listPlans()
      .then(r => setPlans(r.data.data))
      .finally(() => setPlansLoading(false))
  }, [])

  // Carrega tenants para os selects
  useEffect(() => {
    import('@/services/api').then(({ default: api }) => {
      api.get('/admin/tenants').then(r => setTenants(r.data.data ?? []))
    })
  }, [])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { if (tab === 'charges') loadCharges() }, [tab, loadCharges])
  useEffect(() => { if (tab === 'plans')   loadPlans()   }, [tab, loadPlans])

  async function handleMarkOverdue() {
    const r = await billingApi.markOverdue()
    loadStats()
    loadCharges()
    alert(`${r.data.data.marked} cobranças marcadas como vencidas.`)
  }

  async function handleCancelCharge(id: string) {
    if (!window.confirm('Cancelar esta cobrança?')) return
    await billingApi.cancelCharge(id)
    loadCharges()
    loadStats()
  }

  async function handleDeleteCharge(id: string) {
    if (!window.confirm('Excluir esta cobrança?')) return
    await billingApi.deleteCharge(id)
    loadCharges()
    loadStats()
  }

  async function handleTogglePlan(id: string) {
    await billingApi.togglePlan(id)
    loadPlans()
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Financeiro"
        subtitle="Planos, cobranças e controle de recebimentos"
        actions={
          <div className={styles.headerActions}>
            <button className={styles.btnGhost} onClick={() => { loadStats(); loadCharges(); loadPlans() }}>
              <i className="bx bx-refresh" /> Atualizar
            </button>
            <button className={styles.btnOutline} onClick={handleMarkOverdue}>
              <i className="bx bx-alarm-exclamation" /> Marcar vencidas
            </button>
            <button className={styles.btnPrimary} onClick={() => setShowNewCharge(true)}>
              <i className="bx bx-plus" /> Nova cobrança
            </button>
          </div>
        }
      />

      {/* ── Stat cards ── */}
      <div className={styles.statsGrid}>
        <StatCard label="Total em aberto"   value={statsLoading ? '—' : fmt(stats?.totalOpen ?? 0)}      icon="bx-wallet-alt"      accent="rgba(234,179,8,.15)" />
        <StatCard label="Recebido no mês"   value={statsLoading ? '—' : fmt(stats?.paidThisMonth ?? 0)}  icon="bx-trending-up"     accent="rgba(74,222,128,.15)" />
        <StatCard label="Pendentes"         value={statsLoading ? '—' : stats?.pendingCharges ?? 0}       icon="bx-time"            accent="rgba(59,130,246,.15)" />
        <StatCard label="Vencidas"          value={statsLoading ? '—' : stats?.overdueCharges ?? 0}       icon="bx-error"           accent="rgba(239,68,68,.15)"
          sub={stats?.overdueCharges && stats.overdueCharges > 0 ? 'Requer atenção' : 'Nenhuma vencida'}
        />
      </div>

      {/* ── Vencidas em destaque ── */}
      {(stats?.overdueList?.length ?? 0) > 0 && (
        <div className={styles.overdueCard}>
          <div className={styles.overdueCardHeader}>
            <i className="bx bx-error-alt" />
            <h3>Cobranças vencidas — ação necessária</h3>
          </div>
          <div className={styles.overdueList}>
            {stats!.overdueList.map(c => (
              <div key={c.id} className={styles.overdueItem}>
                <div className={styles.overdueInfo}>
                  <strong>{c.tenant.name}</strong>
                  <span>{c.description}</span>
                </div>
                <div className={styles.overdueRight}>
                  <span className={styles.overdueAmount}>{fmt(c.amount)}</span>
                  <span className={styles.overdueDate}>Venceu {fmtDate(c.dueDate)}</span>
                </div>
                <button className={styles.btnPrimary} onClick={() => setPayingCharge(c as Charge)}>
                  <i className="bx bx-money" /> Registrar pagamento
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Últimos pagamentos ── */}
      {(stats?.recentPayments?.length ?? 0) > 0 && (
        <div className={styles.recentCard}>
          <div className={styles.recentHeader}>
            <h3><i className="bx bx-check-circle" /> Últimos pagamentos recebidos</h3>
          </div>
          <div className={styles.recentList}>
            {stats!.recentPayments.map(p => (
              <div key={p.id} className={styles.recentItem}>
                <div className={styles.recentInfo}>
                  <strong>{p.charge.tenant.name}</strong>
                  <span>{p.charge.description}</span>
                </div>
                <div className={styles.recentRight}>
                  <span className={styles.recentAmount}>{fmt(p.amount)}</span>
                  <span className={styles.recentMethod}>{PAYMENT_METHOD[p.method]}</span>
                  <span className={styles.recentDate}>{fmtDateTime(p.paidAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Abas ── */}
      <div className={styles.tabs}>
        {(['overview', 'charges', 'plans'] as Tab[]).map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? <><i className="bx bx-bar-chart-alt-2" /> Visão Geral</>
            : t === 'charges' ? <><i className="bx bx-receipt" /> Cobranças</>
            :                   <><i className="bx bx-package" /> Planos</>}
          </button>
        ))}
      </div>

      {/* ── Tab: Cobranças ── */}
      {tab === 'charges' && (
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <span className={styles.tableTitle}><i className="bx bx-receipt" /> Cobranças</span>
            <div className={styles.tableFilters}>
              <select className={styles.filterSelect} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">Todos os status</option>
                {Object.entries(CHARGE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select className={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
                <option value="">Todos os tipos</option>
                {Object.entries(CHARGE_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {chargesLoading ? (
            <div className={styles.skeletonRows}>{[...Array(6)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}</div>
          ) : charges.length === 0 ? (
            <div className={styles.emptyState}><i className="bx bx-receipt" /><p>Nenhuma cobrança encontrada.</p></div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr>
                  <th>Cliente</th><th>Descrição</th><th>Tipo</th>
                  <th>Valor</th><th>Pago</th><th>Vencimento</th><th>Status</th><th />
                </tr></thead>
                <tbody>
                  {charges.map(c => {
                    const paid = (c.payments ?? []).reduce((s, p) => s + p.amount, 0)
                    const isOverdue = c.status === 'OVERDUE'
                    return (
                      <tr key={c.id} className={`${styles.row} ${isOverdue ? styles.rowOverdue : ''} ${c.status === 'PAID' ? styles.rowPaid : ''}`}>
                        <td><span className={styles.tenantName}>{c.tenant?.name ?? '—'}</span></td>
                        <td><span className={styles.chargeDesc}>{c.description}</span></td>
                        <td><span className={styles.chargeType}>{CHARGE_TYPE[c.type]}</span></td>
                        <td><strong>{fmt(c.amount)}</strong></td>
                        <td>
                          <span className={paid >= c.amount ? styles.paid : styles.partial}>
                            {fmt(paid)}
                          </span>
                        </td>
                        <td><span className={isOverdue ? styles.overdueDate : ''}>{fmtDate(c.dueDate)}</span></td>
                        <td><ChargeStatusBadge status={c.status} /></td>
                        <td>
                          <div className={styles.rowActions}>
                            {(c.status === 'PENDING' || c.status === 'PARTIAL' || c.status === 'OVERDUE') && (
                              <button className={styles.actionBtn} title="Registrar pagamento" onClick={() => setPayingCharge(c)}>
                                <i className="bx bx-money" />
                              </button>
                            )}
                            {c.status !== 'PAID' && c.status !== 'CANCELLED' && (
                              <button className={styles.actionBtnDanger} title="Cancelar" onClick={() => handleCancelCharge(c.id)}>
                                <i className="bx bx-x-circle" />
                              </button>
                            )}
                            {(c.status === 'PENDING' || c.status === 'CANCELLED') && (
                              <button className={styles.actionBtnDanger} title="Excluir" onClick={() => handleDeleteCharge(c.id)}>
                                <i className="bx bx-trash" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Planos ── */}
      {tab === 'plans' && (
        <div className={styles.plansSection}>
          <div className={styles.plansSectionHeader}>
            <span className={styles.tableTitle}><i className="bx bx-package" /> Planos comerciais</span>
            <button className={styles.btnPrimary} onClick={() => setShowNewPlan(true)}>
              <i className="bx bx-plus" /> Novo plano
            </button>
          </div>
          {plansLoading ? (
            <div className={styles.skeletonRows}>{[...Array(4)].map((_, i) => <div key={i} className={styles.skeletonRow} style={{ height: 120 }} />)}</div>
          ) : (
            <div className={styles.plansGrid}>
              {plans.map(plan => (
                <div key={plan.id} className={`${styles.planCard} ${!plan.active ? styles.planCardInactive : ''}`}>
                  <div className={styles.planCardHeader}>
                    <div>
                      <h3 className={styles.planName}>{plan.name}</h3>
                      {plan.description && <p className={styles.planDesc}>{plan.description}</p>}
                    </div>
                    <div className={styles.planPrice}>{plan.price > 0 ? fmt(plan.price) : 'Custom'}<span>/mês</span></div>
                  </div>
                  <div className={styles.planSystems}>
                    {plan.systems.length === 0 ? (
                      <span className={styles.planNoSystems}>Sistemas definidos manualmente</span>
                    ) : plan.systems.map(s => (
                      <span key={s} className={styles.planSystemTag}>{s}</span>
                    ))}
                  </div>
                  <div className={styles.planCardFooter}>
                    <span className={styles.planCount}>
                      <i className="bx bx-group" /> {plan._count?.tenantPlans ?? 0} assinante{(plan._count?.tenantPlans ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <div className={styles.planActions}>
                      <button className={styles.actionBtn} onClick={() => setEditingPlan(plan)} title="Editar">
                        <i className="bx bx-edit" />
                      </button>
                      <button className={`${styles.actionBtn} ${!plan.active ? styles.actionBtnActive : ''}`} onClick={() => handleTogglePlan(plan.id)} title={plan.active ? 'Desativar' : 'Ativar'}>
                        <i className={`bx ${plan.active ? 'bx-toggle-right' : 'bx-toggle-left'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modais ── */}
      {showNewCharge && (
        <NewChargeModal tenants={tenants} onClose={() => setShowNewCharge(false)} onCreated={() => { loadCharges(); loadStats() }} />
      )}
      {payingCharge && (
        <PaymentModal charge={payingCharge} onClose={() => setPayingCharge(null)} onPaid={() => { loadCharges(); loadStats() }} />
      )}
      {(showNewPlan || editingPlan) && (
        <PlanModal plan={editingPlan} onClose={() => { setShowNewPlan(false); setEditingPlan(undefined) }} onSaved={loadPlans} />
      )}
    </div>
  )
}
