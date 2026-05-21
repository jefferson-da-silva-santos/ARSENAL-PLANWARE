import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Package,
  LayoutDashboard,
  ArrowUpDown,
  AlertTriangle,
  Search,
  Plus,
  X,
  Pencil,
  Trash2,
  FileText,
  Loader2,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  ClipboardList,
  RefreshCw,
  Menu,
  ArrowUp,
  ArrowDown,
  DollarSign,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const API_BASE = "http://localhost:3000/stockpro/api";
const AUTH_BASE = "http://localhost:3000/auth";
const STORAGE_TOKEN = "planware_token";
const STORAGE_USER = "planware_user";

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
// AUTH STATE (global sem Context)
// ─────────────────────────────────────────────
let _listeners = [];
let _state = { user: auth.getUser(), logged: auth.isLogged() };

function getState() {
  return _state;
}
function setState(next) {
  _state = next;
  _listeners.forEach((fn) => fn(next));
}
function useAuthState() {
  const [s, setS] = useState(getState);
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
  setState({ user, logged: true });
}
function doLogout() {
  auth.clear();
  setState({ user: null, logged: false });
}

// ─────────────────────────────────────────────
// API CLIENT
// ─────────────────────────────────────────────
const api = async (url, options = {}) => {
  const token = auth.getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

 if (res.status === 401) { 
  console.log("TOKEN INVALIDO");
  doLogout(); 
  return; 
}

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro na requisição");
  return data;
};

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
// THEME HOOK
// ─────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("stockpro-theme") || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("stockpro-theme", theme);
    } catch (err) {
      console.log(err);
    }
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((prev) => (prev === "dark" ? "light" : "dark")),
    [],
  );
  return { theme, toggle };
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="theme-toggle"
      onClick={onToggle}
      title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      aria-label="Alternar tema"
    >
      <Moon className="icon-dark" />
      <Sun className="icon-light" />
    </button>
  );
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
let toastId = 0;

function useToast() {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500,
    );
  }, []);
  return { toasts, show };
}

function ToastArea({ toasts }) {
  return (
    <div className="toast-area">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === "success" ? (
            <CheckCircle className="toast-icon" />
          ) : (
            <AlertCircle className="toast-icon" />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    n || 0,
  );
const initials = (s) =>
  (s || "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
const fmtDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ─────────────────────────────────────────────
// LOGIN PAGE
// ───────────────────

// Ícone de olho — SVG inline (sem dependência de lib de ícones)
function EyeOpen() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeSlash() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
function IconBox() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="20"
      height="20"
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function IconSend() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="16"
      height="16"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
function IconSun() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="14"
      height="14"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}
function IconMoon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      width="14"
      height="14"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function LoginPage({ onLogin, onForgot, theme, onToggleTheme }) {
  const [view, setView] = useState("login"); // 'login' | 'forgot'
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const emailRef = useRef(null);
  const forgotRef = useRef(null);

  // Foca o campo correto e limpa mensagens ao trocar de view
  useEffect(() => {
    setErro("");
    setSucesso("");
    if (view === "login") setTimeout(() => emailRef.current?.focus(), 350);
    if (view === "forgot") setTimeout(() => forgotRef.current?.focus(), 350);
  }, [view]);

  // ── Login ──────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setErro("");
    if (!email.trim()) {
      setErro("Informe seu e-mail");
      return;
    }
    if (!senha) {
      setErro("Informe sua senha");
      return;
    }

    setLoading(true);
    try {
      await onLogin(email.trim().toLowerCase(), senha);
    } catch (err) {
      setErro(err.message || "Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  // ── Recuperação de senha ───────────────────────────────────
  async function handleForgot(e) {
    e.preventDefault();
    setErro("");
    if (!email.trim()) {
      setErro("Informe seu e-mail");
      return;
    }

    setLoading(true);
    try {
      if (onForgot) {
        await onForgot(email.trim().toLowerCase());
      } else {
        // fallback: simula delay
        await new Promise((r) => setTimeout(r, 900));
      }
      setSucesso(
        "Se o e-mail estiver cadastrado, você receberá as instruções em breve.",
      );
    } catch (err) {
      setErro(err.message || "Erro ao solicitar recuperação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const isForgot = view === "forgot";

  return (
    <div className="sp-lp-root">
      {/* Blobs de fundo — reutiliza variáveis do design system */}
      <div className="sp-lp-blobs" aria-hidden="true">
        <div className="sp-lp-blob sp-lp-blob--1" />
        <div className="sp-lp-blob sp-lp-blob--2" />
        <div className="sp-lp-blob sp-lp-blob--3" />
      </div>

      <div className="sp-lp-group">
        {/* ════════════════════════════════════════
            BANNER — desliza conforme o view
        ════════════════════════════════════════ */}
        <aside
          className={`sp-lp-banner ${isForgot ? "sp-lp-banner--right" : "sp-lp-banner--left"}`}
        >
          {/* Malha de pontos decorativos */}
          <div className="sp-lp-banner-grid" aria-hidden="true" />

          {/* Círculos de brilho */}
          <div className="sp-lp-glow sp-lp-glow--tl" aria-hidden="true" />
          <div className="sp-lp-glow sp-lp-glow--br" aria-hidden="true" />

          <div className="sp-lp-banner-inner">
            {/* Logo / marca */}
            <div className="sp-lp-brand">
              <div className="sp-lp-brand-icon">
                <IconBox />
              </div>
              <div className="sp-lp-brand-text">
                <span className="sp-lp-brand-name">StockPro</span>
                <span className="sp-lp-brand-sub">Inventory Management</span>
              </div>
            </div>

            {/* Conteúdo varia por view */}
            {!isForgot ? (
              <>
                <h1 className="sp-lp-banner-title">
                  Controle totaldo seu estoque.
                </h1>
                <p className="sp-lp-banner-text">
                  Movimentações, alertas de reposição e relatórios em tempo
                  real.
                </p>
                {/* Chips de feature */}
                <div className="sp-lp-chips">
                  {[
                    "Entrada & saída",
                    "Alertas de estoque",
                    "Histórico completo",
                  ].map((chip) => (
                    <span key={chip} className="sp-lp-chip">
                      {chip}
                    </span>
                  ))}
                </div>
                <a
                  href="mailto:suporte@planware.com.br?subject=Solicitar acesso StockPro"
                  className="sp-lp-banner-btn"
                  aria-label="Solicitar acesso ao StockPro"
                >
                  Solicitar acesso →
                </a>
              </>
            ) : (
              <>
                <h1 className="sp-lp-banner-title">
                  Recuperar
                  <br />
                  acesso.
                </h1>
                <p className="sp-lp-banner-text">
                  Enviaremos as instruções de redefinição para o seu e-mail
                  cadastrado.
                </p>
                <button
                  className="sp-lp-banner-btn"
                  onClick={() => setView("login")}
                >
                  ← Voltar ao login
                </button>
              </>
            )}
          </div>
        </aside>

        {/* ════════════════════════════════════════
            FORMULÁRIO — lado oposto ao banner
        ════════════════════════════════════════ */}
        <div
          className={`sp-lp-form-panel ${isForgot ? "sp-lp-form-panel--left" : "sp-lp-form-panel--right"}`}
        >
          {/* ── LOGIN ── */}
          {!isForgot && (
            <form
              className="sp-lp-form"
              onSubmit={handleLogin}
              noValidate
              aria-label="Formulário de login StockPro"
            >
              <div className="sp-lp-form-header">
                <h2 className="sp-lp-form-title">Entrar na conta</h2>
                <p className="sp-lp-form-sub">Use suas credenciais Planware</p>
              </div>

              {erro && (
                <div className="sp-lp-alert sp-lp-alert--error" role="alert">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{erro}</span>
                </div>
              )}

              {/* E-mail */}
              <div className="sp-lp-field">
                <label htmlFor="sp-email" className="sp-lp-label">
                  E-mail
                </label>
                <div className="sp-lp-input-wrap">
                  <span className="sp-lp-input-icon" aria-hidden="true">
                    <IconMail />
                  </span>
                  <input
                    ref={emailRef}
                    id="sp-email"
                    type="email"
                    className="sp-lp-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="sp-lp-field">
                <label htmlFor="sp-senha" className="sp-lp-label">
                  Senha
                </label>
                <div className="sp-lp-input-wrap">
                  <span className="sp-lp-input-icon" aria-hidden="true">
                    <IconLock />
                  </span>
                  <input
                    id="sp-senha"
                    type={showPass ? "text" : "password"}
                    className="sp-lp-input sp-lp-input--padded-right"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="sp-lp-eye-btn"
                    onClick={() => setShowPass((s) => !s)}
                    tabIndex={-1}
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPass ? <EyeSlash /> : <EyeOpen />}
                  </button>
                </div>
              </div>

              {/* Esqueceu */}
              <button
                type="button"
                className="sp-lp-link-btn"
                onClick={() => setView("forgot")}
              >
                Esqueceu sua senha?
              </button>

              {/* Submit */}
              <button
                type="submit"
                className="sp-lp-submit-btn"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? (
                  <span className="sp-lp-spinner" aria-hidden="true" />
                ) : (
                  <>
                    <IconBox /> Entrar
                  </>
                )}
              </button>

              {/* Toggle tema */}
              {onToggleTheme && (
                <button
                  type="button"
                  className="sp-lp-theme-btn"
                  onClick={onToggleTheme}
                >
                  {theme === "dark" ? (
                    <>
                      <IconSun /> Modo claro
                    </>
                  ) : (
                    <>
                      <IconMoon /> Modo escuro
                    </>
                  )}
                </button>
              )}
            </form>
          )}

          {/* ── ESQUECEU SENHA ── */}
          {isForgot && (
            <form
              className="sp-lp-form"
              onSubmit={handleForgot}
              noValidate
              aria-label="Formulário de recuperação de senha"
            >
              <div className="sp-lp-form-header">
                <h2 className="sp-lp-form-title">Recuperar senha</h2>
                <p className="sp-lp-form-sub">
                  Informe seu e-mail e enviaremos as instruções.
                </p>
              </div>

              {erro && (
                <div className="sp-lp-alert sp-lp-alert--error" role="alert">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{erro}</span>
                </div>
              )}

              {sucesso && (
                <div className="sp-lp-alert sp-lp-alert--success" role="status">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    width="16"
                    height="16"
                    aria-hidden="true"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>{sucesso}</span>
                </div>
              )}

              <div className="sp-lp-field">
                <label htmlFor="sp-forgot-email" className="sp-lp-label">
                  E-mail
                </label>
                <div className="sp-lp-input-wrap">
                  <span className="sp-lp-input-icon" aria-hidden="true">
                    <IconMail />
                  </span>
                  <input
                    ref={forgotRef}
                    id="sp-forgot-email"
                    type="email"
                    className="sp-lp-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    required
                    disabled={loading || !!sucesso}
                  />
                </div>
              </div>

              {!sucesso && (
                <button
                  type="submit"
                  className="sp-lp-submit-btn"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <span className="sp-lp-spinner" aria-hidden="true" />
                  ) : (
                    <>
                      <IconSend /> Enviar instruções
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                className="sp-lp-link-btn"
                onClick={() => {
                  setView("login");
                  setSucesso("");
                }}
              >
                ← Voltar ao login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PRODUCT MODAL
// ─────────────────────────────────────────────
const EMPTY_PRODUCT = {
  nome: "",
  sku: "",
  marca: "",
  categoria: "",
  preco_custo: "",
  preco_venda: "",
  quantidade_estoque: "",
  estoque_minimo: 5,
  unidade_medida: "un",
  ncm: "",
};

function ProductModal({ product, onClose, onSave, toast }) {
  const [form, setForm] = useState(
    product ? { ...product } : { ...EMPTY_PRODUCT },
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!product?.id;

  const set = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nome || form.nome.length < 2) errs.nome = "Mínimo 2 caracteres";
    if (!form.sku) errs.sku = "SKU obrigatório";
    if (
      form.preco_venda === "" ||
      isNaN(form.preco_venda) ||
      Number(form.preco_venda) < 0
    )
      errs.preco_venda = "Preço inválido";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        preco_custo: Number(form.preco_custo) || 0,
        preco_venda: Number(form.preco_venda),
        quantidade_estoque: Number(form.quantidade_estoque) || 0,
        estoque_minimo: Number(form.estoque_minimo) || 5,
      };
      if (isEdit) {
        await api(`/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast("Produto atualizado com sucesso!");
      } else {
        await api("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast("Produto cadastrado com sucesso!");
      }
      onSave();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h3>
            <Package /> {isEdit ? "Editar Produto" : "Novo Produto"}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group form-full">
              <label className="form-label">Nome do Produto *</label>
              <input
                className={`form-input ${errors.nome ? "error" : ""}`}
                value={form.nome}
                onChange={(e) => set("nome", e.target.value)}
                placeholder="Ex: Parafuso Phillips M4"
              />
              {errors.nome && <span className="form-error">{errors.nome}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">SKU *</label>
              <input
                className={`form-input ${errors.sku ? "error" : ""}`}
                value={form.sku}
                onChange={(e) => set("sku", e.target.value.toUpperCase())}
                placeholder="Ex: PAR-M4-001"
              />
              {errors.sku && <span className="form-error">{errors.sku}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Marca</label>
              <input
                className="form-input"
                value={form.marca}
                onChange={(e) => set("marca", e.target.value)}
                placeholder="Ex: Tramontina"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Categoria</label>
              <input
                className="form-input"
                value={form.categoria}
                onChange={(e) => set("categoria", e.target.value)}
                placeholder="Ex: Fixadores"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unidade de Medida</label>
              <select
                className="form-select"
                value={form.unidade_medida}
                onChange={(e) => set("unidade_medida", e.target.value)}
              >
                <option value="un">Unidade (un)</option>
                <option value="kg">Quilograma (kg)</option>
                <option value="g">Grama (g)</option>
                <option value="lt">Litro (lt)</option>
                <option value="m">Metro (m)</option>
                <option value="cx">Caixa (cx)</option>
                <option value="pc">Peça (pc)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">NCM</label>
              <input
                className="form-input"
                value={form.ncm}
                onChange={(e) => set("ncm", e.target.value)}
                placeholder="Ex: 7318.15.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preço de Custo (R$)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.01"
                value={form.preco_custo}
                onChange={(e) => set("preco_custo", e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Preço de Venda (R$) *</label>
              <input
                className={`form-input ${errors.preco_venda ? "error" : ""}`}
                type="number"
                min="0"
                step="0.01"
                value={form.preco_venda}
                onChange={(e) => set("preco_venda", e.target.value)}
                placeholder="0,00"
              />
              {errors.preco_venda && (
                <span className="form-error">{errors.preco_venda}</span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Qtd. Inicial em Estoque</label>
              <input
                className="form-input"
                type="number"
                min="0"
                value={form.quantidade_estoque}
                onChange={(e) => set("quantidade_estoque", e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Estoque Mínimo (Alerta)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                value={form.estoque_minimo}
                onChange={(e) => set("estoque_minimo", e.target.value)}
              />
              <span className="form-hint">
                Alerta quando atingir este valor
              </span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="spinner" style={{ width: 15, height: 15 }} />
            ) : (
              <Plus />
            )}
            {isEdit ? "Salvar Alterações" : "Cadastrar Produto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOVEMENT MODAL
// ─────────────────────────────────────────────
function MovementModal({ product, onClose, onSave, toast }) {
  const [type, setType] = useState("IN");
  const [quantity, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast("Informe uma quantidade válida", "error");
      return;
    }
    setSaving(true);
    try {
      await api("/movements", {
        method: "POST",
        body: JSON.stringify({
          product_id: product.id,
          type,
          quantity: qty,
          reason:
            reason ||
            (type === "IN" ? "Entrada de Estoque" : "Saída de Estoque"),
        }),
      });
      toast(`${type === "IN" ? "Entrada" : "Saída"} registrada com sucesso!`);
      onSave();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h3>
            <ArrowUpDown /> Movimentação de Estoque
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="modal-body">
          <div
            style={{
              background: "var(--bg-elevated)",
              borderRadius: "var(--radius)",
              padding: "10px 14px",
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div className="product-avatar">{initials(product.nome)}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                {product.nome}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                SKU: {product.sku} · Estoque atual:{" "}
                <strong
                  style={{
                    color:
                      product.quantidade_estoque <= product.estoque_minimo
                        ? "var(--danger)"
                        : "var(--success)",
                  }}
                >
                  {product.quantidade_estoque} {product.unidade_medida}
                </strong>
              </div>
            </div>
          </div>
          <div className="movement-type-btns">
            <button
              className={`movement-type-btn ${type === "IN" ? "active-in" : ""}`}
              onClick={() => setType("IN")}
            >
              <ArrowUp /> Entrada
            </button>
            <button
              className={`movement-type-btn ${type === "OUT" ? "active-out" : ""}`}
              onClick={() => setType("OUT")}
            >
              <ArrowDown /> Saída
            </button>
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Quantidade *</label>
              <input
                className="form-input"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Motivo</label>
              <input
                className="form-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  type === "IN" ? "Compra, Devolução..." : "Venda, Ajuste..."
                }
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className={`btn ${type === "IN" ? "btn-primary" : "btn-danger"}`}
            onClick={submit}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="spinner" style={{ width: 15, height: 15 }} />
            ) : type === "IN" ? (
              <ArrowUp />
            ) : (
              <ArrowDown />
            )}
            Registrar {type === "IN" ? "Entrada" : "Saída"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DELETE MODAL
// ─────────────────────────────────────────────
function DeleteModal({ product, onClose, onConfirm, toast }) {
  const [deleting, setDeleting] = useState(false);

  const confirm = async () => {
    setDeleting(true);
    try {
      await api(`/products/${product.id}`, { method: "DELETE" });
      toast("Produto removido com sucesso!");
      onConfirm();
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-header">
          <h3>
            <Trash2 /> Excluir Produto
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="delete-modal-body">
          <div className="delete-icon-wrap">
            <Trash2 />
          </div>
          <h3>Tem certeza?</h3>
          <p>
            O produto <strong>"{product.nome}"</strong> será desativado.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-danger"
            onClick={confirm}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="spinner" style={{ width: 15, height: 15 }} />
            ) : (
              <Trash2 />
            )}
            Confirmar Exclusão
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HISTORY MODAL
// ─────────────────────────────────────────────
function HistoryModal({ product, onClose }) {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api(`/movements/${product.id}`)
      .then((d) => setMovements(d?.data || d || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [product.id]);

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal modal-wide">
        <div className="modal-header">
          <h3>
            <ClipboardList /> Histórico — {product.nome}
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X />
          </button>
        </div>
        <div style={{ maxHeight: 420, overflowY: "auto" }}>
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" /> Carregando...
            </div>
          ) : movements.length === 0 ? (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-icon">
                <ClipboardList />
              </div>
              <h3>Sem movimentações</h3>
              <p>Nenhuma movimentação registrada para este produto.</p>
            </div>
          ) : (
            <div className="movement-list">
              {movements.map((m) => (
                <div key={m.id} className="movement-item">
                  <div
                    className={`movement-dot ${m.type === "IN" ? "in" : "out"}`}
                  >
                    {m.type === "IN" ? <ArrowUp /> : <ArrowDown />}
                  </div>
                  <div className="movement-info">
                    <div className="movement-product">
                      {m.type === "IN" ? "Entrada" : "Saída"}
                    </div>
                    <div className="movement-reason">
                      {m.reason || "Ajuste Manual"}
                    </div>
                  </div>
                  <div
                    className={`movement-qty ${m.type === "IN" ? "in" : "out"}`}
                  >
                    {m.type === "IN" ? "+" : "-"}
                    {m.quantity}
                  </div>
                  <div className="movement-date">{fmtDate(m.date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────
function DashboardPage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api("/dashboard")
      .then((d) => setData(d?.data || d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading)
    return (
      <div className="loading-state">
        <Loader2 className="spinner" /> Carregando dashboard...
      </div>
    );
  if (!data) return null;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Dashboard</h2>
          <p>Visão geral do inventário em tempo real</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <RefreshCw /> Atualizar
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-icon accent">
            <Package />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total de Produtos</span>
            <span className="stat-value">{data.total}</span>
            <span className="stat-sub">Cadastrados e ativos</span>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon success">
            <DollarSign />
          </div>
          <div className="stat-info">
            <span className="stat-label">Valor em Estoque</span>
            <span className="stat-value" style={{ fontSize: "1.2rem" }}>
              {fmt(data.totalValue)}
            </span>
            <span className="stat-sub">Preço de venda × qtd</span>
          </div>
        </div>
        <div
          className={`stat-card ${data.lowStock > 0 ? "danger" : "success"}`}
        >
          <div
            className={`stat-icon ${data.lowStock > 0 ? "danger" : "success"}`}
          >
            {data.lowStock > 0 ? <AlertTriangle /> : <CheckCircle />}
          </div>
          <div className="stat-info">
            <span className="stat-label">Estoque Baixo</span>
            <span className="stat-value">{data.lowStock}</span>
            <span className="stat-sub">
              {data.lowStock > 0 ? "Requerem atenção" : "Tudo em ordem"}
            </span>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon warning">
            <ArrowUpDown />
          </div>
          <div className="stat-info">
            <span className="stat-label">Movimentações</span>
            <span className="stat-value">
              {data.recentMovements?.length ?? 0}
            </span>
            <span className="stat-sub">Últimas registradas</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <ClipboardList /> Últimas Movimentações
          </span>
          <button
            className="btn btn-ghost"
            style={{ fontSize: "0.78rem", padding: "6px 12px" }}
            onClick={() => onNavigate("movements")}
          >
            Ver todas
          </button>
        </div>
        {!data.recentMovements?.length ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-icon">
              <ArrowUpDown />
            </div>
            <h3>Nenhuma movimentação</h3>
            <p>Registre entradas e saídas nos produtos.</p>
          </div>
        ) : (
          <div className="movement-list">
            {data.recentMovements.map((m) => (
              <div key={m.id} className="movement-item">
                <div
                  className={`movement-dot ${m.type === "IN" ? "in" : "out"}`}
                >
                  {m.type === "IN" ? <ArrowUp /> : <ArrowDown />}
                </div>
                <div className="movement-info">
                  <div className="movement-product">{m.produto_nome}</div>
                  <div className="movement-reason">
                    {m.reason || "Ajuste Manual"}
                  </div>
                </div>
                <div
                  className={`movement-qty ${m.type === "IN" ? "in" : "out"}`}
                >
                  {m.type === "IN" ? "+" : "-"}
                  {m.quantity}
                </div>
                <div className="movement-date">{fmtDate(m.date)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MOVEMENTS PAGE
// ─────────────────────────────────────────────
function MovementsPage() {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api("/movements")
      .then((d) => setMovements(d?.data || d || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Movimentações</h2>
          <p>Histórico completo de entradas e saídas</p>
        </div>
        <button className="btn btn-secondary" onClick={load}>
          <RefreshCw /> Atualizar
        </button>
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <ArrowUpDown /> Todas as Movimentações
          </span>
          <span className="badge badge-accent">
            {movements.length} registros
          </span>
        </div>
        {loading ? (
          <div className="loading-state">
            <Loader2 className="spinner" /> Carregando...
          </div>
        ) : movements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <ArrowUpDown />
            </div>
            <h3>Sem movimentações</h3>
            <p>Nenhuma movimentação registrada ainda.</p>
          </div>
        ) : (
          <div className="movement-list">
            {movements.map((m) => (
              <div key={m.id} className="movement-item">
                <div
                  className={`movement-dot ${m.type === "IN" ? "in" : "out"}`}
                >
                  {m.type === "IN" ? <ArrowUp /> : <ArrowDown />}
                </div>
                <div className="movement-info">
                  <div className="movement-product">{m.produto_nome}</div>
                  <div className="movement-reason">
                    <span className="sku-mono" style={{ marginRight: 6 }}>
                      {m.sku}
                    </span>
                    {m.reason || "Ajuste Manual"}
                  </div>
                </div>
                <span
                  className={`badge ${m.type === "IN" ? "badge-success" : "badge-danger"}`}
                >
                  {m.type === "IN" ? <TrendingUp /> : <TrendingDown />}
                  {m.type === "IN" ? "Entrada" : "Saída"}
                </span>
                <div
                  className={`movement-qty ${m.type === "IN" ? "in" : "out"}`}
                >
                  {m.type === "IN" ? "+" : "-"}
                  {m.quantity}
                </div>
                <div className="movement-date">{fmtDate(m.date)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PRODUCTS PAGE
// ─────────────────────────────────────────────
function ProductsPage({ toast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const searchRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    api(`/products?search=${encodeURIComponent(search)}`)
      .then((d) => setProducts(d?.data || d || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const openModal = (type, product = null) => {
    setSelected(product);
    setModal(type);
  };
  const closeModal = () => {
    setModal(null);
    setSelected(null);
  };
  const handleSave = () => {
    closeModal();
    load();
  };

  const lowCount = products.filter(
    (p) => p.quantidade_estoque <= p.estoque_minimo,
  ).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-text">
          <h2>Produtos</h2>
          <p>
            {products.length} produto{products.length !== 1 ? "s" : ""}{" "}
            cadastrado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={() => window.open(`${API_BASE}/report/pdf`, "_blank")}
          >
            <FileText /> Exportar PDF
          </button>
          <button
            className="btn btn-primary"
            onClick={() => openModal("create")}
          >
            <Plus /> Novo Produto
          </button>
        </div>
      </div>

      {lowCount > 0 && (
        <div className="alert-banner">
          <AlertTriangle />
          <strong>
            {lowCount} produto{lowCount > 1 ? "s" : ""}
          </strong>
          &nbsp;com estoque abaixo do mínimo.
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Package /> Inventário
          </span>
          <div className="search-wrap">
            <Search className="search-icon" />
            <input
              ref={searchRef}
              className="search-input"
              placeholder="Nome, SKU, marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" /> Sincronizando...
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Package />
              </div>
              <h3>{search ? "Nenhum resultado" : "Sem produtos"}</h3>
              <p>
                {search
                  ? `Nenhum produto encontrado para "${search}"`
                  : "Comece cadastrando seu primeiro produto."}
              </p>
              {!search && (
                <button
                  className="btn btn-primary"
                  onClick={() => openModal("create")}
                >
                  <Plus /> Cadastrar Produto
                </button>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>SKU</th>
                  <th>Marca</th>
                  <th>Preço Custo</th>
                  <th>Preço Venda</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLow = p.quantidade_estoque <= p.estoque_minimo;
                  return (
                    <tr key={p.id} className={isLow ? "row-danger" : ""}>
                      <td data-label="Produto">
                        <div className="cell-product">
                          <div className="product-avatar">
                            {initials(p.nome)}
                          </div>
                          <div>
                            <div className="product-name">{p.nome}</div>
                            {p.categoria && (
                              <div className="product-cat">{p.categoria}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label="SKU">
                        <span className="sku-mono">{p.sku}</span>
                      </td>
                      <td data-label="Marca">
                        {p.marca || (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                      <td data-label="Preço Custo" className="price-cell">
                        {fmt(p.preco_custo)}
                      </td>
                      <td data-label="Preço Venda" className="price-cell">
                        {fmt(p.preco_venda)}
                      </td>
                      <td data-label="Estoque">
                        <span className={`stock-num ${isLow ? "low" : "ok"}`}>
                          {p.quantidade_estoque}{" "}
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 400,
                              color: "var(--text-muted)",
                            }}
                          >
                            {p.unidade_medida}
                          </span>
                        </span>
                      </td>
                      <td data-label="Status">
                        {isLow ? (
                          <span className="badge badge-danger">
                            <AlertTriangle /> Baixo
                          </span>
                        ) : (
                          <span className="badge badge-success">
                            <CheckCircle /> Normal
                          </span>
                        )}
                      </td>
                      <td data-label="Ações">
                        <div className="cell-actions">
                          <button
                            className="btn btn-success-icon"
                            title="Entrada/Saída"
                            onClick={() => openModal("movement", p)}
                          >
                            <ArrowUpDown style={{ width: 13, height: 13 }} />
                          </button>
                          <button
                            className="btn btn-icon-sm"
                            title="Histórico"
                            onClick={() => openModal("history", p)}
                          >
                            <ClipboardList style={{ width: 13, height: 13 }} />
                          </button>
                          <button
                            className="btn btn-icon-sm"
                            title="Editar"
                            onClick={() => openModal("edit", p)}
                          >
                            <Pencil style={{ width: 13, height: 13 }} />
                          </button>
                          <button
                            className="btn btn-danger-icon"
                            title="Excluir"
                            onClick={() => openModal("delete", p)}
                          >
                            <Trash2 style={{ width: 13, height: 13 }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {(modal === "create" || modal === "edit") && (
        <ProductModal
          product={selected}
          onClose={closeModal}
          onSave={handleSave}
          toast={toast}
        />
      )}
      {modal === "movement" && selected && (
        <MovementModal
          product={selected}
          onClose={closeModal}
          onSave={handleSave}
          toast={toast}
        />
      )}
      {modal === "delete" && selected && (
        <DeleteModal
          product={selected}
          onClose={closeModal}
          onConfirm={handleSave}
          toast={toast}
        />
      )}
      {modal === "history" && selected && (
        <HistoryModal product={selected} onClose={closeModal} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// APP SHELL
// ─────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [lowCount, setLowCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, show: toast } = useToast();
  const { theme, toggle: toggleTheme } = useTheme();
  const { user, logged } = useAuthState();

  useEffect(() => {
    if (!logged) return;
    api("/alerts")
      .then((d) => setLowCount((d?.data || d || []).length))
      .catch(() => {});
  }, [page, logged]);

  const navigate = (p) => {
    setPage(p);
    setSidebarOpen(false);
  };

  const pages = {
    dashboard: "Dashboard",
    products: "Produtos",
    movements: "Movimentações",
  };

  // ── Tela de login ────────────────────────
  if (!logged)
    return (
      <>
        <LoginPage
          toast={toast}
          onForgot={() =>
            toast(
              "Entre em contato com o administrador para recuperar sua senha.",
              "info",
            )
          }
          onLogin={async (email, senha) => {
            try {
              const data = await apiLogin(email, senha);
              console.log(data);
              doLogin(data.token, data.user);

              toast("Login realizado com sucesso!");
              navigate("dashboard");
            } catch (err) {
              toast(err.message, "error");
              throw err;
            }
          }}
          onToggleTheme={toggleTheme}
          theme={theme}
        />
        <ToastArea toasts={toasts} />
      </>
    );

  return (
    <div className="app">
      <ToastArea toasts={toasts} />

      {sidebarOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 150,
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <Package />
          </div>
          <div className="logo-text">
            <span className="logo-name">StockPro</span>
            <span className="logo-sub">Inventory</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-section-label">Principal</span>
          <button
            className={`nav-item ${page === "dashboard" ? "active" : ""}`}
            onClick={() => navigate("dashboard")}
          >
            <LayoutDashboard /> Dashboard
          </button>
          <button
            className={`nav-item ${page === "products" ? "active" : ""}`}
            onClick={() => navigate("products")}
          >
            <Package /> Produtos{" "}
            {lowCount > 0 && <span className="nav-badge">{lowCount}</span>}
          </button>
          <button
            className={`nav-item ${page === "movements" ? "active" : ""}`}
            onClick={() => navigate("movements")}
          >
            <ArrowUpDown /> Movimentações
          </button>
          <span className="nav-section-label" style={{ marginTop: 12 }}>
            Relatórios
          </span>
          <button
            className="nav-item"
            onClick={() => window.open(`${API_BASE}/report/pdf`, "_blank")}
          >
            <FileText /> Exportar PDF
          </button>
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">{initials(user.name)}</div>
              <div className="sidebar-user-info">
                <span className="sidebar-user-name">{user.name}</span>
                <span className="sidebar-user-email">{user.email}</span>
              </div>
              <button
                className="sidebar-logout-btn"
                onClick={() => {
                  doLogout();
                  toast("Sessão encerrada", "error");
                }}
                title="Sair"
              >
                <LogOut style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="btn btn-ghost"
              style={{ display: "none", padding: "6px", width: 34, height: 34 }}
              id="menu-btn"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu style={{ width: 16, height: 16 }} />
            </button>
            <span className="page-title">{pages[page]}</span>
          </div>
          <div className="topbar-right">
            {lowCount > 0 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "var(--warning-bg)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  borderRadius: "var(--radius-sm)",
                  padding: "4px 10px",
                  color: "var(--warning)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              >
                <AlertTriangle style={{ width: 13, height: 13 }} />
                {lowCount} alerta{lowCount > 1 ? "s" : ""}
              </div>
            )}
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <div className="page-content">
          {page === "dashboard" && <DashboardPage onNavigate={navigate} />}
          {page === "products" && <ProductsPage toast={toast} />}
          {page === "movements" && <MovementsPage />}
        </div>
      </div>

      <style>{`@media (max-width: 768px) { #menu-btn { display: flex !important; } }`}</style>
    </div>
  );
}
