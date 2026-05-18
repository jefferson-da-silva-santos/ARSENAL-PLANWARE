import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const API_BASE = "http://localhost:3000";
const AUTH_BASE = "http://localhost:3000/auth";
const STORAGE_TOKEN = "planware_token";
const STORAGE_USER = "planware_user";
const STORAGE_THEME = "planware_hub_theme";

// ─────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────
const auth = {
  getToken: () => localStorage.getItem(STORAGE_TOKEN),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_USER));
    } catch {
      return null;
    }
  },
  save: (token, user) => {
    localStorage.setItem(STORAGE_TOKEN, token);
    localStorage.setItem(STORAGE_USER, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(STORAGE_TOKEN);
    localStorage.removeItem(STORAGE_USER);
  },
  isLogged: () => !!localStorage.getItem(STORAGE_TOKEN),
};

// ─────────────────────────────────────────────
// AUTH STATE
// ─────────────────────────────────────────────
let _listeners = [];
let _authState = { user: auth.getUser(), logged: auth.isLogged() };

function setAuthState(next) {
  _authState = next;
  _listeners.forEach((fn) => fn(next));
}
function useAuthState() {
  const [s, setS] = useState(() => _authState);
  useEffect(() => {
    _listeners.push(setS);
    return () => {
      _listeners = _listeners.filter((fn) => fn !== setS);
    };
  }, []);
  return s;
}
function doLogin(token, user) {
  auth.save(token, user);
  setAuthState({ user, logged: true });
}
function doLogout() {
  auth.clear();
  setAuthState({ user: null, logged: false });
}

// ─────────────────────────────────────────────
// API
// ─────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 401) {
    doLogout();
    throw new Error("Sessão expirada");
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erro desconhecido");
  return json.data;
}

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
// APPS CATALOG
// ─────────────────────────────────────────────
const ALL_APPS = [
  {
    id: "CLIENTPRO",
    name: "ClientPro",
    desc: "CRM & gestão de clientes, agenda e lembretes",
    icon: "◈",
    color: "#6366f1",
    url: "http://localhost:5175",
  },
  {
    id: "STOCKPRO",
    name: "StockPro",
    desc: "Controle de estoque e movimentações",
    icon: "⬡",
    color: "#0ea5e9",
    url: "http://localhost:5176",
  },
  {
    id: "FINVAULT",
    name: "FinVault",
    desc: "Gestão financeira pessoal com gráficos",
    icon: "◆",
    color: "#d4a853",
    url: "http://localhost:5177",
  },
  {
    id: "FINFLOW",
    name: "FinFlow",
    desc: "Controle de gastos regra 50/30/20",
    icon: "⬢",
    color: "#10b981",
    url: "http://localhost:5178",
  },
  {
    id: "FINANCEFLOW",
    name: "FinanceFlow",
    desc: "Fluxo de caixa e categorias avançadas",
    icon: "◇",
    color: "#f59e0b",
    url: "http://localhost:5179",
  },
  {
    id: "KANBAN",
    name: "KanbanFlow",
    desc: "Board kanban com drag-and-drop e equipe",
    icon: "⬛",
    color: "#8b5cf6",
    url: "http://localhost:5181",
  },
  {
    id: "CLINICA",
    name: "ClinicaDesk",
    desc: "Gestão clínica, agenda e prontuário",
    icon: "⊕",
    color: "#14b8a6",
    url: "http://localhost:5182",
  },
  {
    id: "ORDEMTECH",
    name: "OrdemTech",
    desc: "Ordens de serviço e gestão de clientes",
    icon: "⬟",
    color: "#e8192c",
    url: "http://localhost:5180",
  },
  {
    id: "FIADO",
    name: "Fiado",
    desc: "Contas a receber, parcelas e inadimplência",
    icon: "⬠",
    color: "#f97316",
    url: "http://localhost:5183",
  },
];

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  return { toasts, toast: add };
}

function ToastStack({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-item toast-${t.type}`}>
          <span className="toast-icon">
            {t.type === "success" ? "✓" : t.type === "error" ? "✕" : "·"}
          </span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────
function LoginPage({ toast }) {
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast("Preencha e-mail e senha", "error");
      return;
    }
    setLoading(true);
    try {
      const { accessToken, user } = await apiLogin(email.trim(), password);
      doLogin(accessToken, user);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-scene">
      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Grid texture */}
      <div className="login-grid" />

      <div className="login-split">
        {/* Left panel — brand */}
        <div className="login-brand-panel">
          <div className="login-brand-inner">
            <div className="brand-mark">
              <span className="brand-mark-icon">⬡</span>
            </div>
            <h1 className="brand-headline">
              Planware
              <br />
              <span className="brand-headline-accent">Hub</span>
            </h1>
            <p className="brand-tagline">
              Sua suite de aplicações em um único lugar. Simples, rápido, seu.
            </p>
            <div className="brand-pills">
              <span className="pill">9 aplicativos</span>
              <span className="pill">Multi-tenant</span>
              <span className="pill">Seguro</span>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="login-form-panel">
          <div className="login-form-inner">
            <div className="login-form-header">
              <h2>Bem-vindo de volta</h2>
              <p>Entre com suas credenciais Planware</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="field-group">
                <label>E-mail</label>
                <div className="field-wrap">
                  <span className="field-icon">@</span>
                  <input
                    ref={inputRef}
                    type="email"
                    className="field-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Senha</label>
                <div className="field-wrap">
                  <span className="field-icon">⚿</span>
                  <input
                    type={showPass ? "text" : "password"}
                    className="field-input field-input--padded"
                    value={password}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="field-eye"
                    onClick={() => setShowPass((s) => !s)}
                    tabIndex={-1}
                  >
                    {showPass ? "◎" : "○"}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? (
                  <span className="spin-ring" />
                ) : (
                  <>
                    <span>Entrar</span>
                    <span className="login-btn-arrow">→</span>
                  </>
                )}
              </button>
            </form>

            <p className="login-footer-text">
              Planware © {new Date().getFullYear()} · Todos os direitos
              reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP CARD
// ─────────────────────────────────────────────
function AppCard({ app, hasAccess }) {
  function handleOpen() {
    if (!hasAccess) return;
    window.open(app.url, "_blank", "noopener");
  }

  return (
    <div
      className={`app-card ${hasAccess ? "app-card--active" : "app-card--locked"}`}
      onClick={handleOpen}
      style={{ "--app-color": app.color }}
    >
      <div className="app-card-glow" />
      <div className="app-card-top">
        <span className="app-card-icon">{app.icon}</span>
        {!hasAccess && <span className="app-card-lock">🔒</span>}
      </div>
      <div className="app-card-body">
        <h3 className="app-card-name">{app.name}</h3>
        <p className="app-card-desc">{app.desc}</p>
      </div>
      <div className="app-card-footer">
        {hasAccess ? (
          <span className="app-card-cta">
            Abrir <span className="app-card-arrow">→</span>
          </span>
        ) : (
          <span className="app-card-locked-label">Sem acesso</span>
        )}
        <span className="app-card-dot" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ user }) {
  const permissions = user?.permissions || [];
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const userApps = ALL_APPS.filter(
    (a) => isSuperAdmin || permissions.includes(a.id),
  );
  const lockedApps = ALL_APPS.filter(
    (a) => !isSuperAdmin && !permissions.includes(a.id),
  );

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="dashboard">
      {/* Hero */}
      <div className="dash-hero">
        <div className="dash-hero-text">
          <span className="dash-greeting">{greeting},</span>
          <h1 className="dash-name">
            {user?.name?.split(" ")[0] || "usuário"}
          </h1>
          <p className="dash-subtitle">
            Você tem acesso a <strong>{userApps.length}</strong> aplicativo
            {userApps.length !== 1 ? "s" : ""} Planware.
          </p>
        </div>
        <div className="dash-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-val">{userApps.length}</span>
            <span className="hero-stat-label">
              Ativo{userApps.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-val">{lockedApps.length}</span>
            <span className="hero-stat-label">
              Bloqueado{lockedApps.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Apps ativos */}
      {userApps.length > 0 && (
        <section className="dash-section">
          <div className="section-head">
            <h2 className="section-title">Seus aplicativos</h2>
            <span className="section-badge">{userApps.length}</span>
          </div>
          <div className="apps-grid">
            {userApps.map((app) => (
              <AppCard key={app.id} app={app} hasAccess={true} />
            ))}
          </div>
        </section>
      )}

      {/* Apps bloqueados */}
      {lockedApps.length > 0 && (
        <section className="dash-section">
          <div className="section-head">
            <h2 className="section-title section-title--muted">
              Não disponível no seu plano
            </h2>
          </div>
          <div className="apps-grid apps-grid--locked">
            {lockedApps.map((app) => (
              <AppCard key={app.id} app={app} hasAccess={false} />
            ))}
          </div>
        </section>
      )}

      {/* Admin shortcut */}
      {isSuperAdmin && (
        <section className="dash-section">
          <div
            className="admin-shortcut"
            onClick={() =>
              window.open("http://localhost:5173", "_blank", "noopener")
            }
          >
            <div className="admin-shortcut-left">
              <span className="admin-shortcut-icon">⬡</span>
              <div>
                <h3>PlawareAdmin</h3>
                <p>Painel de administração — tenants, usuários e permissões</p>
              </div>
            </div>
            <span className="admin-shortcut-arrow">→</span>
          </div>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SUGESTÕES
// ─────────────────────────────────────────────
const SUGGESTION_TYPES = [
  { value: "FEATURE", label: "Nova funcionalidade" },
  { value: "REQUISITO", label: "Melhoria existente" },
  { value: "BUG", label: "Reportar problema" },
  { value: "OUTRO", label: "Outro" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Baixa", color: "#10b981" },
  { value: "medium", label: "Média", color: "#f59e0b" },
  { value: "high", label: "Alta", color: "#ef4444" },
];

function SuggestionsPage({ user, toast }) {
  const [tab, setTab] = useState("new"); // "new" | "mine"
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "feature",
    priority: "medium",
    app_id: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const loadMine = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/feedback");
      setSuggestions(Array.isArray(data) ? data : []);
    } catch (e) {
      toast("Erro ao carregar sugestões", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "mine") loadMine();
  }, [tab, loadMine]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast("Título e descrição são obrigatórios", "error");
      return;
    }
    setSending(true);
    try {
      await apiFetch("/feedback", {
        method: "POST",
        body: { ...form, user_id: user?.id, user_name: user?.name },
      });
      toast("Sugestão enviada! Obrigado pelo feedback 🙌");
      setForm({
        title: "",
        description: "",
        type: "feature",
        priority: "medium",
        app_id: "",
      });
      setTab("mine");
    } catch (e) {
      toast(e.message || "Erro ao enviar", "error");
    } finally {
      setSending(false);
    }
  }

  const STATUS_LABEL = {
    pending: { label: "Aguardando", cls: "status-pending" },
    reviewing: { label: "Em análise", cls: "status-reviewing" },
    planned: { label: "Planejado", cls: "status-planned" },
    done: { label: "Implementado", cls: "status-done" },
    rejected: { label: "Recusado", cls: "status-rejected" },
  };

  return (
    <div className="suggestions-page">
      <div className="page-hero">
        <h1>Sugestões & Melhorias</h1>
        <p>
          Sua voz molda o futuro da plataforma. Envie ideias, reporte problemas,
          peça melhorias.
        </p>
      </div>

      <div className="suggestions-tabs">
        <button
          className={`stab ${tab === "new" ? "stab--active" : ""}`}
          onClick={() => setTab("new")}
        >
          Nova sugestão
        </button>
        <button
          className={`stab ${tab === "mine" ? "stab--active" : ""}`}
          onClick={() => setTab("mine")}
        >
          Minhas sugestões
        </button>
      </div>

      {tab === "new" && (
        <div className="suggestion-form-wrap">
          <form className="suggestion-form" onSubmit={handleSubmit}>
            <div className="sform-row">
              <div className="sfield">
                <label>Tipo de solicitação</label>
                <div className="type-pills">
                  {SUGGESTION_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className={`type-pill ${form.type === t.value ? "type-pill--active" : ""}`}
                      onClick={() => set("type", t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sfield">
                <label>Prioridade</label>
                <div className="priority-pills">
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      className={`priority-pill ${form.priority === p.value ? "priority-pill--active" : ""}`}
                      style={{ "--p-color": p.color }}
                      onClick={() => set("priority", p.value)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sfield">
              <label>Aplicativo relacionado (opcional)</label>
              <select
                className="sselect"
                value={form.app_id}
                onChange={(e) => set("app_id", e.target.value)}
              >
                <option value="">Plataforma geral</option>
                {ALL_APPS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sfield">
              <label>
                Título <span className="required">*</span>
              </label>
              <input
                className="sinput"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Resuma sua sugestão em uma linha"
                maxLength={120}
                required
              />
              <span className="char-count">{form.title.length}/120</span>
            </div>

            <div className="sfield">
              <label>
                Descrição detalhada <span className="required">*</span>
              </label>
              <textarea
                className="sinput stextarea"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Descreva com detalhes: o problema, o impacto, o que você espera como solução..."
                rows={5}
                maxLength={2000}
                required
              />
              <span className="char-count">{form.description.length}/2000</span>
            </div>

            <div className="sform-footer">
              <p className="sform-note">
                Todas as sugestões são lidas pela equipe Planware. Respondemos
                em até 48h úteis.
              </p>
              <button
                type="submit"
                className="submit-suggestion"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <span className="spin-ring spin-ring--sm" /> Enviando...
                  </>
                ) : (
                  <>
                    <span>Enviar sugestão</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "mine" && (
        <div className="mine-list">
          {loading ? (
            <div className="mine-loading">
              <span className="spin-ring" />
            </div>
          ) : suggestions.length === 0 ? (
            <div className="mine-empty">
              <span className="mine-empty-icon">◎</span>
              <h3>Nenhuma sugestão ainda</h3>
              <p>
                Quando você enviar sugestões, elas aparecerão aqui com o status
                de acompanhamento.
              </p>
            </div>
          ) : (
            suggestions.map((s) => {
              const st = STATUS_LABEL[s.status] || STATUS_LABEL.pending;
              const pr =
                PRIORITY_OPTIONS.find((p) => p.value === s.priority) ||
                PRIORITY_OPTIONS[1];
              const app = ALL_APPS.find((a) => a.id === s.app_id);
              return (
                <div key={s.id} className="suggestion-card">
                  <div className="scard-header">
                    <span className={`scard-status ${st.cls}`}>{st.label}</span>
                    <span
                      className="scard-priority"
                      style={{ color: pr.color }}
                    >
                      ● {pr.label}
                    </span>
                    {app && (
                      <span
                        className="scard-app"
                        style={{ "--app-color": app.color }}
                      >
                        {app.icon} {app.name}
                      </span>
                    )}
                  </div>
                  <h3 className="scard-title">{s.title}</h3>
                  <p className="scard-desc">{s.description}</p>
                  <div className="scard-footer">
                    <span className="scard-type">
                      {SUGGESTION_TYPES.find((t) => t.value === s.type)
                        ?.label || s.type}
                    </span>
                    <span className="scard-date">
                      {new Date(s.created_at || Date.now()).toLocaleDateString(
                        "pt-BR",
                      )}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard", label: "Aplicativos", icon: "⬡" },
  { id: "suggestions", label: "Sugestões", icon: "◇" },
];

function Sidebar({ page, setPage, user, theme, setTheme }) {
  const initial = (user?.name || user?.email || "?").charAt(0).toUpperCase();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">⬡</span>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Planware</span>
          <span className="sidebar-brand-sub">Hub</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${page === item.id ? "sidebar-nav-item--active" : ""}`}
            onClick={() => setPage(item.id)}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
            {page === item.id && <span className="sidebar-nav-indicator" />}
          </button>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      {/* Theme toggle — 3 temas */}
      <div className="sidebar-theme">
        <button
          className={`theme-btn ${theme === "midnight" ? "theme-btn--active" : ""}`}
          onClick={() => setTheme("midnight")}
          title="Midnight"
        >
          ◑
        </button>
        <button
          className={`theme-btn ${theme === "abyss" ? "theme-btn--active" : ""}`}
          onClick={() => setTheme("abyss")}
          title="Abyss"
        >
          ◕
        </button>
        <button
          className={`theme-btn ${theme === "white" ? "theme-btn--active" : ""}`}
          onClick={() => setTheme("white")}
          title="White"
        >
          ○
        </button>
      </div>

      {/* User */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{initial}</div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.name || user?.email}</span>
          <span className="sidebar-user-role">
            {isSuperAdmin ? "Super Admin" : user?.role || "Usuário"}
          </span>
        </div>
        <button className="sidebar-logout" onClick={doLogout} title="Sair">
          ⇥
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const { user, logged } = useAuthState();
  const { toasts, toast } = useToast();
  const [page, setPage] = useState("dashboard");
  const [theme, setTheme] = useState(
    () => localStorage.getItem(STORAGE_THEME) || "midnight",
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  if (!logged)
    return (
      <>
        <LoginPage toast={toast} />
        <ToastStack toasts={toasts} />
      </>
    );

  return (
    <div className="hub-layout">
      <Sidebar
        page={page}
        setPage={setPage}
        user={user}
        theme={theme}
        setTheme={setTheme}
      />

      <main className="hub-main">
        {page === "dashboard" && <Dashboard user={user} />}
        {page === "suggestions" && (
          <SuggestionsPage user={user} toast={toast} />
        )}
      </main>

      <ToastStack toasts={toasts} />
    </div>
  );
}
