import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const API_BASE      = "http://localhost:3000";
const AUTH_BASE     = "http://localhost:3000/auth";
const STORAGE_TOKEN = "planware_token";
const STORAGE_USER  = "planware_user";
const STORAGE_THEME = "planware_hub_theme";

// ─────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────
const auth = {
  getToken : () => localStorage.getItem(STORAGE_TOKEN),
  getUser  : () => { try { return JSON.parse(localStorage.getItem(STORAGE_USER)); } catch { return null; } },
  save     : (token, user) => { localStorage.setItem(STORAGE_TOKEN, token); localStorage.setItem(STORAGE_USER, JSON.stringify(user)); },
  clear    : () => { localStorage.removeItem(STORAGE_TOKEN); localStorage.removeItem(STORAGE_USER); },
  isLogged : () => !!localStorage.getItem(STORAGE_TOKEN),
};

// ─────────────────────────────────────────────
// AUTH STATE
// ─────────────────────────────────────────────
let _listeners = [];
let _authState = { user: auth.getUser(), logged: auth.isLogged() };

function setAuthState(next) { _authState = next; _listeners.forEach((fn) => fn(next)); }
function useAuthState() {
  const [s, setS] = useState(() => _authState);
  useEffect(() => {
    _listeners.push(setS);
    return () => { _listeners = _listeners.filter((fn) => fn !== setS); };
  }, []);
  return s;
}
function doLogin(token, user) { auth.save(token, user); setAuthState({ user, logged: true }); }
function doLogout() { auth.clear(); setAuthState({ user: null, logged: false }); }

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
  if (res.status === 401) { doLogout(); throw new Error("Sessão expirada"); }
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Erro desconhecido");
  return json.data;
}

async function apiLogin(email, password) {
  const res = await fetch(`${AUTH_BASE}/login`, {
    method : "POST",
    headers: { "Content-Type": "application/json" },
    body   : JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Credenciais inválidas");
  return json.data;
}

// ─────────────────────────────────────────────
// APPS CATALOG  — inclui BARBERSHOP
// ─────────────────────────────────────────────
const ALL_APPS = [
  // ── NOVO ── Barbearia
  {
    id     : "BARBERSHOP",
    name   : "BarberShop",
    desc   : "Gestão completa de barbearia — agenda, fila, comissões e fidelidade",
    icon   : "✂",
    color  : "#FF6B2C",
    url    : "http://localhost:5184",
    badge  : "Novo",
  },
  // ── existentes ──
  {
    id   : "CLIENTPRO",
    name : "ClientPro",
    desc : "CRM & gestão de clientes, agenda e lembretes",
    icon : "◈",
    color: "#6366f1",
    url  : "http://localhost:5175",
  },
  {
    id   : "STOCKPRO",
    name : "StockPro",
    desc : "Controle de estoque e movimentações",
    icon : "⬡",
    color: "#0ea5e9",
    url  : "http://localhost:5176",
  },
  {
    id   : "FINVAULT",
    name : "FinVault",
    desc : "Gestão financeira pessoal com gráficos",
    icon : "◆",
    color: "#d4a853",
    url  : "http://localhost:5177",
  },
  {
    id   : "FINFLOW",
    name : "FinFlow",
    desc : "Controle de gastos regra 50/30/20",
    icon : "⬢",
    color: "#10b981",
    url  : "http://localhost:5178",
  },
  {
    id   : "FINANCEFLOW",
    name : "FinanceFlow",
    desc : "Fluxo de caixa e categorias avançadas",
    icon : "◇",
    color: "#f59e0b",
    url  : "http://localhost:5179",
  },
  {
    id   : "KANBAN",
    name : "KanbanFlow",
    desc : "Board kanban com drag-and-drop e equipe",
    icon : "⬛",
    color: "#8b5cf6",
    url  : "http://localhost:5181",
  },
  {
    id   : "CLINICA",
    name : "ClinicaDesk",
    desc : "Gestão clínica, agenda e prontuário",
    icon : "⊕",
    color: "#14b8a6",
    url  : "http://localhost:5182",
  },
  {
    id   : "ORDEMTECH",
    name : "OrdemTech",
    desc : "Ordens de serviço e gestão de clientes",
    icon : "⬟",
    color: "#e8192c",
    url  : "http://localhost:5180",
  },
  {
    id   : "FIADO",
    name : "Fiado",
    desc : "Contas a receber, parcelas e inadimplência",
    icon : "⬠",
    color: "#f97316",
    url  : "http://localhost:5183",
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
          <span className="toast-icon">{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "·"}</span>
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
  const [email,    setEmail]    = useState("");
  const [password, setPass]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) { toast("Preencha e-mail e senha", "error"); return; }
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
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="login-grid" />
      <div className="login-split">
        <div className="login-brand-panel">
          <div className="login-brand-inner">
            <div className="brand-mark"><span className="brand-mark-icon">⬡</span></div>
            <h1 className="brand-headline">
              Planware<br />
              <span className="brand-headline-accent">Hub</span>
            </h1>
            <p className="brand-tagline">
              Sua suite de aplicações em um único lugar. Simples, rápido, seu.
            </p>
            <div className="brand-pills">
              <span className="pill">10 aplicativos</span>
              <span className="pill">Multi-tenant</span>
              <span className="pill">Seguro</span>
              {/* Atualizado: 10 apps agora */}
            </div>
          </div>
        </div>
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
                  <input ref={inputRef} type="email" className="field-input"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com" autoComplete="email" required />
                </div>
              </div>
              <div className="field-group">
                <label>Senha</label>
                <div className="field-wrap">
                  <span className="field-icon">⚿</span>
                  <input type={showPass ? "text" : "password"}
                    className="field-input field-input--padded"
                    value={password} onChange={(e) => setPass(e.target.value)}
                    placeholder="••••••••" autoComplete="current-password" required />
                  <button type="button" className="field-eye"
                    onClick={() => setShowPass((s) => !s)} tabIndex={-1}>
                    {showPass ? "◎" : "○"}
                  </button>
                </div>
              </div>
              <button type="submit" className="login-btn" disabled={loading}>
                {loading
                  ? <span className="spin-ring" />
                  : <><span>Entrar</span><span className="login-btn-arrow">→</span></>}
              </button>
            </form>
            <p className="login-footer-text">
              Planware © {new Date().getFullYear()} · Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP CARD  — suporte ao badge "Novo"
// ─────────────────────────────────────────────
function AppCard({ app, hasAccess }) {
  return (
    <div
      className={`app-card ${hasAccess ? "app-card--active" : "app-card--locked"}`}
      onClick={() => { if (hasAccess) window.open(app.url, "_blank", "noopener"); }}
      style={{ "--app-color": app.color }}
    >
      <div className="app-card-glow" />
      <div className="app-card-top">
        <span className="app-card-icon">{app.icon}</span>
        <div className="app-card-badges">
          {app.badge && <span className="app-card-new-badge">{app.badge}</span>}
          {!hasAccess && <span className="app-card-lock">🔒</span>}
        </div>
      </div>
      <div className="app-card-body">
        <h3 className="app-card-name">{app.name}</h3>
        <p className="app-card-desc">{app.desc}</p>
      </div>
      <div className="app-card-footer">
        {hasAccess
          ? <span className="app-card-cta">Abrir <span className="app-card-arrow">→</span></span>
          : <span className="app-card-locked-label">Sem acesso</span>}
        <span className="app-card-dot" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BARBERSHOP PREVIEW CARD
// Card especial em destaque quando o tenant tem acesso
// ─────────────────────────────────────────────
function BarbershopHeroCard({ app }) {
  return (
    <div
      className="barbershop-hero-card"
      onClick={() => window.open(app.url, "_blank", "noopener")}
      style={{ "--app-color": app.color }}
    >
      <div className="bs-hero-radial" />
      <div className="bs-hero-inner">
        <div className="bs-hero-left">
          <div className="bs-hero-icon">✂</div>
          <div>
            <div className="bs-hero-title-row">
              <h3 className="bs-hero-title">BarberShop</h3>
              <span className="bs-hero-badge">Novo</span>
            </div>
            <p className="bs-hero-desc">
              Agenda inteligente, fila presencial, comissões, fidelidade e financeiro — tudo em um painel premium.
            </p>
          </div>
        </div>
        <div className="bs-hero-right">
          <div className="bs-hero-features">
            {["Agenda & slots", "Fila ao vivo", "Comissões", "Fidelidade", "Financeiro", "Estoque"].map((f) => (
              <span key={f} className="bs-hero-feat">{f}</span>
            ))}
          </div>
          <button className="bs-hero-cta">
            Abrir painel <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ user }) {
  const permissions  = user?.permissions || [];
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const hasBarbershop = isSuperAdmin || permissions.includes("BARBERSHOP");
  const barbershopApp = ALL_APPS.find((a) => a.id === "BARBERSHOP");

  // Outros apps (excluindo BARBERSHOP — renderizado separado)
  const otherApps  = ALL_APPS.filter((a) => a.id !== "BARBERSHOP");
  const userApps   = otherApps.filter((a) => isSuperAdmin || permissions.includes(a.id));
  const lockedApps = otherApps.filter((a) => !isSuperAdmin && !permissions.includes(a.id));

  // Total de apps com acesso (incluindo barbershop)
  const totalAccess = userApps.length + (hasBarbershop ? 1 : 0);

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="dashboard">
      <div className="dash-hero">
        <div className="dash-hero-text">
          <span className="dash-greeting">{greeting},</span>
          <h1 className="dash-name">{user?.name?.split(" ")[0] || "usuário"}</h1>
          <p className="dash-subtitle">
            Você tem acesso a <strong>{totalAccess}</strong> aplicativo{totalAccess !== 1 ? "s" : ""} Planware.
          </p>
        </div>
        <div className="dash-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-val">{totalAccess}</span>
            <span className="hero-stat-label">Ativo{totalAccess !== 1 ? "s" : ""}</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-val">{lockedApps.length + (!hasBarbershop ? 1 : 0)}</span>
            <span className="hero-stat-label">Bloqueado{lockedApps.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* ── Card hero do BarberShop (se tiver acesso) ── */}
      {hasBarbershop && barbershopApp && (
        <section className="dash-section">
          <div className="section-head">
            <h2 className="section-title">Em destaque</h2>
          </div>
          <BarbershopHeroCard app={barbershopApp} />
        </section>
      )}

      {/* ── Outros apps com acesso ── */}
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

      {/* ── BarberShop bloqueado ── */}
      {!hasBarbershop && barbershopApp && (
        <section className="dash-section">
          <div className="section-head">
            <h2 className="section-title section-title--muted">Disponível no plano Premium</h2>
          </div>
          <div className="apps-grid">
            <AppCard app={barbershopApp} hasAccess={false} />
          </div>
        </section>
      )}

      {/* ── Apps bloqueados ── */}
      {lockedApps.length > 0 && (
        <section className="dash-section">
          <div className="section-head">
            <h2 className="section-title section-title--muted">Não disponível no seu plano</h2>
          </div>
          <div className="apps-grid apps-grid--locked">
            {lockedApps.map((app) => (
              <AppCard key={app.id} app={app} hasAccess={false} />
            ))}
          </div>
        </section>
      )}

      {/* ── Super Admin shortcut ── */}
      {isSuperAdmin && (
        <section className="dash-section">
          <div className="admin-shortcut"
            onClick={() => window.open("http://localhost:5173", "_blank", "noopener")}>
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
// SUGESTÕES — inalterado da versão original
// ─────────────────────────────────────────────

const FEEDBACK_TYPES = [
  { value: "FEATURE",   label: "Nova funcionalidade", icon: "◇", desc: "Algo que ainda não existe na plataforma" },
  { value: "REQUISITO", label: "Melhoria",            icon: "⬡", desc: "Aprimorar algo que já existe" },
  { value: "BUG",       label: "Reportar problema",   icon: "◈", desc: "Algo que não está funcionando corretamente" },
  { value: "OUTRO",     label: "Outro",               icon: "○", desc: "Qualquer outra mensagem ou dúvida" },
];

const STATUS_CONFIG = {
  ABERTO    : { label: "Aguardando análise", cls: "status-pending",   icon: "○" },
  EM_ANALISE: { label: "Em análise",         cls: "status-reviewing", icon: "◑" },
  RESOLVIDO : { label: "Resolvido",          cls: "status-done",      icon: "●" },
  RECUSADO  : { label: "Recusado",           cls: "status-rejected",  icon: "✕" },
};

function FeedbackCard({ feedback, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const st  = STATUS_CONFIG[feedback.status] || STATUS_CONFIG.ABERTO;
  const typ = FEEDBACK_TYPES.find((t) => t.value === feedback.type);
  const adminReplies = (feedback.replies || []).filter((r) => r.user?.role === "SUPERADMIN");
  const hasReply = adminReplies.length > 0;

  async function handleDelete() {
    if (!window.confirm("Excluir este feedback?")) return;
    setDeleting(true);
    try { await apiFetch(`/feedback/${feedback.id}`, { method: "DELETE" }); onDelete(feedback.id); }
    catch { setDeleting(false); }
  }

  return (
    <div className={`suggestion-card ${hasReply ? "suggestion-card--replied" : ""}`}>
      <div className="scard-header">
        <span className={`scard-status ${st.cls}`}>{st.icon} {st.label}</span>
        {typ && <span className="scard-type-badge">{typ.icon} {typ.label}</span>}
        {hasReply && <span className="scard-has-reply">✓ Respondido pela equipe</span>}
      </div>
      <h3 className="scard-title">{feedback.title}</h3>
      <p className="scard-desc">{feedback.description}</p>
      {hasReply && (
        <div className="scard-replies">
          <button className="scard-replies-toggle" onClick={() => setExpanded((s) => !s)}>
            <span className="scard-replies-icon">◈</span>
            {expanded ? "Ocultar resposta da equipe" : `Ver resposta da equipe Planware (${adminReplies.length})`}
            <span className="scard-replies-arrow">{expanded ? "↑" : "↓"}</span>
          </button>
          {expanded && (
            <div className="scard-replies-list">
              {adminReplies.map((r) => (
                <div key={r.id} className="scard-reply">
                  <div className="scard-reply-header">
                    <span className="scard-reply-author">
                      <span className="scard-reply-badge">Equipe Planware</span>
                      {r.user?.name}
                    </span>
                    <span className="scard-reply-date">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit", month: "2-digit", year: "2-digit",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="scard-reply-text">{r.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="scard-footer">
        <span className="scard-date">{new Date(feedback.createdAt).toLocaleDateString("pt-BR")}</span>
        {feedback.status !== "RESOLVIDO" && (
          <button className="scard-delete" onClick={handleDelete} disabled={deleting} title="Excluir feedback">
            {deleting ? "..." : "✕"}
          </button>
        )}
      </div>
    </div>
  );
}

function SuggestionsPage({ user, toast }) {
  const [tab,       setTab]       = useState("new");
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [sending,   setSending]   = useState(false);
  const [form,      setForm]      = useState({ title: "", description: "", type: "FEATURE" });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const loadMine = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch("/feedback");
      setFeedbacks(Array.isArray(data) ? data : []);
    } catch { toast("Erro ao carregar sugestões", "error"); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { if (tab === "mine") loadMine(); }, [tab, loadMine]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) { toast("Título e descrição são obrigatórios", "error"); return; }
    setSending(true);
    try {
      await apiFetch("/feedback", { method: "POST", body: { type: form.type, title: form.title.trim(), description: form.description.trim() } });
      toast("Sugestão enviada! Obrigado pelo feedback 🙌");
      setForm({ title: "", description: "", type: "FEATURE" });
      setTab("mine");
    } catch (e) { toast(e.message || "Erro ao enviar", "error"); }
    finally { setSending(false); }
  }

  function handleDelete(id) { setFeedbacks((prev) => prev.filter((f) => f.id !== id)); toast("Feedback excluído"); }

  const selectedType = FEEDBACK_TYPES.find((t) => t.value === form.type);

  return (
    <div className="suggestions-page">
      <div className="page-hero">
        <h1>Sugestões & Melhorias</h1>
        <p>Sua voz molda o futuro da plataforma. Envie ideias, reporte problemas, peça melhorias.</p>
      </div>
      <div className="suggestions-tabs">
        <button className={`stab ${tab === "new"  ? "stab--active" : ""}`} onClick={() => setTab("new")}>Nova sugestão</button>
        <button className={`stab ${tab === "mine" ? "stab--active" : ""}`} onClick={() => setTab("mine")}>
          Minhas sugestões
          {feedbacks.filter((f) => (f.replies || []).some((r) => r.user?.role === "SUPERADMIN")).length > 0 && (
            <span className="stab-dot" />
          )}
        </button>
      </div>

      {tab === "new" && (
        <div className="suggestion-form-wrap">
          <form className="suggestion-form" onSubmit={handleSubmit}>
            <div className="sfield">
              <label>Tipo de solicitação</label>
              <div className="type-cards">
                {FEEDBACK_TYPES.map((t) => (
                  <button key={t.value} type="button"
                    className={`type-card ${form.type === t.value ? "type-card--active" : ""}`}
                    onClick={() => set("type", t.value)}>
                    <span className="type-card-icon">{t.icon}</span>
                    <span className="type-card-label">{t.label}</span>
                    <span className="type-card-desc">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="sfield">
              <label>Título <span className="required">*</span></label>
              <input className="sinput" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder={
                  form.type === "BUG"       ? "Ex: Não consigo salvar um novo cliente" :
                  form.type === "FEATURE"   ? "Ex: Exportar relatório em Excel" :
                  form.type === "REQUISITO" ? "Ex: Melhorar filtro da agenda" :
                  "Descreva brevemente sua mensagem"
                }
                maxLength={120} required />
              <span className="char-count">{form.title.length}/120</span>
            </div>
            <div className="sfield">
              <label>Descrição detalhada <span className="required">*</span></label>
              <textarea className="sinput stextarea" value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder={
                  form.type === "BUG"
                    ? "Descreva o que estava fazendo quando o erro ocorreu..."
                    : "Explique com detalhes o que você precisa e por que seria útil..."
                }
                rows={5} maxLength={2000} required />
              <span className="char-count">{form.description.length}/2000</span>
            </div>
            <div className="sform-footer">
              <p className="sform-note">
                {selectedType?.value === "BUG"
                  ? "Bugs são priorizados. Nossa equipe irá investigar e responder em breve."
                  : "Todas as sugestões são lidas pela equipe Planware. Respondemos em até 48h úteis."}
              </p>
              <button type="submit" className="submit-suggestion" disabled={sending}>
                {sending
                  ? <><span className="spin-ring spin-ring--sm" /> Enviando...</>
                  : <><span>Enviar {selectedType?.label || "sugestão"}</span><span>→</span></>}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === "mine" && (
        <div className="mine-list">
          {loading ? (
            <div className="mine-loading"><span className="spin-ring" /></div>
          ) : feedbacks.length === 0 ? (
            <div className="mine-empty">
              <span className="mine-empty-icon">◎</span>
              <h3>Nenhuma sugestão ainda</h3>
              <p>Quando você enviar sugestões, elas aparecerão aqui com o status de acompanhamento.</p>
            </div>
          ) : (
            <>
              {feedbacks.some((f) => (f.replies || []).some((r) => r.user?.role === "SUPERADMIN")) && (
                <div className="mine-replied-notice">
                  <span>◈</span> A equipe Planware respondeu alguns dos seus feedbacks. Confira abaixo!
                </div>
              )}
              {feedbacks.map((fb) => (
                <FeedbackCard key={fb.id} feedback={fb} onDelete={handleDelete} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR — inalterada
// ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "dashboard",   label: "Aplicativos", icon: "⬡" },
  { id: "suggestions", label: "Sugestões",   icon: "◇" },
];

function Sidebar({ page, setPage, user, theme, setTheme }) {
  const initial      = (user?.name || user?.email || "?").charAt(0).toUpperCase();
  const isSuperAdmin = user?.role === "SUPERADMIN";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">⬡</span>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Planware</span>
          <span className="sidebar-brand-sub">Hub</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button key={item.id}
            className={`sidebar-nav-item ${page === item.id ? "sidebar-nav-item--active" : ""}`}
            onClick={() => setPage(item.id)}>
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-label">{item.label}</span>
            {page === item.id && <span className="sidebar-nav-indicator" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-theme">
        <button className={`theme-btn ${theme === "midnight" ? "theme-btn--active" : ""}`} onClick={() => setTheme("midnight")} title="Midnight">◑</button>
        <button className={`theme-btn ${theme === "abyss"    ? "theme-btn--active" : ""}`} onClick={() => setTheme("abyss")}    title="Abyss">◕</button>
        <button className={`theme-btn ${theme === "white"    ? "theme-btn--active" : ""}`} onClick={() => setTheme("white")}    title="White">○</button>
      </div>
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">{initial}</div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{user?.name || user?.email}</span>
          <span className="sidebar-user-role">{isSuperAdmin ? "Super Admin" : user?.role || "Usuário"}</span>
        </div>
        <button className="sidebar-logout" onClick={doLogout} title="Sair">⇥</button>
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
  const [page,  setPage]  = useState("dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_THEME) || "midnight");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_THEME, theme);
  }, [theme]);

  if (!logged) return (
    <>
      <LoginPage toast={toast} />
      <ToastStack toasts={toasts} />
    </>
  );

  return (
    <div className="hub-layout">
      <Sidebar page={page} setPage={setPage} user={user} theme={theme} setTheme={setTheme} />
      <main className="hub-main">
        {page === "dashboard"   && <Dashboard user={user} />}
        {page === "suggestions" && <SuggestionsPage user={user} toast={toast} />}
      </main>
      <ToastStack toasts={toasts} />
    </div>
  );
}