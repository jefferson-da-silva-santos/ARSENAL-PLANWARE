import { useEffect, useState, useCallback } from "react";
import { Notyf } from "notyf";
import "notyf/notyf.min.css";
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const API_BASE = "http://localhost:3000/finvault/api";
const AUTH_BASE     = "http://localhost:3000/auth";
const STORAGE_TOKEN = "planware_token";
const STORAGE_USER  = "planware_user";

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
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Credenciais inválidas");
  return json.data;
}

// ─────────────────────────────────────────────
// API COM JWT
// ─────────────────────────────────────────────
const notyf = new Notyf({ duration: 3000, position: { x: "right", y: "top" } });

const apiFetch = {
  async get(endpoint) {
    const token = auth.getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) { doLogout(); return { data: null }; }
    if (!res.ok) throw new Error("Erro na requisição");
    const data = await res.json();
    return { data };
  },
  async post(endpoint, body) {
    const token = auth.getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401) { doLogout(); return { data: null }; }
    if (!res.ok) throw new Error("Erro ao salvar");
    const data = await res.json();
    return { data };
  },
  async delete(endpoint) {
    const token = auth.getToken();
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.status === 401) { doLogout(); return { data: null }; }
    if (!res.ok) throw new Error("Erro ao remover");
    const data = await res.json();
    return { data };
  },
};

// ─────────────────────────────────────────────
// THEME HOOK
// ─────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("finvault-theme");
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("finvault-theme", theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), []);
  return { theme, toggle };
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
const fmt = n => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

const CATEGORIES = {
  income:  ["Salário", "Freelance", "Investimentos", "Outros"],
  expense: ["Alimentação", "Transporte", "Moradia", "Saúde", "Lazer", "Outros"],
};

const CHART_COLORS = ["#d4a853", "#c084fc", "#38bdf8", "#34d399", "#fb7185", "#a78bfa"];

function buildChartOptions(theme) {
  const isLight = theme === "light";
  const legendClr = isLight ? "#6b5a3e" : "#94a3b8";
  const tickClr   = isLight ? "#8b7355" : "#64748b";
  const gridClr   = isLight ? "rgba(100,70,20,0.07)" : "rgba(255,255,255,0.04)";
  const barColor  = isLight ? "rgba(184,133,42,0.65)" : "rgba(212,168,83,0.7)";
  return {
    pieOptions: { plugins: { legend: { labels: { color: legendClr, font: { family: "Syne", size: 12 } } } } },
    barOptions: {
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: tickClr }, grid: { color: gridClr } },
        y: { ticks: { color: tickClr }, grid: { color: gridClr } },
      },
    },
    barColor,
  };
}

// ─────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────
function LoginPage({ theme, onToggleTheme }) {
  const [email,    setEmail]    = useState("");
  const [senha,    setSenha]    = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !senha) { setErro("Preencha e-mail e senha"); return; }
    setLoading(true);
    try {
      const { accessToken, user } = await apiLogin(email.trim(), senha);
      const hasAccess = user.role === "SUPERADMIN" || user.permissions?.includes("FINVAULT");
      if (!hasAccess) { setErro("Você não tem acesso ao módulo FinVault"); return; }
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
          <span className="brand-icon">◈</span>
          <span className="brand-name">Finvault</span>
        </div>
        <p className="login-subtitle">Gestão Financeira — Planware</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {erro && <div className="login-error"><span>⚠</span><span>{erro}</span></div>}

          <div className="login-field">
            <label>E-mail</label>
            <div className="login-input-wrap">
              <span className="login-input-icon" style={{ fontSize: "1rem" }}>✉</span>
              <input type="email" className="login-input" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
                required autoFocus autoComplete="email" />
            </div>
          </div>

          <div className="login-field">
            <label>Senha</label>
            <div className="login-input-wrap">
              <span className="login-input-icon" style={{ fontSize: "1rem" }}>🔒</span>
              <input type={showPass ? "text" : "password"} className="login-input login-input--has-right"
                value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••"
                required autoComplete="current-password" />
              <button type="button" className="login-eye-btn" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                {showPass ? "🙈" : "👁"}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn login-submit-btn" disabled={loading}>
            {loading ? "Entrando..." : "→ Entrar"}
          </button>
        </form>

        <button className="theme-toggle" onClick={onToggleTheme} style={{ marginTop: 16, width: "100%", justifyContent: "center" }}>
          <div className={`theme-toggle__track ${theme === "light" ? "is-light" : ""}`}>
            <div className="theme-toggle__thumb" />
          </div>
          <span className="theme-toggle__icon">{theme === "light" ? "🌞" : "🌜"}</span>
          <span className="theme-toggle__label">{theme === "light" ? "Claro" : "Escuro"}</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTES (iguais ao original)
// ─────────────────────────────────────────────
function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === "light";
  return (
    <button className="theme-toggle" onClick={onToggle} title="Alternar tema">
      <div className={`theme-toggle__track ${isLight ? "is-light" : ""}`}>
        <div className="theme-toggle__thumb" />
      </div>
      <span className="theme-toggle__icon">{isLight ? "🌞" : "🌜"}</span>
      <span className="theme-toggle__label">{isLight ? "Claro" : "Escuro"}</span>
    </button>
  );
}

function StatCard({ label, value, accent, icon }) {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card__header">
        <span className="stat-card__icon">{icon}</span>
        <span className="stat-card__label">{label}</span>
      </div>
      <div className="stat-card__value">{value}</div>
    </div>
  );
}

function TransactionItem({ t, onDelete }) {
  return (
    <div className={`tx-item tx-item--${t.type}`}>
      <div className="tx-item__dot" />
      <div className="tx-item__info">
        <span className="tx-item__category">{t.category || "Sem categoria"}</span>
        <span className="tx-item__desc">{t.description || "—"}</span>
      </div>
      <div className="tx-item__right">
        <span className="tx-item__amount">{t.type === "expense" ? "−" : "+"} {fmt(t.amount)}</span>
        <span className="tx-item__date">{new Date(t.date).toLocaleDateString("pt-BR")}</span>
      </div>
      <button className="tx-item__delete" onClick={() => onDelete(t.id)} title="Remover">✕</button>
    </div>
  );
}

function TransactionForm({ onSuccess }) {
  const [form, setForm] = useState({
    type: "income", amount: "", category: "", description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.amount || !form.date) return notyf.error("Preencha os campos obrigatórios");
    try {
      setLoading(true);
      await apiFetch.post("/transactions", { ...form, amount: Number(form.amount) });
      notyf.success("Transação registrada!");
      setForm({ type: "income", amount: "", category: "", description: "", date: new Date().toISOString().split("T")[0] });
      onSuccess();
    } catch { notyf.error("Erro ao salvar transação"); }
    finally { setLoading(false); }
  };

  return (
    <form className="tx-form" onSubmit={handleSubmit}>
      <h2 className="section-title">Nova Transação</h2>
      <div className="tx-form__toggle">
        {["income", "expense"].map(t => (
          <button key={t} type="button" className={`toggle-btn toggle-btn--${t} ${form.type === t ? "active" : ""}`} onClick={() => set("type", t)}>
            {t === "income" ? "↑ Entrada" : "↓ Saída"}
          </button>
        ))}
      </div>
      <div className="field"><label>Valor</label><input type="number" min="0" step="0.01" placeholder="0,00" value={form.amount} onChange={e => set("amount", e.target.value)} /></div>
      <div className="field">
        <label>Categoria</label>
        <select value={form.category} onChange={e => set("category", e.target.value)}>
          <option value="">Selecione...</option>
          {CATEGORIES[form.type].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="field"><label>Descrição</label><input placeholder="Ex: Conta de luz" value={form.description} onChange={e => set("description", e.target.value)} /></div>
      <div className="field"><label>Data</label><input type="date" value={form.date} onChange={e => set("date", e.target.value)} /></div>
      <button className={`submit-btn ${loading ? "loading" : ""}`} type="submit" disabled={loading}>
        {loading ? "Salvando..." : "Registrar Transação"}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────
// MAIN APP (autenticado)
// ─────────────────────────────────────────────
function FinVaultApp() {
  const { theme, toggle } = useTheme();
  const { pieOptions, barOptions, barColor } = buildChartOptions(theme);
  const { user } = useAuthState();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary]           = useState({});
  const [category, setCategory]         = useState([]);
  const [monthly, setMonthly]           = useState([]);
  const [alert, setAlert]               = useState({});
  const [activeTab, setActiveTab]       = useState("overview");
  const [loading, setLoading]           = useState(true);

  const loadData = useCallback(async () => {
    const month = new Date().toISOString().slice(5, 7);
    try {
      const [t, s, c, m, a] = await Promise.all([
        apiFetch.get("/transactions"),
        apiFetch.get(`/summary/${month}`),
        apiFetch.get("/charts/category"),
        apiFetch.get("/charts/monthly"),
        apiFetch.get("/alerts"),
      ]);
      setTransactions(t.data || []);
      setSummary(s.data || {});
      setCategory(c.data || []);
      setMonthly(m.data || []);
      setAlert(a.data || {});
    } catch (err) { notyf.error(`Erro ao carregar dados: ${err.message}`); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const deleteItem = async id => {
    try { await apiFetch.delete(`/transactions/${id}`); notyf.success("Transação removida"); loadData(); }
    catch { notyf.error("Erro ao remover"); }
  };

  const balance = (summary.income || 0) - (summary.expense || 0);

  const pieData = {
    labels: category.map(c => c.category || "Outros"),
    datasets: [{ data: category.map(c => c.total), backgroundColor: CHART_COLORS, borderWidth: 0 }],
  };

  const barData = {
    labels: monthly.map(m => m.month),
    datasets: [{ label: "Total", data: monthly.map(m => m.total), backgroundColor: barColor, borderRadius: 6 }],
  };

  const TABS = [
    { id: "overview",      label: "Visão Geral" },
    { id: "transactions",  label: "Transações" },
    { id: "analytics",     label: "Análises" },
    { id: "add",           label: "+ Adicionar" },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">Finvault</span>
        </div>
        <nav className="sidebar__nav">
          {TABS.map(t => (
            <button key={t.id} className={`nav-item ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="sidebar__bottom">
          <ThemeToggle theme={theme} onToggle={toggle} />

          {/* User card + logout */}
          {user && (
            <div className="finvault-user">
              <div className="finvault-user-avatar">{(user.name || user.email || "?").charAt(0).toUpperCase()}</div>
              <div className="finvault-user-info">
                <span className="finvault-user-name">{user.name || user.email}</span>
                <span className="finvault-user-role">{user.role}</span>
              </div>
              <button className="finvault-logout-btn" onClick={() => doLogout()} title="Sair">✕</button>
            </div>
          )}

          <span className="sidebar__footer-text">Finvault · v2.0</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar__left">
            <h1 className="topbar__title">{TABS.find(t => t.id === activeTab)?.label}</h1>
            <span className="topbar__date">{new Date().toLocaleDateString("pt-BR", { weekday: "long", month: "long", day: "numeric" })}</span>
          </div>
          {alert?.alert && <div className="topbar__alert">⚠ {alert.message}</div>}
        </header>

        {loading ? (
          <div className="loader"><div className="loader__ring" /><p>Carregando dados...</p></div>
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="view view--overview">
                <div className="stats-grid">
                  <StatCard label="Entradas" value={fmt(summary.income)} accent="income" icon="↑" />
                  <StatCard label="Saídas"   value={fmt(summary.expense)} accent="expense" icon="↓" />
                  <StatCard label="Saldo"    value={fmt(balance)} accent={balance < 0 ? "negative" : "balance"} icon="◎" />
                </div>
                <div className="charts-grid">
                  <div className="chart-card"><h3 className="chart-card__title">Por Categoria</h3><div className="chart-card__body"><Pie data={pieData} options={pieOptions} /></div></div>
                  <div className="chart-card"><h3 className="chart-card__title">Evolução Mensal</h3><div className="chart-card__body"><Bar data={barData} options={barOptions} /></div></div>
                </div>
                <div className="recent-card">
                  <div className="recent-card__header">
                    <h3 className="chart-card__title">Últimas Transações</h3>
                    <button className="link-btn" onClick={() => setActiveTab("transactions")}>Ver todas →</button>
                  </div>
                  <div className="tx-list">{transactions.slice(0, 5).map(t => <TransactionItem key={t.id} t={t} onDelete={deleteItem} />)}</div>
                </div>
              </div>
            )}

            {activeTab === "transactions" && (
              <div className="view">
                <div className="tx-list-full">
                  {transactions.length === 0
                    ? <div className="empty">Nenhuma transação encontrada.</div>
                    : transactions.map(t => <TransactionItem key={t.id} t={t} onDelete={deleteItem} />)}
                </div>
              </div>
            )}

            {activeTab === "analytics" && (
              <div className="view view--analytics">
                <div className="charts-grid charts-grid--full">
                  <div className="chart-card"><h3 className="chart-card__title">Distribuição por Categoria</h3><div className="chart-card__body chart-card__body--tall"><Pie data={pieData} options={pieOptions} /></div></div>
                  <div className="chart-card"><h3 className="chart-card__title">Volume Mensal</h3><div className="chart-card__body chart-card__body--tall"><Bar data={barData} options={barOptions} /></div></div>
                </div>
              </div>
            )}

            {activeTab === "add" && (
              <div className="view view--add">
                <TransactionForm onSuccess={() => { loadData(); setActiveTab("overview"); }} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const { logged } = useAuthState();
  const { theme, toggle } = useTheme();

  if (!logged) return <LoginPage theme={theme} onToggleTheme={toggle} />;
  return <FinVaultApp />;
}