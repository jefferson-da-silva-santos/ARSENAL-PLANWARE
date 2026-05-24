import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const API_BASE      = 'http://localhost:3000/clientpro/api'
const AUTH_BASE     = 'http://localhost:3000/auth'
const STORAGE_TOKEN = 'planware_token'
const STORAGE_USER  = 'planware_user'


// ─────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────
const auth = {
  getToken: () => localStorage.getItem(STORAGE_TOKEN),
  getUser:  () => { try { return JSON.parse(localStorage.getItem(STORAGE_USER)) } catch { return null } },
  save:     (token, user) => { localStorage.setItem(STORAGE_TOKEN, token); localStorage.setItem(STORAGE_USER, JSON.stringify(user)) },
  clear:    () => { localStorage.removeItem(STORAGE_TOKEN); localStorage.removeItem(STORAGE_USER) },
  isLogged: () => !!localStorage.getItem(STORAGE_TOKEN),
}

// ─────────────────────────────────────────────
// AUTH STATE (global sem Context)
// ─────────────────────────────────────────────
let _listeners = []
let _authState = { user: auth.getUser(), logged: auth.isLogged() }

function getAuthState() { return _authState }
function setAuthState(next) { _authState = next; _listeners.forEach(fn => fn(next)) }
function useAuthState() {
  const [, forceRender] = useState(0)
  useEffect(() => {
    const listener = () => forceRender(n => n + 1)
    _listeners.push(listener)
    return () => { _listeners = _listeners.filter(fn => fn !== listener) }
  }, [])
  return getAuthState()
}
function doLogin(token, user) { auth.save(token, user); setAuthState({ user, logged: true }) }
function doLogout()           { auth.clear();           setAuthState({ user: null, logged: false }) }

async function apiLogin(email, password) {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Credenciais inválidas')
  return json.data
}

// ─────────────────────────────────────────────
// API COM JWT
// ─────────────────────────────────────────────
async function api(path, options = {}) {
  const token = auth.getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (res.status === 401) { doLogout(); return }

  const json = await res.json()
  if (!json.ok) throw new Error(json.error || 'Erro desconhecido')
  return json.data
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
let _setToasts = null
function useToastSetup() {
  const [toasts, setToasts] = useState([])
  _setToasts = setToasts
  return toasts
}
function toast(msg, type = 'success') {
  const id = Date.now()
  _setToasts(p => [...p, { id, msg, type }])
  setTimeout(() => _setToasts(p => p.filter(t => t.id !== id)), 3500)
}

function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <i className={`bx ${t.type === 'success' ? 'bx-check-circle' : t.type === 'error' ? 'bx-x-circle' : 'bx-info-circle'}`}></i>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const esc = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose}><i className="bx bx-x"></i></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// CONFIRM
// ─────────────────────────────────────────────
function Confirm({ msg, onConfirm, onCancel }) {
  return (
    <Modal title="Confirmar ação" onClose={onCancel} size="sm">
      <p className="confirm-msg">{msg}</p>
      <div className="confirm-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-danger" onClick={onConfirm}>Confirmar</button>
      </div>
    </Modal>
  )
}

export function LoginPage({ onLogin }) {
  const [view,     setView]     = useState('login')   // 'login' | 'forgot'
  const [email,    setEmail]    = useState('')
  const [senha,    setSenha]    = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState('')
  const [sucesso,  setSucesso]  = useState('')

  // Refs para foco automático
  const emailRef    = useRef(null)
  const forgotRef   = useRef(null)

  // Foca o campo correto ao trocar de view
  useEffect(() => {
    setErro('')
    setSucesso('')
    if (view === 'login')  setTimeout(() => emailRef.current?.focus(),  300)
    if (view === 'forgot') setTimeout(() => forgotRef.current?.focus(), 300)
  }, [view])

  // ── Submit login ───────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    setErro('')

    if (!email.trim()) { setErro('Informe seu e-mail');  return }
    if (!senha)         { setErro('Informe sua senha');   return }

    setLoading(true)
    try {
      await onLogin(email.trim().toLowerCase(), senha)
    } catch (err) {
      setErro(err.message || 'Credenciais inválidas')
    } finally {
      setLoading(false)
    }
  }

  // ── Submit recuperação ────────────────────────────────────
  async function handleForgot(e) {
    e.preventDefault()
    setErro('')
    if (!email.trim()) { setErro('Informe seu e-mail'); return }

    setLoading(true)
    try {
      // Aqui você chama a API de recuperação de senha
      // await api('/auth/forgot', { method: 'POST', body: { email } })
      await new Promise(r => setTimeout(r, 900)) // simulação
      setSucesso('Se o e-mail estiver cadastrado, você receberá as instruções em breve.')
    } catch {
      setErro('Erro ao solicitar recuperação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const isLogin  = view === 'login'
  const isForgot = view === 'forgot'

  return (
    <div className="lp-root">
      <div className="lp-group">

        {/* ═══════════════════════════════════════
            BANNER — desliza de lado conforme o view
        ═══════════════════════════════════════ */}
        <aside className={`lp-banner ${isForgot ? 'lp-banner--right' : 'lp-banner--left'}`}>

          {/* Decoração: círculos de fundo */}
          <div className="lp-banner-circle lp-banner-circle--lg" aria-hidden="true" />
          <div className="lp-banner-circle lp-banner-circle--sm" aria-hidden="true" />

          <div className="lp-banner-inner">
            {/* Logo / marca */}
            <div className="lp-banner-brand">
              <div className="lp-banner-icon">
                <i className="bx bxs-briefcase-alt-2" aria-hidden="true" />
              </div>
              <span>ClientPro</span>
            </div>

            {/* Texto muda conforme o view */}
            {isLogin && (
              <>
                <h1 className="lp-banner-title">Bem-vindo(a)! 👋</h1>
                <p className="lp-banner-text">
                  Gerencie seus clientes, agenda e relacionamentos em um só lugar.
                </p>
                <a
                  href="mailto:suporte@planware.com.br?subject=Solicitar acesso ClientPro"
                  className="lp-banner-link-btn"
                  aria-label="Solicitar acesso ao sistema"
                >
                  Solicitar acesso
                </a>
              </>
            )}

            {isForgot && (
              <>
                <h1 className="lp-banner-title">Recuperar acesso</h1>
                <p className="lp-banner-text">
                  Não se preocupe — enviaremos as instruções para o seu e-mail.
                </p>
                <button
                  className="lp-banner-link-btn"
                  onClick={() => setView('login')}
                >
                  ← Voltar ao login
                </button>
              </>
            )}
          </div>
        </aside>

        {/* ═══════════════════════════════════════
            FORMULÁRIO — desliza para o lado oposto
        ═══════════════════════════════════════ */}
        <div className={`lp-form-panel ${isForgot ? 'lp-form-panel--left' : 'lp-form-panel--right'}`}>

          {/* ── LOGIN ── */}
          {isLogin && (
            <form
              className="lp-form"
              onSubmit={handleLogin}
              noValidate
              aria-label="Formulário de login"
            >
              <div className="lp-form-header">
                <h2 className="lp-form-title">Entrar</h2>
                <p className="lp-form-sub">Acesse sua conta ClientPro</p>
              </div>

              {erro && (
                <div className="lp-alert lp-alert--error" role="alert">
                  <i className="bx bx-error-circle" aria-hidden="true" />
                  <span>{erro}</span>
                </div>
              )}

              {/* E-mail */}
              <div className="lp-field">
                <label htmlFor="lp-email" className="lp-label">E-mail</label>
                <div className="lp-input-wrap">
                  <i className="bx bx-envelope lp-input-icon" aria-hidden="true" />
                  <input
                    ref={emailRef}
                    id="lp-email"
                    type="email"
                    className="lp-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="lp-field">
                <label htmlFor="lp-senha" className="lp-label">Senha</label>
                <div className="lp-input-wrap">
                  <i className="bx bx-lock-alt lp-input-icon" aria-hidden="true" />
                  <input
                    id="lp-senha"
                    type={showPass ? 'text' : 'password'}
                    className="lp-input lp-input--padded-right"
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="lp-eye-btn"
                    onClick={() => setShowPass(s => !s)}
                    tabIndex={-1}
                    aria-label={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    <i className={`bx ${showPass ? 'bx-hide' : 'bx-show'}`} aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Esqueceu a senha */}
              <button
                type="button"
                className="lp-link-btn"
                onClick={() => setView('forgot')}
              >
                Esqueceu sua senha?
              </button>

              {/* Submit */}
              <button
                type="submit"
                className="lp-submit-btn"
                disabled={loading}
                aria-busy={loading}
              >
                {loading
                  ? <span className="lp-spinner" aria-hidden="true" />
                  : <><i className="bx bx-log-in" aria-hidden="true" />Entrar</>
                }
              </button>
            </form>
          )}

          {/* ── ESQUECEU SENHA ── */}
          {isForgot && (
            <form
              className="lp-form"
              onSubmit={handleForgot}
              noValidate
              aria-label="Formulário de recuperação de senha"
            >
              <div className="lp-form-header">
                <h2 className="lp-form-title">Recuperar senha</h2>
                <p className="lp-form-sub">
                  Informe seu e-mail e enviaremos as instruções.
                </p>
              </div>

              {erro && (
                <div className="lp-alert lp-alert--error" role="alert">
                  <i className="bx bx-error-circle" aria-hidden="true" />
                  <span>{erro}</span>
                </div>
              )}

              {sucesso && (
                <div className="lp-alert lp-alert--success" role="status">
                  <i className="bx bx-check-circle" aria-hidden="true" />
                  <span>{sucesso}</span>
                </div>
              )}

              {/* E-mail */}
              <div className="lp-field">
                <label htmlFor="lp-forgot-email" className="lp-label">E-mail</label>
                <div className="lp-input-wrap">
                  <i className="bx bx-envelope lp-input-icon" aria-hidden="true" />
                  <input
                    ref={forgotRef}
                    id="lp-forgot-email"
                    type="email"
                    className="lp-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                    disabled={loading || !!sucesso}
                  />
                </div>
              </div>

              {/* Submit */}
              {!sucesso && (
                <button
                  type="submit"
                  className="lp-submit-btn"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading
                    ? <span className="lp-spinner" aria-hidden="true" />
                    : <><i className="bx bx-send" aria-hidden="true" />Enviar instruções</>
                  }
                </button>
              )}

              {/* Voltar */}
              <button
                type="button"
                className="lp-link-btn"
                onClick={() => { setView('login'); setSucesso('') }}
              >
                ← Voltar ao login
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────
function Badge({ status, map }) {
  const cfg = map[status] || { label: status, cls: 'badge-neutral' }
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
}

const AGENDA_STATUS = {
  pendente:   { label: 'Pendente',   cls: 'badge-warning' },
  confirmado: { label: 'Confirmado', cls: 'badge-success' },
  cancelado:  { label: 'Cancelado',  cls: 'badge-danger' },
  concluido:  { label: 'Concluído',  cls: 'badge-neutral' },
}
const LEAD_STATUS = {
  novo:       { label: 'Novo',        cls: 'badge-info' },
  em_contato: { label: 'Em Contato',  cls: 'badge-warning' },
  negociando: { label: 'Negociando',  cls: 'badge-primary' },
  fechado:    { label: 'Fechado',     cls: 'badge-success' },
  perdido:    { label: 'Perdido',     cls: 'badge-danger' },
}
const INTERACAO_ICON = {
  nota: 'bx-note', ligacao: 'bx-phone', email: 'bx-envelope',
  reuniao: 'bx-calendar-check', whatsapp: 'bxl-whatsapp',
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try { setData(await api('/dashboard')) }
    catch (e) { toast('Erro ao carregar dashboard: ' + e.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="loading-state"><div className="spinner"></div><span>Carregando...</span></div>
  if (!data) return null

  const fmt = dt => {
    if (!dt) return '—'
    const d = new Date(dt.replace(' ', 'T'))
    return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1><i className="bx bx-home-alt"></i> Dashboard</h1>
          <span className="page-sub">Visão geral do seu negócio</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          <i className="bx bx-refresh"></i> Atualizar
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card" onClick={() => onNavigate('clientes')}>
          <div className="stat-icon stat-brown"><i className="bx bx-group"></i></div>
          <div className="stat-info">
            <span className="stat-value">{data.totalClientes}</span>
            <span className="stat-label">Clientes</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('agenda')}>
          <div className="stat-icon stat-green"><i className="bx bx-calendar"></i></div>
          <div className="stat-info">
            <span className="stat-value">{data.agendamentosHoje}</span>
            <span className="stat-label">Agenda hoje</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('contatos')}>
          <div className="stat-icon stat-blue"><i className="bx bx-briefcase"></i></div>
          <div className="stat-info">
            <span className="stat-value">{data.totalContatos}</span>
            <span className="stat-label">Contatos CRM</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => onNavigate('lembretes')}>
          <div className="stat-icon stat-orange"><i className="bx bx-bell"></i></div>
          <div className="stat-info">
            <span className="stat-value">{data.lembretesUrgentes.length}</span>
            <span className="stat-label">Lembretes urgentes</span>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-header"><h3><i className="bx bx-time-five"></i> Próximos agendamentos</h3></div>
          {data.agendamentosProximos.length === 0
            ? <p className="empty-msg">Nenhum agendamento próximo.</p>
            : data.agendamentosProximos.map(a => (
              <div key={a.id} className="dash-item" onClick={() => onNavigate('agenda')}>
                <div className="dash-item-left">
                  <span className="dash-item-title">{a.titulo}</span>
                  <span className="dash-item-sub">{a.cliente_nome || 'Sem cliente'}</span>
                </div>
                <div className="dash-item-right">
                  <span className="dash-item-time">{fmt(a.data_hora)}</span>
                  <Badge status={a.status} map={AGENDA_STATUS} />
                </div>
              </div>
            ))}
        </div>

        <div className="card">
          <div className="card-header"><h3><i className="bx bx-bell-ring"></i> Lembretes urgentes</h3></div>
          {data.lembretesUrgentes.length === 0
            ? <p className="empty-msg">Nenhum lembrete urgente.</p>
            : data.lembretesUrgentes.map(l => (
              <div key={l.id} className="dash-item urgent" onClick={() => onNavigate('lembretes')}>
                <div className="dash-item-left">
                  <span className="dash-item-title">{l.titulo}</span>
                  <span className="dash-item-sub">{l.descricao || '—'}</span>
                </div>
                <span className="dash-item-time">{fmt(l.data_hora)}</span>
              </div>
            ))}
        </div>

        <div className="card">
          <div className="card-header"><h3><i className="bx bx-history"></i> Atendimentos recentes</h3></div>
          {data.atendimentosRecentes.length === 0
            ? <p className="empty-msg">Nenhum atendimento registrado.</p>
            : data.atendimentosRecentes.map(a => (
              <div key={a.id} className="dash-item">
                <div className="dash-item-left">
                  <span className="dash-item-title">{a.cliente_nome}</span>
                  <span className="dash-item-sub">{a.descricao}</span>
                </div>
                <span className="dash-item-time">{fmt(a.data)}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// CLIENTES
// ─────────────────────────────────────────────
function ClienteForm({ cliente, onSave, onClose }) {
  const [form, setForm] = useState({
    nome: cliente?.nome || '', telefone: cliente?.telefone || '',
    email: cliente?.email || '', endereco: cliente?.endereco || '',
    observacoes: cliente?.observacoes || '',
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.nome.trim()) { toast('Nome é obrigatório', 'error'); return }
    setSaving(true)
    try {
      const saved = cliente
        ? await api(`/clientes/${cliente.id}`, { method: 'PUT', body: form })
        : await api('/clientes', { method: 'POST', body: form })
      toast(cliente ? 'Cliente atualizado!' : 'Cliente cadastrado!')
      onSave(saved)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <div className="form-group full">
        <label>Nome *</label>
        <input className="input" value={form.nome} onChange={set('nome')} placeholder="Nome completo" required />
      </div>
      <div className="form-group">
        <label>Telefone</label>
        <input className="input" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-9999" />
      </div>
      <div className="form-group">
        <label>E-mail</label>
        <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" />
      </div>
      <div className="form-group full">
        <label>Endereço</label>
        <input className="input" value={form.endereco} onChange={set('endereco')} placeholder="Rua, número, bairro..." />
      </div>
      <div className="form-group full">
        <label>Observações</label>
        <textarea className="input textarea" value={form.observacoes} onChange={set('observacoes')} placeholder="Notas livres sobre o cliente..." rows={3} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="spinner-sm"></span> : <i className="bx bx-save"></i>}
          {saving ? 'Salvando...' : (cliente ? 'Atualizar' : 'Cadastrar')}
        </button>
      </div>
    </form>
  )
}

function AtendimentoForm({ clienteId, onSave }) {
  const [desc, setDesc] = useState('')
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 16))
  const [saving, setSaving] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!desc.trim()) { toast('Descrição obrigatória', 'error'); return }
    setSaving(true)
    try {
      const saved = await api(`/clientes/${clienteId}/atendimentos`, {
        method: 'POST',
        body: { descricao: desc, data: data.replace('T', ' ') }
      })
      toast('Atendimento registrado!')
      setDesc('')
      onSave(saved)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="atend-form">
      <input type="datetime-local" className="input" value={data} onChange={e => setData(e.target.value)} />
      <textarea className="input textarea" value={desc} onChange={e => setDesc(e.target.value)}
        placeholder="Descreva o atendimento realizado..." rows={2} />
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? <span className="spinner-sm"></span> : <i className="bx bx-plus"></i>}
        Registrar
      </button>
    </form>
  )
}

function ClienteDetail({ clienteId }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    try { setData(await api(`/clientes/${clienteId}`)) }
    catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [clienteId])

  useEffect(() => { load() }, [load])

  const deleteAtend = async id => {
    try {
      await api(`/atendimentos/${id}`, { method: 'DELETE' })
      setData(p => ({ ...p, atendimentos: p.atendimentos.filter(a => a.id !== id) }))
      toast('Atendimento removido')
    } catch (e) { toast(e.message, 'error') }
    setConfirm(null)
  }

  const fmt = dt => dt ? new Date(dt.replace(' ', 'T')).toLocaleString('pt-BR', { day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit' }) : '—'

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>
  if (!data) return null

  return (
    <>
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      {editando && (
        <Modal title="Editar cliente" onClose={() => setEditando(false)}>
          <ClienteForm cliente={data} onSave={saved => { setData(p => ({ ...p, ...saved })); setEditando(false) }} onClose={() => setEditando(false)} />
        </Modal>
      )}
      <div className="detail-header">
        <div className="detail-avatar"><i className="bx bx-user"></i></div>
        <div className="detail-info">
          <h2>{data.nome}</h2>
          {data.telefone && <span><i className="bx bx-phone"></i> {data.telefone}</span>}
          {data.email    && <span><i className="bx bx-envelope"></i> {data.email}</span>}
          {data.endereco && <span><i className="bx bx-map"></i> {data.endereco}</span>}
        </div>
        <button className="btn btn-ghost" onClick={() => setEditando(true)}><i className="bx bx-edit"></i> Editar</button>
      </div>

      {data.observacoes && <div className="obs-box"><i className="bx bx-note"></i> {data.observacoes}</div>}

      <div className="section-title"><i className="bx bx-history"></i> Histórico de Atendimentos</div>
      <AtendimentoForm clienteId={data.id} onSave={saved => setData(p => ({ ...p, atendimentos: [saved, ...p.atendimentos] }))} />
      <div className="timeline">
        {data.atendimentos?.length === 0
          ? <p className="empty-msg">Nenhum atendimento registrado.</p>
          : data.atendimentos?.map(a => (
            <div key={a.id} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-head">
                  <span className="timeline-date">{fmt(a.data)}</span>
                  <button className="btn-icon btn-danger-ghost" onClick={() => setConfirm({ msg: 'Remover este atendimento?', fn: () => deleteAtend(a.id) })}>
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
                <p>{a.descricao}</p>
              </div>
            </div>
          ))}
      </div>
    </>
  )
}

function Clientes() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(null)
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const searchRef = useRef(null)

  const load = useCallback(async (query = '') => {
    try { setClientes(await api(`/clientes${query ? `?q=${encodeURIComponent(query)}` : ''}`)) }
    catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setTimeout(() => load(q), 300); return () => clearTimeout(t) }, [q, load])

  const del = async id => {
    try {
      await api(`/clientes/${id}`, { method: 'DELETE' })
      setClientes(p => p.filter(c => c.id !== id))
      if (detail === id) setDetail(null)
      toast('Cliente removido')
    } catch (e) { toast(e.message, 'error') }
    setConfirm(null)
  }

  return (
    <div className="page">
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      {modal === 'novo' && (
        <Modal title="Novo cliente" onClose={() => setModal(null)}>
          <ClienteForm onSave={saved => { setClientes(p => [saved, ...p]); setModal(null) }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {detail && (
        <Modal title="Ficha do cliente" onClose={() => setDetail(null)} size="lg">
          <ClienteDetail clienteId={detail} />
        </Modal>
      )}

      <div className="page-header">
        <div>
          <h1><i className="bx bx-group"></i> Clientes</h1>
          <span className="page-sub">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''} encontrado{clientes.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('novo')}>
          <i className="bx bx-plus"></i> Novo cliente
        </button>
      </div>

      <div className="search-bar">
        <i className="bx bx-search"></i>
        <input ref={searchRef} className="input search-input" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Buscar por nome, telefone ou e-mail..." />
        {q && <button className="btn-icon" onClick={() => setQ('')}><i className="bx bx-x"></i></button>}
      </div>

      {loading
        ? <div className="loading-state"><div className="spinner"></div></div>
        : clientes.length === 0
          ? <div className="empty-state"><i className="bx bx-user-x"></i><p>Nenhum cliente encontrado.</p></div>
          : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr key={c.id} className="table-row-hover" onClick={() => setDetail(c.id)}>
                      <td className="td-name">
                        <div className="avatar-sm"><i className="bx bx-user"></i></div>
                        {c.nome}
                      </td>
                      <td>{c.telefone || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="action-btns">
                          <button className="btn-icon" onClick={() => setDetail(c.id)} title="Ver ficha"><i className="bx bx-show"></i></button>
                          <button className="btn-icon btn-danger-ghost" onClick={() => setConfirm({ msg: `Excluir "${c.nome}"?`, fn: () => del(c.id) })} title="Excluir">
                            <i className="bx bx-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
    </div>
  )
}

// ─────────────────────────────────────────────
// AGENDA
// ─────────────────────────────────────────────
function AgendaForm({ agenda, clientes, onSave, onClose }) {
  const [form, setForm] = useState({
    cliente_id: agenda?.cliente_id || '', titulo: agenda?.titulo || '',
    data_hora: agenda?.data_hora ? agenda.data_hora.replace(' ', 'T') : '',
    duracao_min: agenda?.duracao_min || 60, status: agenda?.status || 'pendente',
    notas: agenda?.notas || '',
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.titulo.trim()) { toast('Título é obrigatório', 'error'); return }
    if (!form.data_hora) { toast('Data e hora são obrigatórios', 'error'); return }
    setSaving(true)
    try {
      const body = { ...form, data_hora: form.data_hora.replace('T', ' '), cliente_id: form.cliente_id || null }
      const saved = agenda
        ? await api(`/agendamentos/${agenda.id}`, { method: 'PUT', body })
        : await api('/agendamentos', { method: 'POST', body })
      toast(agenda ? 'Agendamento atualizado!' : 'Agendado com sucesso!')
      onSave(saved)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <div className="form-group full">
        <label>Título *</label>
        <input className="input" value={form.titulo} onChange={set('titulo')} placeholder="Ex: Corte de cabelo, Consulta..." required />
      </div>
      <div className="form-group">
        <label>Cliente</label>
        <select className="input" value={form.cliente_id} onChange={set('cliente_id')}>
          <option value="">Sem cliente</option>
          {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Status</label>
        <select className="input" value={form.status} onChange={set('status')}>
          <option value="pendente">Pendente</option>
          <option value="confirmado">Confirmado</option>
          <option value="cancelado">Cancelado</option>
          <option value="concluido">Concluído</option>
        </select>
      </div>
      <div className="form-group">
        <label>Data e hora *</label>
        <input className="input" type="datetime-local" value={form.data_hora} onChange={set('data_hora')} required />
      </div>
      <div className="form-group">
        <label>Duração (min)</label>
        <input className="input" type="number" value={form.duracao_min} onChange={set('duracao_min')} min={5} max={480} />
      </div>
      <div className="form-group full">
        <label>Notas</label>
        <textarea className="input textarea" value={form.notas} onChange={set('notas')} placeholder="Observações..." rows={2} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="spinner-sm"></span> : <i className="bx bx-save"></i>}
          {saving ? 'Salvando...' : (agenda ? 'Atualizar' : 'Agendar')}
        </button>
      </div>
    </form>
  )
}

function Agenda() {
  const [agendamentos, setAgendamentos] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [viewMode, setViewMode] = useState('dia')

  const getWeekRange = date => {
    const d = new Date(date + 'T00:00:00')
    const day = d.getDay()
    const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return [mon.toISOString().slice(0, 10), sun.toISOString().slice(0, 10)]
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let inicio, fim
      if (viewMode === 'dia') { inicio = selectedDate; fim = selectedDate }
      else { [inicio, fim] = getWeekRange(selectedDate) }
      const [ag, cl] = await Promise.all([
        api(`/agendamentos?data_inicio=${inicio}&data_fim=${fim}`),
        api('/clientes'),
      ])
      setAgendamentos(ag)
      setClientes(cl)
    } catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [selectedDate, viewMode])

  useEffect(() => { load() }, [load])

  const del = async id => {
    try {
      await api(`/agendamentos/${id}`, { method: 'DELETE' })
      setAgendamentos(p => p.filter(a => a.id !== id))
      toast('Agendamento removido')
    } catch (e) { toast(e.message, 'error') }
    setConfirm(null)
  }

  const changeStatus = async (id, status) => {
    try {
      const a = agendamentos.find(x => x.id === id)
      const updated = await api(`/agendamentos/${id}`, { method: 'PUT', body: { ...a, status, data_hora: a.data_hora } })
      setAgendamentos(p => p.map(x => x.id === id ? updated : x))
      toast('Status atualizado!')
    } catch (e) { toast(e.message, 'error') }
  }

  const navigate = dir => {
    const d = new Date(selectedDate + 'T00:00:00')
    d.setDate(d.getDate() + dir * (viewMode === 'dia' ? 1 : 7))
    setSelectedDate(d.toISOString().slice(0, 10))
  }

  const fmt = dt => {
    if (!dt) return ''
    return new Date(dt.replace(' ', 'T')).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const agByDay = ag => {
    const map = {}
    ag.forEach(a => { const d = a.data_hora.slice(0, 10); if (!map[d]) map[d] = []; map[d].push(a) })
    return map
  }

  const [wStart] = getWeekRange(selectedDate)
  const weekDays = viewMode === 'semana'
    ? Array.from({ length: 7 }, (_, i) => { const d = new Date(wStart + 'T00:00:00'); d.setDate(d.getDate() + i); return d.toISOString().slice(0, 10) })
    : [selectedDate]

  const byDay = agByDay(agendamentos)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="page">
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      {modal === 'novo' && (
        <Modal title="Novo agendamento" onClose={() => setModal(null)}>
          <AgendaForm clientes={clientes} onSave={saved => { setAgendamentos(p => [...p, saved]); setModal(null) }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {editItem && (
        <Modal title="Editar agendamento" onClose={() => setEditItem(null)}>
          <AgendaForm agenda={editItem} clientes={clientes}
            onSave={saved => { setAgendamentos(p => p.map(a => a.id === saved.id ? saved : a)); setEditItem(null) }}
            onClose={() => setEditItem(null)} />
        </Modal>
      )}

      <div className="page-header">
        <div>
          <h1><i className="bx bx-calendar"></i> Agenda</h1>
          <span className="page-sub">{agendamentos.length} compromisso{agendamentos.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('novo')}>
          <i className="bx bx-plus"></i> Novo agendamento
        </button>
      </div>

      <div className="agenda-controls">
        <div className="agenda-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}><i className="bx bx-chevron-left"></i></button>
          <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(today)}>Hoje</button>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(1)}><i className="bx bx-chevron-right"></i></button>
        </div>
        <div className="view-toggle">
          <button className={`btn btn-sm ${viewMode === 'dia' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('dia')}>Dia</button>
          <button className={`btn btn-sm ${viewMode === 'semana' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setViewMode('semana')}>Semana</button>
        </div>
      </div>

      {loading
        ? <div className="loading-state"><div className="spinner"></div></div>
        : (
          <div className={`agenda-grid ${viewMode}`}>
            {weekDays.map(day => (
              <div key={day} className={`agenda-day ${day === today ? 'today' : ''}`}>
                <div className="agenda-day-header">
                  <span className="day-name">{new Date(day + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: viewMode === 'semana' ? 'short' : 'long' })}</span>
                  <span className="day-num">{new Date(day + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: viewMode === 'dia' ? 'long' : '2-digit' })}</span>
                </div>
                <div className="agenda-events">
                  {(!byDay[day] || byDay[day].length === 0)
                    ? <p className="empty-msg-sm">Sem compromissos</p>
                    : byDay[day].map(a => (
                      <div key={a.id} className={`event-card status-${a.status}`}>
                        <div className="event-time">{fmt(a.data_hora)}</div>
                        <div className="event-title">{a.titulo}</div>
                        {a.cliente_nome && <div className="event-client"><i className="bx bx-user"></i> {a.cliente_nome}</div>}
                        {a.notas && <div className="event-notes">{a.notas}</div>}
                        <div className="event-actions">
                          <select className="status-select" value={a.status} onChange={e => changeStatus(a.id, e.target.value)} onClick={e => e.stopPropagation()}>
                            <option value="pendente">Pendente</option>
                            <option value="confirmado">Confirmado</option>
                            <option value="cancelado">Cancelado</option>
                            <option value="concluido">Concluído</option>
                          </select>
                          <button className="btn-icon" onClick={() => setEditItem(a)} title="Editar"><i className="bx bx-edit"></i></button>
                          <button className="btn-icon btn-danger-ghost" onClick={() => setConfirm({ msg: 'Remover agendamento?', fn: () => del(a.id) })}><i className="bx bx-trash"></i></button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

// ─────────────────────────────────────────────
// CONTATOS CRM
// ─────────────────────────────────────────────
function ContatoForm({ contato, onSave, onClose }) {
  const [form, setForm] = useState({
    nome: contato?.nome || '', empresa: contato?.empresa || '',
    telefone: contato?.telefone || '', email: contato?.email || '',
    cargo: contato?.cargo || '', status_lead: contato?.status_lead || 'novo',
    observacoes: contato?.observacoes || '',
  })
  const [saving, setSaving] = useState(false)
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.nome.trim()) { toast('Nome é obrigatório', 'error'); return }
    setSaving(true)
    try {
      const saved = contato
        ? await api(`/contatos/${contato.id}`, { method: 'PUT', body: form })
        : await api('/contatos', { method: 'POST', body: form })
      toast(contato ? 'Contato atualizado!' : 'Contato adicionado!')
      onSave(saved)
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <form onSubmit={submit} className="form-grid">
      <div className="form-group full">
        <label>Nome *</label>
        <input className="input" value={form.nome} onChange={set('nome')} placeholder="Nome do contato" required />
      </div>
      <div className="form-group">
        <label>Empresa</label>
        <input className="input" value={form.empresa} onChange={set('empresa')} placeholder="Empresa" />
      </div>
      <div className="form-group">
        <label>Cargo</label>
        <input className="input" value={form.cargo} onChange={set('cargo')} placeholder="Cargo / função" />
      </div>
      <div className="form-group">
        <label>Telefone</label>
        <input className="input" value={form.telefone} onChange={set('telefone')} placeholder="(11) 99999-9999" />
      </div>
      <div className="form-group">
        <label>E-mail</label>
        <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="email@empresa.com" />
      </div>
      <div className="form-group full">
        <label>Status do lead</label>
        <select className="input" value={form.status_lead} onChange={set('status_lead')}>
          <option value="novo">Novo</option>
          <option value="em_contato">Em Contato</option>
          <option value="negociando">Negociando</option>
          <option value="fechado">Fechado</option>
          <option value="perdido">Perdido</option>
        </select>
      </div>
      <div className="form-group full">
        <label>Observações</label>
        <textarea className="input textarea" value={form.observacoes} onChange={set('observacoes')} placeholder="Notas livres..." rows={3} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="spinner-sm"></span> : <i className="bx bx-save"></i>}
          {saving ? 'Salvando...' : (contato ? 'Atualizar' : 'Adicionar')}
        </button>
      </div>
    </form>
  )
}

function ContatoDetail({ contatoId, onUpdate }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(false)
  const [novaInteracao, setNovaInteracao] = useState({ tipo: 'nota', descricao: '' })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    try { setData(await api(`/contatos/${contatoId}`)) }
    catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [contatoId])

  useEffect(() => { load() }, [load])

  const addInteracao = async e => {
    e.preventDefault()
    if (!novaInteracao.descricao.trim()) { toast('Descrição obrigatória', 'error'); return }
    setSaving(true)
    try {
      const saved = await api(`/contatos/${contatoId}/interacoes`, { method: 'POST', body: novaInteracao })
      setData(p => ({ ...p, interacoes: [saved, ...p.interacoes] }))
      setNovaInteracao({ tipo: 'nota', descricao: '' })
      toast('Interação registrada!')
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const delInteracao = async id => {
    try {
      await api(`/interacoes/${id}`, { method: 'DELETE' })
      setData(p => ({ ...p, interacoes: p.interacoes.filter(i => i.id !== id) }))
      toast('Interação removida')
    } catch (e) { toast(e.message, 'error') }
    setConfirm(null)
  }

  const fmt = dt => dt ? new Date(dt.replace(' ', 'T')).toLocaleString('pt-BR', { day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit' }) : '—'

  if (loading) return <div className="loading-state"><div className="spinner"></div></div>
  if (!data) return null

  return (
    <>
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      {editando && (
        <Modal title="Editar contato" onClose={() => setEditando(false)}>
          <ContatoForm contato={data}
            onSave={saved => { setData(p => ({ ...p, ...saved })); setEditando(false); onUpdate?.(saved) }}
            onClose={() => setEditando(false)} />
        </Modal>
      )}
      <div className="detail-header">
        <div className="detail-avatar"><i className="bx bx-briefcase"></i></div>
        <div className="detail-info">
          <h2>{data.nome}</h2>
          {data.empresa  && <span><i className="bx bx-buildings"></i> {data.empresa}{data.cargo ? ` · ${data.cargo}` : ''}</span>}
          {data.telefone && <span><i className="bx bx-phone"></i> {data.telefone}</span>}
          {data.email    && <span><i className="bx bx-envelope"></i> {data.email}</span>}
        </div>
        <div className="detail-header-actions">
          <Badge status={data.status_lead} map={LEAD_STATUS} />
          <button className="btn btn-ghost" onClick={() => setEditando(true)}><i className="bx bx-edit"></i> Editar</button>
        </div>
      </div>

      {data.observacoes && <div className="obs-box"><i className="bx bx-note"></i> {data.observacoes}</div>}

      <div className="section-title"><i className="bx bx-chat"></i> Histórico de Interações</div>
      <form onSubmit={addInteracao} className="interacao-form">
        <select className="input select-sm" value={novaInteracao.tipo} onChange={e => setNovaInteracao(p => ({ ...p, tipo: e.target.value }))}>
          <option value="nota">📝 Nota</option>
          <option value="ligacao">📞 Ligação</option>
          <option value="email">✉️ E-mail</option>
          <option value="reuniao">📅 Reunião</option>
          <option value="whatsapp">💬 WhatsApp</option>
        </select>
        <textarea className="input textarea" value={novaInteracao.descricao}
          onChange={e => setNovaInteracao(p => ({ ...p, descricao: e.target.value }))}
          placeholder="Descreva o que foi discutido..." rows={2} />
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="spinner-sm"></span> : <i className="bx bx-plus"></i>}
          Registrar
        </button>
      </form>

      <div className="timeline">
        {data.interacoes?.length === 0
          ? <p className="empty-msg">Nenhuma interação registrada.</p>
          : data.interacoes?.map(i => (
            <div key={i.id} className="timeline-item">
              <div className="timeline-dot crm">
                <i className={`bx ${INTERACAO_ICON[i.tipo] || 'bx-note'}`}></i>
              </div>
              <div className="timeline-content">
                <div className="timeline-head">
                  <span className="timeline-date">{fmt(i.data)}</span>
                  <button className="btn-icon btn-danger-ghost" onClick={() => setConfirm({ msg: 'Remover esta interação?', fn: () => delInteracao(i.id) })}>
                    <i className="bx bx-trash"></i>
                  </button>
                </div>
                <p>{i.descricao}</p>
              </div>
            </div>
          ))}
      </div>
    </>
  )
}

function Contatos() {
  const [contatos, setContatos] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [modal, setModal] = useState(null)
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    try {
      let url = '/contatos?'
      if (q) url += `q=${encodeURIComponent(q)}&`
      if (filtroStatus) url += `status_lead=${filtroStatus}`
      setContatos(await api(url))
    } catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [q, filtroStatus])

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t) }, [load])

  const del = async id => {
    try {
      await api(`/contatos/${id}`, { method: 'DELETE' })
      setContatos(p => p.filter(c => c.id !== id))
      if (detail === id) setDetail(null)
      toast('Contato removido')
    } catch (e) { toast(e.message, 'error') }
    setConfirm(null)
  }

  return (
    <div className="page">
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}
      {modal === 'novo' && (
        <Modal title="Novo contato" onClose={() => setModal(null)}>
          <ContatoForm onSave={saved => { setContatos(p => [saved, ...p]); setModal(null) }} onClose={() => setModal(null)} />
        </Modal>
      )}
      {detail && (
        <Modal title="Ficha do contato" onClose={() => setDetail(null)} size="lg">
          <ContatoDetail contatoId={detail} onUpdate={saved => setContatos(p => p.map(c => c.id === saved.id ? saved : c))} />
        </Modal>
      )}

      <div className="page-header">
        <div>
          <h1><i className="bx bx-briefcase"></i> CRM · Contatos</h1>
          <span className="page-sub">{contatos.length} contato{contatos.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('novo')}>
          <i className="bx bx-plus"></i> Novo contato
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-bar flex-1">
          <i className="bx bx-search"></i>
          <input className="input search-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nome, empresa, telefone..." />
          {q && <button className="btn-icon" onClick={() => setQ('')}><i className="bx bx-x"></i></button>}
        </div>
        <select className="input select-filter" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="novo">Novo</option>
          <option value="em_contato">Em Contato</option>
          <option value="negociando">Negociando</option>
          <option value="fechado">Fechado</option>
          <option value="perdido">Perdido</option>
        </select>
      </div>

      {loading
        ? <div className="loading-state"><div className="spinner"></div></div>
        : contatos.length === 0
          ? <div className="empty-state"><i className="bx bx-user-circle"></i><p>Nenhum contato encontrado.</p></div>
          : (
            <div className="contacts-grid">
              {contatos.map(c => (
                <div key={c.id} className="contact-card" onClick={() => setDetail(c.id)}>
                  <div className="contact-card-header">
                    <div className="avatar-md"><i className="bx bx-user"></i></div>
                    <div>
                      <div className="contact-name">{c.nome}</div>
                      {c.empresa && <div className="contact-company">{c.empresa}{c.cargo ? ` · ${c.cargo}` : ''}</div>}
                    </div>
                    <Badge status={c.status_lead} map={LEAD_STATUS} />
                  </div>
                  <div className="contact-info">
                    {c.telefone && <span><i className="bx bx-phone"></i> {c.telefone}</span>}
                    {c.email    && <span><i className="bx bx-envelope"></i> {c.email}</span>}
                  </div>
                  <div className="contact-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setDetail(c.id)}><i className="bx bx-show"></i> Ver</button>
                    <button className="btn btn-ghost btn-sm btn-danger-ghost" onClick={() => setConfirm({ msg: `Excluir "${c.nome}"?`, fn: () => del(c.id) })}>
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  )
}

// ─────────────────────────────────────────────
// LEMBRETES
// ─────────────────────────────────────────────
function Lembretes() {
  const [lembretes, setLembretes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConcluidos, setShowConcluidos] = useState(false)
  const [form, setForm] = useState({ titulo: '', descricao: '', data_hora: '', tipo: 'geral' })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  const load = useCallback(async () => {
    try { setLembretes(await api(`/lembretes${showConcluidos ? '' : '?concluido=0'}`)) }
    catch (e) { toast(e.message, 'error') }
    finally { setLoading(false) }
  }, [showConcluidos])

  useEffect(() => { load() }, [load])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.titulo.trim() || !form.data_hora) { toast('Título e data são obrigatórios', 'error'); return }
    setSaving(true)
    try {
      const saved = await api('/lembretes', { method: 'POST', body: { ...form, data_hora: form.data_hora.replace('T', ' ') } })
      setLembretes(p => [...p, saved])
      setForm({ titulo: '', descricao: '', data_hora: '', tipo: 'geral' })
      toast('Lembrete criado!')
    } catch (e) { toast(e.message, 'error') }
    finally { setSaving(false) }
  }

  const concluir = async id => {
    try {
      await api(`/lembretes/${id}/concluir`, { method: 'PATCH' })
      if (!showConcluidos) setLembretes(p => p.filter(l => l.id !== id))
      else setLembretes(p => p.map(l => l.id === id ? { ...l, concluido: 1 } : l))
      toast('Lembrete concluído!')
    } catch (e) { toast(e.message, 'error') }
  }

  const del = async id => {
    try {
      await api(`/lembretes/${id}`, { method: 'DELETE' })
      setLembretes(p => p.filter(l => l.id !== id))
      toast('Lembrete removido')
    } catch (e) { toast(e.message, 'error') }
    setConfirm(null)
  }

  const fmt = dt => dt ? new Date(dt.replace(' ', 'T')).toLocaleString('pt-BR', { day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit' }) : '—'
  const isUrgent = dt => dt && new Date(dt.replace(' ', 'T')) <= new Date(Date.now() + 60 * 60 * 1000)

  return (
    <div className="page">
      {confirm && <Confirm msg={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} />}

      <div className="page-header">
        <div>
          <h1><i className="bx bx-bell"></i> Lembretes</h1>
          <span className="page-sub">Seus lembretes e alertas</span>
        </div>
        <label className="toggle-label">
          <input type="checkbox" checked={showConcluidos} onChange={e => setShowConcluidos(e.target.checked)} />
          Ver concluídos
        </label>
      </div>

      <div className="card lembrete-form-card">
        <div className="card-header"><h3><i className="bx bx-plus"></i> Novo lembrete</h3></div>
        <form onSubmit={submit} className="form-grid" style={{ padding: '20px' }}>
          <div className="form-group full">
            <label>Título *</label>
            <input className="input" value={form.titulo} onChange={set('titulo')} placeholder="O que lembrar?" />
          </div>
          <div className="form-group">
            <label>Data e hora *</label>
            <input className="input" type="datetime-local" value={form.data_hora} onChange={set('data_hora')} />
          </div>
          <div className="form-group">
            <label>Tipo</label>
            <select className="input" value={form.tipo} onChange={set('tipo')}>
              <option value="geral">Geral</option>
              <option value="contato">Contato</option>
              <option value="agendamento">Agendamento</option>
            </select>
          </div>
          <div className="form-group full">
            <label>Descrição</label>
            <input className="input" value={form.descricao} onChange={set('descricao')} placeholder="Detalhes opcionais..." />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner-sm"></span> : <i className="bx bx-bell-plus"></i>}
              Criar lembrete
            </button>
          </div>
        </form>
      </div>

      {loading
        ? <div className="loading-state"><div className="spinner"></div></div>
        : lembretes.length === 0
          ? <div className="empty-state"><i className="bx bx-bell-off"></i><p>Nenhum lembrete encontrado.</p></div>
          : (
            <div className="lembretes-list">
              {lembretes.map(l => (
                <div key={l.id} className={`lembrete-item ${l.concluido ? 'concluido' : ''} ${isUrgent(l.data_hora) && !l.concluido ? 'urgente' : ''}`}>
                  <div className="lembrete-icon">
                    {isUrgent(l.data_hora) && !l.concluido ? <i className="bx bx-bell-ring"></i> : <i className="bx bx-bell"></i>}
                  </div>
                  <div className="lembrete-content">
                    <div className="lembrete-titulo">{l.titulo}</div>
                    {l.descricao && <div className="lembrete-desc">{l.descricao}</div>}
                    <div className="lembrete-time">{fmt(l.data_hora)}</div>
                  </div>
                  <div className="lembrete-actions">
                    {!l.concluido && (
                      <button className="btn btn-ghost btn-sm" onClick={() => concluir(l.id)}>
                        <i className="bx bx-check"></i> Concluir
                      </button>
                    )}
                    <button className="btn-icon btn-danger-ghost" onClick={() => setConfirm({ msg: 'Remover este lembrete?', fn: () => del(l.id) })}>
                      <i className="bx bx-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  )
}

// ─────────────────────────────────────────────
// NOTIFICAÇÕES
// ─────────────────────────────────────────────
function useNotificacoes() {
  const [alertas, setAlertas] = useState([])

  useEffect(() => {
    const check = async () => {
      try { const rows = await api('/lembretes/pendentes'); if (rows?.length > 0) setAlertas(rows) }
      catch (e) { console.error('Lembretes pendentes:', e) }
    }
    check()
    const interval = setInterval(check, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return { alertas, dismiss: id => setAlertas(p => p.filter(a => a.id !== id)) }
}

function AlertasBanner({ alertas, onDismiss }) {
  if (alertas.length === 0) return null
  return (
    <div className="alertas-banner">
      {alertas.slice(0, 3).map(a => (
        <div key={a.id} className="alerta-item">
          <i className="bx bx-bell-ring"></i>
          <span><strong>{a.titulo}</strong>{a.descricao ? ` — ${a.descricao}` : ''}</span>
          <button className="btn-icon" onClick={() => onDismiss(a.id)}><i className="bx bx-x"></i></button>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// SIDEBAR + LAYOUT
// ─────────────────────────────────────────────
const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'bx-home-alt' },
  { id: 'clientes',  label: 'Clientes',  icon: 'bx-group' },
  { id: 'agenda',    label: 'Agenda',    icon: 'bx-calendar' },
  { id: 'contatos',  label: 'CRM',       icon: 'bx-briefcase' },
  { id: 'lembretes', label: 'Lembretes', icon: 'bx-bell' },
]

function AppLayout({ children, page, setPage, dark, setDark, alertas, dismissAlerta }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user } = useAuthState()

  function handleLogout() {
    doLogout()
    toast('Sessão encerrada', 'info')
  }

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><i className="bx bxs-briefcase-alt-2"></i></div>
          {sidebarOpen && <span className="brand-name">ClientPro</span>}
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`}
              onClick={() => setPage(n.id)} title={!sidebarOpen ? n.label : ''}>
              <i className={`bx ${n.icon}`}></i>
              {sidebarOpen && <span>{n.label}</span>}
              {n.id === 'lembretes' && alertas.length > 0 && (
                <span className="badge-dot">{alertas.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={() => setDark(d => !d)} title="Alternar tema">
            <i className={`bx ${dark ? 'bx-sun' : 'bx-moon'}`}></i>
            {sidebarOpen && <span>{dark ? 'Modo claro' : 'Modo escuro'}</span>}
          </button>

          {user && (
            <div className={`sidebar-user ${!sidebarOpen ? 'sidebar-user--collapsed' : ''}`}>
              <div className="sidebar-user-avatar">
                {(user.name || user.email || '?').charAt(0).toUpperCase()}
              </div>
              {sidebarOpen && (
                <div className="sidebar-user-info">
                  <span className="sidebar-user-name">{user.name || user.email}</span>
                  <span className="sidebar-user-role">{user.role}</span>
                </div>
              )}
              <button className="sidebar-logout-btn" onClick={handleLogout} title="Sair">
                <i className="bx bx-log-out"></i>
              </button>
            </div>
          )}

          <button className="nav-item collapse-btn" onClick={() => setSidebarOpen(o => !o)}>
            <i className={`bx ${sidebarOpen ? 'bx-chevrons-left' : 'bx-chevrons-right'}`}></i>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <AlertasBanner alertas={alertas} onDismiss={dismissAlerta} />
        {children}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState('dashboard')
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const toasts = useToastSetup()
  const { logged } = useAuthState()
  const { alertas, dismiss } = useNotificacoes()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const pages = {
    dashboard: <Dashboard onNavigate={setPage} />,
    clientes:  <Clientes />,
    agenda:    <Agenda />,
    contatos:  <Contatos />,
    lembretes: <Lembretes />,
  }

 if (!logged)
   return (
     <>
       <LoginPage
         onLogin={async (email, senha) => {
           const data = await apiLogin(email, senha);
           doLogin(data.accessToken, data.user);
           toast("Login realizado com sucesso!");
         }}
       />
       <ToastContainer toasts={toasts} />
     </>
   );
  return (
    <>
      <ToastContainer toasts={toasts} />
      <AppLayout page={page} setPage={setPage} dark={dark} setDark={setDark} alertas={alertas} dismissAlerta={dismiss}>
        {pages[page]}
      </AppLayout>
    </>
  )
}