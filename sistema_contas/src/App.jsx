import { useState, useEffect, useCallback, useRef } from 'react';
import './App.css';

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const API_BASE      = 'http://localhost:3000/fiado';
const AUTH_BASE     = 'http://localhost:3000/auth';
const STORAGE_TOKEN = 'planware_token';
const STORAGE_USER  = 'planware_user';

// ─────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────
const auth = {
  getToken: () => localStorage.getItem(STORAGE_TOKEN),
  getUser:  () => { try { return JSON.parse(localStorage.getItem(STORAGE_USER)); } catch { return null; } },
  save:     (token, user) => { localStorage.setItem(STORAGE_TOKEN, token); localStorage.setItem(STORAGE_USER, JSON.stringify(user)); },
  clear:    () => { localStorage.removeItem(STORAGE_TOKEN); localStorage.removeItem(STORAGE_USER); },
  isLogged: () => !!localStorage.getItem(STORAGE_TOKEN),
};

// ─────────────────────────────────────────────
// AUTH STATE (global sem Context)
// ─────────────────────────────────────────────
let _listeners = [];
let _authState = { user: auth.getUser(), logged: auth.isLogged() };

function getAuthState() { return _authState; }
function setAuthState(next) { _authState = next; _listeners.forEach(fn => fn(next)); }
function useAuthState() {
  const [s, setS] = useState(getAuthState);
  useEffect(() => {
    _listeners.push(setS);
    return () => { _listeners = _listeners.filter(fn => fn !== setS); };
  }, []);
  return s;
}
function doLogin(token, user) { auth.save(token, user); setAuthState({ user, logged: true }); }
function doLogout()           { auth.clear();           setAuthState({ user: null, logged: false }); }

async function apiLogin(email, password) {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Credenciais inválidas');
  return json.data;
}

// ─────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────
function fmtMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

function fmtData(str) {
  if (!str) return '—';
  const [a, m, d] = str.split('-');
  return `${d}/${m}/${a}`;
}

function diasAtraso(vencimento) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento + 'T00:00:00');
  return Math.floor((hoje - venc) / 86400000);
}

function statusParcela(parcela) {
  if (parcela.pago) return 'paga';
  const hoje = new Date().toISOString().split('T')[0];
  return parcela.vencimento < hoje ? 'atrasada' : 'pendente';
}

function getNotyf() { return window.__notyf; }

// ─────────────────────────────────────────────
// API FETCH COM JWT
// ─────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // Token expirado → desloga
  if (res.status === 401) { doLogout(); return; }

  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'Erro desconhecido');
  return json.data;
}

const api = {
  get:    path        => apiFetch(path),
  post:   (path, b)   => apiFetch(path, { method: 'POST',   body: b }),
  put:    (path, b)   => apiFetch(path, { method: 'PUT',    body: b }),
  patch:  (path, b)   => apiFetch(path, { method: 'PATCH',  body: b }),
  delete: path        => apiFetch(path, { method: 'DELETE' }),
};

// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────
function useFetch(path, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true); setError(null);
    try { setData(await api.get(path)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

// ─────────────────────────────────────────────
// COMPONENTES BASE
// ─────────────────────────────────────────────
function Spinner() { return <div className="spinner" aria-label="Carregando" />; }

function Badge({ status }) {
  const labels = { paga: 'Paga', atrasada: 'Atrasada', pendente: 'Pendente' };
  return <span className={`badge badge--${status}`}>{labels[status]}</span>;
}

function EmptyState({ icon = 'bx-inbox', message = 'Nenhum registro encontrado.' }) {
  return (
    <div className="empty-state">
      <i className={`bx ${icon}`} />
      <p>{message}</p>
    </div>
  );
}

function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const fn = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal--${size}`}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Fechar">
            <i className="bx bx-x" />
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div className={`stat-card stat-card--${color || 'default'}`}>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      {sub && <span className="stat-card__sub">{sub}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────
function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [senha,    setSenha]    = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    if (!email.trim() || !senha) { setErro('Preencha e-mail e senha'); return; }
    setLoading(true);
    try {
      const { accessToken, user } = await apiLogin(email.trim(), senha);
      const hasAccess = user.role === 'SUPERADMIN' || user.permissions?.includes('FIADO');
      if (!hasAccess) { setErro('Você não tem acesso ao módulo Fiado'); return; }
      doLogin(accessToken, user);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
      </div>

      <div className="login-card">
        <div className="login-logo">
          <i className="bx bx-credit-card" />
          <span>Fiado</span>
        </div>
        <p className="login-subtitle">Sistema de Contas a Receber — Planware</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {erro && (
            <div className="login-error">
              <i className="bx bx-error-circle" />
              <span>{erro}</span>
            </div>
          )}

          <div className="login-field">
            <label>E-mail</label>
            <div className="login-input-wrap">
              <i className="bx bx-envelope login-input-icon" />
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required autoFocus autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label>Senha</label>
            <div className="login-input-wrap">
              <i className="bx bx-lock-alt login-input-icon" />
              <input
                type={showPass ? 'text' : 'password'}
                className="login-input login-input--has-right"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required autoComplete="current-password"
              />
              <button type="button" className="login-eye-btn" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                <i className={`bx ${showPass ? 'bx-hide' : 'bx-show'}`} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn--primary login-submit-btn" disabled={loading}>
            {loading ? <Spinner /> : <><i className="bx bx-log-in" />Entrar</>}
          </button>
        </form>

        <p className="login-hint">Use suas credenciais Planware</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function Sidebar({ view, setView, theme, toggleTheme }) {
  const { user } = useAuthState();

  const navItems = [
    { id: 'dashboard', icon: 'bx-grid-alt', label: 'Dashboard' },
    { id: 'clientes',  icon: 'bx-group',    label: 'Clientes'  },
  ];

  function handleLogout() {
    doLogout();
    getNotyf()?.success('Sessão encerrada');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <i className="bx bx-credit-card" />
        <span>Fiado</span>
      </div>

      <nav className="sidebar__nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`sidebar__nav-item${view === item.id ? ' active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <i className={`bx ${item.icon}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <button className="sidebar__theme-toggle" onClick={toggleTheme} title="Alternar tema">
        <i className={`bx ${theme === 'dark' ? 'bx-sun' : 'bx-moon'}`} />
        <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
      </button>

      {user && (
        <div className="sidebar__user">
          <div className="sidebar__user-avatar">
            {(user.name || user.email || '?').charAt(0).toUpperCase()}
          </div>
          <div className="sidebar__user-info">
            <span className="sidebar__user-name">{user.name || user.email}</span>
            <span className="sidebar__user-role">{user.role}</span>
          </div>
          <button className="sidebar__logout-btn" onClick={handleLogout} title="Sair">
            <i className="bx bx-log-out" />
          </button>
        </div>
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ onVerCliente }) {
  const { data, loading, error, reload } = useFetch('/dashboard');

  useEffect(() => {
    const interval = setInterval(reload, 60000);
    return () => clearInterval(interval);
  }, [reload]);

  if (loading) return <div className="page-loader"><Spinner /></div>;
  if (error)   return <div className="page-error">Erro: {error}</div>;
  if (!data)   return null;

  const { stats, inadimplentes, proximasVencer } = data;

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Dashboard</h1>
        <button className="btn btn--ghost btn--sm" onClick={reload}>
          <i className="bx bx-refresh" /> Atualizar
        </button>
      </div>

      <div className="stats-grid">
        <StatCard label="Clientes"         value={stats.total_clientes}           color="blue"   />
        <StatCard label="A receber"        value={fmtMoeda(stats.total_pendente)} color="yellow" />
        <StatCard label="Recebido (total)" value={fmtMoeda(stats.total_recebido)} color="green"  />
        <StatCard label="Em atraso"        value={fmtMoeda(stats.valor_atrasado)} color="red"
          sub={`${stats.parcelas_atrasadas} parcela(s)`} />
      </div>

      <div className="dashboard-cols">
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">
              <i className="bx bx-error-circle text-red" /> Maiores inadimplentes
            </h2>
          </div>
          {inadimplentes.length === 0
            ? <EmptyState icon="bx-check-circle" message="Nenhuma inadimplência. Parabéns!" />
            : (
              <table className="table">
                <thead>
                  <tr><th>Cliente</th><th>Parcelas</th><th>Valor em atraso</th><th>Desde</th></tr>
                </thead>
                <tbody>
                  {inadimplentes.map(c => (
                    <tr key={c.id} className="table__row--clickable" onClick={() => onVerCliente(c.id)}>
                      <td>
                        <strong>{c.nome}</strong>
                        {c.telefone && <div className="table__sub">{c.telefone}</div>}
                      </td>
                      <td><Badge status="atrasada" /> {c.qtd_parcelas_atrasadas}</td>
                      <td className="text-red fw-bold">{fmtMoeda(c.valor_atrasado)}</td>
                      <td>{fmtData(c.vencimento_mais_antigo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </section>

        <section className="card">
          <div className="card__header">
            <h2 className="card__title">
              <i className="bx bx-calendar-exclamation text-yellow" /> Vencendo em 7 dias
            </h2>
          </div>
          {proximasVencer.length === 0
            ? <EmptyState icon="bx-calendar-check" message="Nenhuma parcela vencendo em breve." />
            : (
              <table className="table">
                <thead>
                  <tr><th>Cliente</th><th>Conta</th><th>Vence</th><th>Valor</th></tr>
                </thead>
                <tbody>
                  {proximasVencer.map(p => (
                    <tr key={p.id} className="table__row--clickable" onClick={() => onVerCliente(p.cliente_id)}>
                      <td><strong>{p.cliente_nome}</strong></td>
                      <td className="table__sub">{p.conta_descricao} #{p.numero}</td>
                      <td>{fmtData(p.vencimento)}</td>
                      <td className="fw-bold">{fmtMoeda(p.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CLIENTE FORM
// ─────────────────────────────────────────────
function ClienteForm({ cliente, onClose, onSalvo }) {
  const [form, setForm] = useState({
    nome: cliente?.nome || '', telefone: cliente?.telefone || '',
    email: cliente?.email || '', observacao: cliente?.observacao || '',
  });
  const [saving, setSaving] = useState(false);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) { getNotyf()?.error('Nome é obrigatório.'); return; }
    setSaving(true);
    try {
      const salvo = cliente
        ? await api.put(`/clientes/${cliente.id}`, form)
        : await api.post('/clientes', form);
      getNotyf()?.success(cliente ? 'Cliente atualizado!' : 'Cliente cadastrado!');
      onSalvo(salvo);
    } catch (err) { getNotyf()?.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={cliente ? 'Editar cliente' : 'Novo cliente'} onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label className="form__label">Nome *</label>
          <input className="form__input" value={form.nome} onChange={set('nome')} placeholder="Nome completo" autoFocus />
        </div>
        <div className="form__row">
          <div className="form__group">
            <label className="form__label">Telefone</label>
            <input className="form__input" value={form.telefone} onChange={set('telefone')} placeholder="(00) 00000-0000" />
          </div>
          <div className="form__group">
            <label className="form__label">E-mail</label>
            <input className="form__input" value={form.email} onChange={set('email')} placeholder="email@exemplo.com" type="email" />
          </div>
        </div>
        <div className="form__group">
          <label className="form__label">Observação</label>
          <textarea className="form__textarea" value={form.observacao} onChange={set('observacao')} rows={3} placeholder="Informações adicionais..." />
        </div>
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Spinner /> : <><i className="bx bx-save" /> Salvar</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// CLIENTES LIST
// ─────────────────────────────────────────────
function ClientesList({ onVerCliente }) {
  const [busca, setBusca]         = useState('');
  const [clientes, setClientes]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [deletando, setDeletando] = useState(null);
  const buscaTimer                = useRef(null);

  const carregarClientes = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const path = q.trim() ? `/clientes/busca?q=${encodeURIComponent(q)}` : '/clientes';
      setClientes(await api.get(path));
    } catch (e) { getNotyf()?.error(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { carregarClientes(); }, [carregarClientes]);

  function handleBusca(e) {
    const q = e.target.value;
    setBusca(q);
    clearTimeout(buscaTimer.current);
    buscaTimer.current = setTimeout(() => carregarClientes(q), 300);
  }

  async function handleExcluir(cliente) {
    if (!window.confirm(`Excluir "${cliente.nome}"? Todas as contas e parcelas serão removidas.`)) return;
    setDeletando(cliente.id);
    try {
      await api.delete(`/clientes/${cliente.id}`);
      setClientes(cs => cs.filter(c => c.id !== cliente.id));
      getNotyf()?.success('Cliente excluído.');
    } catch (e) { getNotyf()?.error(e.message); }
    finally { setDeletando(null); }
  }

  return (
    <div className="page">
      <div className="page__header">
        <h1 className="page__title">Clientes</h1>
        <button className="btn btn--primary" onClick={() => setShowForm(true)}>
          <i className="bx bx-plus" /> Novo cliente
        </button>
      </div>

      <div className="search-bar">
        <i className="bx bx-search" />
        <input
          className="search-bar__input"
          value={busca}
          onChange={handleBusca}
          placeholder="Buscar por nome ou telefone..."
        />
        {busca && (
          <button className="search-bar__clear" onClick={() => { setBusca(''); carregarClientes(''); }}>
            <i className="bx bx-x" />
          </button>
        )}
      </div>

      {loading
        ? <div className="page-loader"><Spinner /></div>
        : clientes.length === 0
          ? <EmptyState icon="bx-user-x" message="Nenhum cliente encontrado." />
          : (
            <div className="card">
              <table className="table">
                <thead>
                  <tr><th>Nome</th><th>Contato</th><th>Pendente</th><th>Atrasos</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {clientes.map(c => (
                    <tr
                      key={c.id}
                      className={`table__row--clickable${c.parcelas_atrasadas > 0 ? ' table__row--atrasado' : ''}`}
                      onClick={() => onVerCliente(c.id)}
                    >
                      <td><strong>{c.nome}</strong></td>
                      <td className="table__sub">
                        {c.telefone || '—'}
                        {c.email && <div>{c.email}</div>}
                      </td>
                      <td className={c.total_pendente > 0 ? 'fw-bold text-yellow' : ''}>
                        {fmtMoeda(c.total_pendente)}
                      </td>
                      <td>
                        {c.parcelas_atrasadas > 0
                          ? <span className="pill pill--red">{c.parcelas_atrasadas} atraso(s)</span>
                          : <span className="pill pill--green">Em dia</span>}
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <div className="table__actions">
                          <button className="btn btn--ghost btn--icon" title="Ver detalhes" onClick={() => onVerCliente(c.id)}>
                            <i className="bx bx-show" />
                          </button>
                          <button className="btn btn--danger btn--icon" title="Excluir" disabled={deletando === c.id} onClick={() => handleExcluir(c)}>
                            {deletando === c.id ? <Spinner /> : <i className="bx bx-trash" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

      {showForm && (
        <ClienteForm onClose={() => setShowForm(false)} onSalvo={() => { setShowForm(false); carregarClientes(busca); }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CONTA FORM
// ─────────────────────────────────────────────
function ContaForm({ clienteId, onClose, onSalvo }) {
  const hoje = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    descricao: '', valor_total: '', num_parcelas: 1, data_primeira: hoje, observacao: '',
  });
  const [saving, setSaving] = useState(false);

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));

  const valorParcela = form.valor_total && form.num_parcelas > 0
    ? (parseFloat(form.valor_total) / parseInt(form.num_parcelas)).toFixed(2)
    : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.descricao.trim()) { getNotyf()?.error('Descrição é obrigatória.'); return; }
    if (!form.valor_total || parseFloat(form.valor_total) <= 0) { getNotyf()?.error('Valor inválido.'); return; }
    if (!form.data_primeira) { getNotyf()?.error('Informe a data da 1ª parcela.'); return; }
    setSaving(true);
    try {
      const salvo = await api.post('/contas', {
        ...form,
        cliente_id:   clienteId,
        valor_total:  parseFloat(form.valor_total),
        num_parcelas: parseInt(form.num_parcelas),
      });
      getNotyf()?.success('Conta cadastrada com parcelas geradas!');
      onSalvo(salvo);
    } catch (err) { getNotyf()?.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal title="Nova conta a receber" onClose={onClose}>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label className="form__label">Descrição *</label>
          <input className="form__input" value={form.descricao} onChange={set('descricao')} placeholder="Ex: Compra de mercadoria..." autoFocus />
        </div>
        <div className="form__row">
          <div className="form__group">
            <label className="form__label">Valor total (R$) *</label>
            <input className="form__input" type="number" step="0.01" min="0.01" value={form.valor_total} onChange={set('valor_total')} placeholder="0,00" />
          </div>
          <div className="form__group">
            <label className="form__label">Nº de parcelas</label>
            <input className="form__input" type="number" min="1" max="120" value={form.num_parcelas} onChange={set('num_parcelas')} />
          </div>
        </div>
        <div className="form__row">
          <div className="form__group">
            <label className="form__label">Vencimento da 1ª parcela *</label>
            <input className="form__input" type="date" value={form.data_primeira} onChange={set('data_primeira')} />
          </div>
          {valorParcela && (
            <div className="form__group">
              <label className="form__label">Valor por parcela</label>
              <div className="form__readonly">{fmtMoeda(parseFloat(valorParcela))}</div>
            </div>
          )}
        </div>
        <div className="form__group">
          <label className="form__label">Observação</label>
          <textarea className="form__textarea" value={form.observacao} onChange={set('observacao')} rows={2} />
        </div>
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Spinner /> : <><i className="bx bx-plus" /> Cadastrar</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// PAGAR MODAL
// ─────────────────────────────────────────────
function PagarModal({ parcela, onClose, onPago }) {
  const hoje = new Date().toISOString().split('T')[0];
  const [data_pagamento, setDataPag] = useState(hoje);
  const [observacao, setObs]         = useState('');
  const [saving, setSaving]          = useState(false);

  async function handlePagar(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const p = await api.patch(`/parcelas/${parcela.id}/pagar`, { data_pagamento, observacao });
      getNotyf()?.success(`Parcela #${parcela.numero} marcada como paga!`);
      onPago(p);
    } catch (err) { getNotyf()?.error(err.message); }
    finally { setSaving(false); }
  }

  return (
    <Modal title={`Registrar pagamento — Parcela #${parcela.numero}`} onClose={onClose} size="sm">
      <div className="pagar-info">
        <span className="pagar-info__label">Valor</span>
        <span className="pagar-info__value">{fmtMoeda(parcela.valor)}</span>
        <span className="pagar-info__label">Vencimento</span>
        <span className="pagar-info__value">{fmtData(parcela.vencimento)}</span>
      </div>
      <form className="form" onSubmit={handlePagar}>
        <div className="form__group">
          <label className="form__label">Data de pagamento</label>
          <input className="form__input" type="date" value={data_pagamento} onChange={e => setDataPag(e.target.value)} />
        </div>
        <div className="form__group">
          <label className="form__label">Observação</label>
          <input className="form__input" value={observacao} onChange={e => setObs(e.target.value)} placeholder="Ex: Pago com Pix..." />
        </div>
        <div className="form__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn--success" disabled={saving}>
            {saving ? <Spinner /> : <><i className="bx bx-check" /> Confirmar pagamento</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// PARCELA ROW
// ─────────────────────────────────────────────
function ParcelaRow({ parcela, onEstornar }) {
  const [parcelando, setParcelando] = useState(false);
  const status = statusParcela(parcela);
  const atraso = status === 'atrasada' ? diasAtraso(parcela.vencimento) : 0;

  async function handleEstornar() {
    if (!window.confirm('Estornar pagamento desta parcela?')) return;
    setParcelando(true);
    try {
      const p = await api.patch(`/parcelas/${parcela.id}/estornar`, {});
      getNotyf()?.success('Pagamento estornado.');
      onEstornar(p);
    } catch (e) { getNotyf()?.error(e.message); }
    finally { setParcelando(false); }
  }

  return (
    <tr className={`parcela-row parcela-row--${status}`}>
      <td className="parcela-row__num">#{parcela.numero}</td>
      <td>{fmtMoeda(parcela.valor)}</td>
      <td>
        {fmtData(parcela.vencimento)}
        {status === 'atrasada' && <div className="parcela-row__atraso">{atraso} dia(s) em atraso</div>}
      </td>
      <td><Badge status={status} /></td>
      <td>{parcela.data_pagamento ? fmtData(parcela.data_pagamento) : '—'}</td>
      <td>{parcela.observacao || '—'}</td>
      <td>
        {status === 'paga' && (
          <button className="btn btn--ghost btn--sm" onClick={handleEstornar} disabled={parcelando}>
            {parcelando ? <Spinner /> : <><i className="bx bx-undo" /> Estornar</>}
          </button>
        )}
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// CONTA ACCORDION
// ─────────────────────────────────────────────
function ContaAccordion({ conta, onParcelaChange, onDeletar }) {
  const [aberta, setAberta]       = useState(false);
  const [parcelas, setParcelas]   = useState([]);
  const [loadingP, setLoadingP]   = useState(false);
  const [pagarParcela, setPagarP] = useState(null);
  const [deletando, setDeletando] = useState(false);

  async function toggleAberta() {
    const novoAberta = !aberta;
    setAberta(novoAberta);
    if (novoAberta && parcelas.length === 0) {
      setLoadingP(true);
      try { setParcelas(await api.get(`/contas/${conta.id}/parcelas`)); }
      catch (e) { getNotyf()?.error(e.message); }
      finally { setLoadingP(false); }
    }
  }

  function handlePago(p) {
    setParcelas(ps => ps.map(x => x.id === p.id ? p : x));
    setPagarP(null);
    onParcelaChange();
  }

  function handleEstornar(p) {
    setParcelas(ps => ps.map(x => x.id === p.id ? p : x));
    onParcelaChange();
  }

  async function handleDeletar() {
    if (!window.confirm(`Excluir a conta "${conta.descricao}"?`)) return;
    setDeletando(true);
    try {
      await api.delete(`/contas/${conta.id}`);
      getNotyf()?.success('Conta excluída.');
      onDeletar(conta.id);
    } catch (e) { getNotyf()?.error(e.message); setDeletando(false); }
  }

  const pendentes = parcelas.filter(p => statusParcela(p) !== 'paga');

  return (
    <div className={`conta-accordion${aberta ? ' conta-accordion--aberta' : ''}`}>
      <div className="conta-accordion__header" onClick={toggleAberta}>
        <div className="conta-accordion__info">
          <span className="conta-accordion__desc">{conta.descricao}</span>
          <span className="conta-accordion__meta">
            {conta.total_parcelas}x de {fmtMoeda(conta.valor_total / conta.total_parcelas)}
            {' · '}Total: {fmtMoeda(conta.valor_total)}
          </span>
        </div>
        <div className="conta-accordion__badges">
          {conta.parcelas_atrasadas > 0 && <span className="pill pill--red">{conta.parcelas_atrasadas} atrasada(s)</span>}
          {conta.saldo_pendente > 0
            ? <span className="pill pill--yellow">{fmtMoeda(conta.saldo_pendente)} pendente</span>
            : <span className="pill pill--green">Quitada</span>}
        </div>
        <i className={`bx bx-chevron-${aberta ? 'up' : 'down'} conta-accordion__chevron`} />
      </div>

      {aberta && (
        <div className="conta-accordion__body">
          {loadingP
            ? <div className="page-loader"><Spinner /></div>
            : (
              <>
                <div className="conta-accordion__toolbar">
                  {pendentes.length > 0 && (
                    <button className="btn btn--success btn--sm" onClick={() => setPagarP(pendentes[0])}>
                      <i className="bx bx-money" /> Registrar pagamento
                    </button>
                  )}
                  <button className="btn btn--danger btn--sm" onClick={handleDeletar} disabled={deletando}>
                    {deletando ? <Spinner /> : <><i className="bx bx-trash" /> Excluir conta</>}
                  </button>
                </div>
                <div className="table-wrap">
                  <table className="table table--parcelas">
                    <thead>
                      <tr><th>#</th><th>Valor</th><th>Vencimento</th><th>Status</th><th>Pago em</th><th>Obs.</th><th>Ações</th></tr>
                    </thead>
                    <tbody>
                      {parcelas.map(p => (
                        <ParcelaRow key={p.id} parcela={p} onPagar={() => setPagarP(p)} onEstornar={handleEstornar} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
        </div>
      )}

      {pagarParcela && (
        <PagarModal parcela={pagarParcela} onClose={() => setPagarP(null)} onPago={handlePago} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CLIENTE DETALHE
// ─────────────────────────────────────────────
function ClienteDetalhe({ clienteId, onVoltar }) {
  const [cliente,   setCliente]   = useState(null);
  const [contas,    setContas]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showConta, setShowConta] = useState(false);
  const [editando,  setEditando]  = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [c, cts] = await Promise.all([
        api.get(`/clientes/${clienteId}`),
        api.get(`/clientes/${clienteId}/contas`),
      ]);
      setCliente(c);
      setContas(cts);
    } catch (e) { getNotyf()?.error(e.message); }
    finally { setLoading(false); }
  }, [clienteId]);

  useEffect(() => { carregar(); }, [carregar]);

  const totalPendente  = contas.reduce((s, c) => s + (c.saldo_pendente     || 0), 0);
  const totalAtrasadas = contas.reduce((s, c) => s + (c.parcelas_atrasadas || 0), 0);

  if (loading) return <div className="page-loader"><Spinner /></div>;
  if (!cliente) return <div className="page-error">Cliente não encontrado.</div>;

  return (
    <div className="page">
      <div className="page__header">
        <button className="btn btn--ghost btn--sm" onClick={onVoltar}>
          <i className="bx bx-arrow-back" /> Voltar
        </button>
        <div className="page__header-actions">
          <button className="btn btn--ghost" onClick={() => setEditando(true)}>
            <i className="bx bx-edit" /> Editar cliente
          </button>
          <button className="btn btn--primary" onClick={() => setShowConta(true)}>
            <i className="bx bx-plus" /> Nova conta
          </button>
        </div>
      </div>

      <div className="cliente-header card">
        <div className="cliente-header__avatar">{cliente.nome.charAt(0).toUpperCase()}</div>
        <div className="cliente-header__info">
          <h1 className="cliente-header__nome">{cliente.nome}</h1>
          <div className="cliente-header__contato">
            {cliente.telefone && <span><i className="bx bx-phone" /> {cliente.telefone}</span>}
            {cliente.email    && <span><i className="bx bx-envelope" /> {cliente.email}</span>}
          </div>
          {cliente.observacao && <p className="cliente-header__obs">{cliente.observacao}</p>}
        </div>
        <div className="cliente-header__stats">
          <StatCard label="Pendente" value={fmtMoeda(totalPendente)} color={totalPendente  > 0 ? 'yellow' : 'green'} />
          <StatCard label="Atrasos"  value={totalAtrasadas}           color={totalAtrasadas > 0 ? 'red'    : 'green'} />
          <StatCard label="Contas"   value={contas.length}            color="blue" />
        </div>
      </div>

      <h2 className="section-title">Contas a receber</h2>

      {contas.length === 0
        ? <EmptyState icon="bx-receipt" message="Nenhuma conta cadastrada para este cliente." />
        : contas.map(c => (
          <ContaAccordion
            key={c.id}
            conta={c}
            onParcelaChange={carregar}
            onDeletar={id => { setContas(cs => cs.filter(c => c.id !== id)); carregar(); }}
          />
        ))}

      {showConta && <ContaForm clienteId={clienteId} onClose={() => setShowConta(false)} onSalvo={() => { setShowConta(false); carregar(); }} />}
      {editando  && <ClienteForm cliente={cliente} onClose={() => setEditando(false)} onSalvo={c => { setCliente(c); setEditando(false); }} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [theme,     setTheme]     = useState(() => localStorage.getItem('fiado-theme') || 'light');
  const [view,      setView]      = useState('dashboard');
  const [clienteId, setClienteId] = useState(null);
  const { logged }                = useAuthState();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fiado-theme', theme);
  }, [theme]);

  function toggleTheme() { setTheme(t => t === 'dark' ? 'light' : 'dark'); }

  function irParaCliente(id) { setClienteId(id); setView('cliente-detalhe'); }
  function voltarParaClientes() { setClienteId(null); setView('clientes'); }

  // ── Tela de login ───────────────────────────
  if (!logged) return <LoginPage />;

  return (
    <div className="app-layout">
      <Sidebar
        view={view}
        setView={v => { setView(v); setClienteId(null); }}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="app-main">
        {view === 'dashboard'       && <Dashboard onVerCliente={irParaCliente} />}
        {view === 'clientes'        && <ClientesList onVerCliente={irParaCliente} />}
        {view === 'cliente-detalhe' && clienteId && <ClienteDetalhe clienteId={clienteId} onVoltar={voltarParaClientes} />}
      </main>
    </div>
  );
}