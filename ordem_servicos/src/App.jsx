import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const API_BASE      = "http://localhost:3000/ordemtech/";
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
async function request(path, options = {}) {
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

  if (res.status === 401) { doLogout(); return; }

  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error || "Erro desconhecido");
  return json.data;
}

const api = {
  get:    path       => request(path),
  post:   (path, b)  => request(path, { method: "POST",  body: b }),
  put:    (path, b)  => request(path, { method: "PUT",   body: b }),
  patch:  (path, b)  => request(path, { method: "PATCH", body: b }),
  delete: path       => request(path, { method: "DELETE" }),
};

// ─────────────────────────────────────────────
// TOAST (Notyf via CDN)
// ─────────────────────────────────────────────
function useToast() {
  const notyf = useRef(null);
  useEffect(() => {
    if (window.Notyf) {
      notyf.current = new window.Notyf({
        duration: 3000,
        position: { x: "right", y: "bottom" },
        ripple: false, dismissible: true,
        types: [
          { type: "success", background: "#2E7D32", icon: { className: "bx bx-check", tagName: "i" } },
          { type: "error",   background: "#E8192C", icon: { className: "bx bx-x",     tagName: "i" } },
        ],
      });
    }
  }, []);
  return { success: msg => notyf.current?.success(msg), error: msg => notyf.current?.error(msg) };
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function formatCurrency(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);
}
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function getInitials(name) {
  return (name || "?").split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
}

const STATUS_CONFIG = {
  em_andamento: { label: "Em andamento", badgeClass: "badge-andamento", btnClass: "status-btn-andamento", icon: "bx-time" },
  pronto:       { label: "Pronto",       badgeClass: "badge-pronto",    btnClass: "status-btn-pronto",    icon: "bx-check-circle" },
  cancelado:    { label: "Cancelado",    badgeClass: "badge-cancelado", btnClass: "status-btn-cancelado", icon: "bx-x-circle" },
};

// ─────────────────────────────────────────────
// COMPONENTES BASE
// ─────────────────────────────────────────────
function Spinner() { return <div className="loader-overlay"><div className="spinner" /></div>; }

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.em_andamento;
  return <span className={`badge ${cfg.badgeClass}`}><span className="badge-dot" />{cfg.label}</span>;
}

function StatusSelector({ value, onChange, disabled }) {
  return (
    <div className="status-buttons">
      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
        <button key={key} type="button" onClick={() => !disabled && onChange(key)} disabled={disabled}
          className={`status-btn ${cfg.btnClass} ${value === key ? "active" : ""}`}>
          <i className={`bx ${cfg.icon}`} style={{ marginRight: 4 }} />{cfg.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL BASE
// ─────────────────────────────────────────────
function Modal({ title, onClose, footer, children, size = "md" }) {
  useEffect(() => {
    const handler = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: size === "lg" ? 700 : 600 }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><i className="bx bx-x" style={{ fontSize: "1.2rem" }} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────
function LoginPage() {
  const [email,    setEmail]    = useState("");
  const [senha,    setSenha]    = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState("");
  const [theme,    setTheme]    = useState(() => localStorage.getItem("ordemtech-theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ordemtech-theme", theme);
  }, [theme]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !senha) { setErro("Preencha e-mail e senha"); return; }
    setLoading(true);
    try {
      const { accessToken, user } = await apiLogin(email.trim(), senha);
      const hasAccess = user.role === "SUPERADMIN" || user.permissions?.includes("ORDEMTECH");
      if (!hasAccess) { setErro("Você não tem acesso ao módulo OrdemTech"); return; }
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
          <span>Ordem<span style={{ color: "var(--red)" }}>Tech</span></span>
        </div>
        <p className="login-subtitle">Gestão de OS — Planware</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {erro && <div className="login-error"><i className="bx bx-error-circle"></i><span>{erro}</span></div>}

          <div className="login-field">
            <label>E-mail</label>
            <div className="login-input-wrap">
              <i className="bx bx-envelope login-input-icon"></i>
              <input type="email" className="login-input" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
                required autoFocus autoComplete="email" />
            </div>
          </div>

          <div className="login-field">
            <label>Senha</label>
            <div className="login-input-wrap">
              <i className="bx bx-lock-alt login-input-icon"></i>
              <input type={showPass ? "text" : "password"} className="login-input login-input--has-right"
                value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••"
                required autoComplete="current-password" />
              <button type="button" className="login-eye-btn" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                <i className={`bx ${showPass ? "bx-hide" : "bx-show"}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
            {loading ? <><i className="bx bx-loader-alt bx-spin" /> Entrando...</> : <><i className="bx bx-log-in" /> Entrar</>}
          </button>
        </form>

        <button className="login-theme-btn" onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
          <i className={`bx ${theme === "dark" ? "bx-sun" : "bx-moon"}`}></i>
          {theme === "dark" ? "Modo claro" : "Modo escuro"}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ORDEM MODAL
// ─────────────────────────────────────────────
function OrdemModal({ ordem, clientes, onClose, onSaved, toast }) {
  const isEdit = !!ordem?.id;
  const [form, setForm] = useState({
    cliente_id: ordem?.cliente_id || "", equipamento: ordem?.equipamento || "",
    problema: ordem?.problema || "", observacoes: ordem?.observacoes || "",
    valor: ordem?.valor ?? "", status: ordem?.status || "em_andamento",
  });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); setErrors(e => ({ ...e, [field]: undefined })); }

  function validate() {
    const errs = {};
    if (!form.cliente_id) errs.cliente_id = "Selecione um cliente";
    if (!form.equipamento.trim()) errs.equipamento = "Obrigatório";
    if (!form.problema.trim()) errs.problema = "Obrigatório";
    if (form.valor !== "" && isNaN(parseFloat(form.valor))) errs.valor = "Valor inválido";
    return errs;
  }

  async function handleSubmit() {
  const errs = validate();
  if (Object.keys(errs).length) { setErrors(errs); return; }
  setLoading(true);
  try {
    const body = {
      ...form,
      // FIX: cliente_id é UUID (string) — não converte para int
      cliente_id: String(form.cliente_id),
      valor: form.valor === "" ? 0 : parseFloat(form.valor),
    };
    const saved = isEdit
      ? await api.put(`/ordens/${ordem.id}`, body)
      : await api.post("/ordens", body);
    toast.success(isEdit ? "Ordem atualizada!" : `Ordem ${saved.numero} criada!`);
    onSaved(saved); onClose();
  } catch (err) { toast.error(err.message); }
  finally { setLoading(false); }
}

  const footer = (
    <>
      <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? <><i className="bx bx-loader-alt bx-spin" /> Salvando...</> : <><i className={`bx ${isEdit ? "bx-save" : "bx-plus"}`} />{isEdit ? "Salvar" : "Criar OS"}</>}
      </button>
    </>
  );

  return (
    <Modal title={isEdit ? `Editar OS ${ordem.numero}` : "Nova Ordem de Serviço"} onClose={onClose} footer={footer}>
      <div className="form-grid">
        <div className="form-group span-2">
          <label>Cliente *</label>
          <select className="form-control" value={form.cliente_id} onChange={e => set("cliente_id", e.target.value)} style={{ borderColor: errors.cliente_id ? "var(--red)" : undefined }}>
            <option value="">Selecione o cliente</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome} {c.telefone ? `(${c.telefone})` : ""}</option>)}
          </select>
          {errors.cliente_id && <span className="form-hint" style={{ color: "var(--red)" }}>{errors.cliente_id}</span>}
        </div>
        <div className="form-group span-2">
          <label>Equipamento *</label>
          <input className="form-control" placeholder="Ex: Notebook Dell Inspiron 15..." value={form.equipamento} onChange={e => set("equipamento", e.target.value)} style={{ borderColor: errors.equipamento ? "var(--red)" : undefined }} />
          {errors.equipamento && <span className="form-hint" style={{ color: "var(--red)" }}>{errors.equipamento}</span>}
        </div>
        <div className="form-group span-2">
          <label>Descrição do Problema *</label>
          <textarea className="form-control" placeholder="Descreva o problema..." value={form.problema} onChange={e => set("problema", e.target.value)} style={{ borderColor: errors.problema ? "var(--red)" : undefined }} />
          {errors.problema && <span className="form-hint" style={{ color: "var(--red)" }}>{errors.problema}</span>}
        </div>
        <div className="form-group span-2">
          <label>Observações Internas</label>
          <textarea className="form-control" placeholder="Notas internas, diagnóstico..." value={form.observacoes} onChange={e => set("observacoes", e.target.value)} rows={2} />
        </div>
        <div className="form-group">
          <label>Valor do Serviço (R$)</label>
          <input className="form-control" type="number" min="0" step="0.01" placeholder="0,00" value={form.valor} onChange={e => set("valor", e.target.value)} style={{ borderColor: errors.valor ? "var(--red)" : undefined }} />
          {errors.valor && <span className="form-hint" style={{ color: "var(--red)" }}>{errors.valor}</span>}
        </div>
        {isEdit && (
          <div className="form-group">
            <label>Status</label>
            <div style={{ paddingTop: 4 }}><StatusSelector value={form.status} onChange={s => set("status", s)} /></div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// ORDEM DETAIL MODAL
// ─────────────────────────────────────────────
function OrdemDetailModal({ ordem, onClose, onEdit, onStatusChange, onDelete, toast }) {
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(ordem.status);

  async function handleStatusChange(newStatus) {
    if (newStatus === currentStatus) return;
    setLoadingStatus(true);
    try {
      const updated = await api.patch(`/ordens/${ordem.id}/status`, { status: newStatus });
      setCurrentStatus(updated.status); onStatusChange(updated); toast.success("Status atualizado!");
    } catch (err) { toast.error(err.message); }
    finally { setLoadingStatus(false); }
  }

  const footer = (
    <>
      <button className="btn btn-danger btn-sm" onClick={() => onDelete(ordem)}><i className="bx bx-trash" /> Excluir</button>
      <div style={{ flex: 1 }} />
      <button className="btn btn-outline" onClick={onClose}>Fechar</button>
      <button className="btn btn-primary" onClick={() => { onClose(); onEdit(ordem); }}><i className="bx bx-edit" /> Editar</button>
    </>
  );

  return (
    <Modal title={`Ordem de Serviço — ${ordem.numero}`} onClose={onClose} footer={footer} size="lg">
      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 8 }}>Status</label>
        <StatusSelector value={currentStatus} onChange={handleStatusChange} disabled={loadingStatus} />
      </div>
      <div className="divider" />
      <div className="detail-grid">
        <div className="detail-item"><span className="detail-label">Cliente</span><span className="detail-value">{ordem.cliente_nome}</span></div>
        <div className="detail-item"><span className="detail-label">Telefone</span><span className="detail-value">{ordem.cliente_telefone || "—"}</span></div>
        <div className="detail-item" style={{ gridColumn: "span 2" }}><span className="detail-label">Equipamento</span><span className="detail-value">{ordem.equipamento}</span></div>
        <div className="detail-item" style={{ gridColumn: "span 2" }}><span className="detail-label">Problema Relatado</span><span className="detail-value" style={{ whiteSpace: "pre-wrap" }}>{ordem.problema}</span></div>
        {ordem.observacoes && <div className="detail-item" style={{ gridColumn: "span 2" }}><span className="detail-label">Observações Internas</span><span className="detail-value" style={{ whiteSpace: "pre-wrap", color: "var(--text-secondary)" }}>{ordem.observacoes}</span></div>}
        <div className="detail-item"><span className="detail-label">Valor</span><span className="detail-value large">{formatCurrency(ordem.valor)}</span></div>
        <div className="detail-item"><span className="detail-label">Data de Abertura</span><span className="detail-value">{formatDate(ordem.criado_em)}</span></div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// CLIENTE MODAL
// ─────────────────────────────────────────────
function ClienteModal({ cliente, onClose, onSaved, toast }) {
  const isEdit = !!cliente?.id;
  const [form, setForm]   = useState({ nome: cliente?.nome || "", telefone: cliente?.telefone || "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); setErrors(e => ({ ...e, [field]: undefined })); }

  async function handleSubmit() {
    if (!form.nome.trim()) { setErrors({ nome: "Nome é obrigatório" }); return; }
    setLoading(true);
    try {
      const saved = isEdit ? await api.put(`/clientes/${cliente.id}`, form) : await api.post("/clientes", form);
      toast.success(isEdit ? "Cliente atualizado!" : "Cliente cadastrado!"); onSaved(saved); onClose();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  const footer = (
    <>
      <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
        {loading ? <><i className="bx bx-loader-alt bx-spin" /> Salvando...</> : <><i className={`bx ${isEdit ? "bx-save" : "bx-user-plus"}`} />{isEdit ? "Salvar" : "Cadastrar"}</>}
      </button>
    </>
  );

  return (
    <Modal title={isEdit ? "Editar Cliente" : "Novo Cliente"} onClose={onClose} footer={footer}>
      <div className="form-grid full">
        <div className="form-group">
          <label>Nome *</label>
          <input className="form-control" placeholder="Nome completo" value={form.nome} onChange={e => set("nome", e.target.value)} style={{ borderColor: errors.nome ? "var(--red)" : undefined }} autoFocus />
          {errors.nome && <span className="form-hint" style={{ color: "var(--red)" }}>{errors.nome}</span>}
        </div>
        <div className="form-group">
          <label>Telefone</label>
          <input className="form-control" placeholder="(00) 00000-0000" value={form.telefone} onChange={e => set("telefone", e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}

function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <Modal title="Confirmar exclusão" onClose={onClose} footer={
      <>
        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className="btn btn-primary" style={{ background: "var(--red)" }} onClick={onConfirm}><i className="bx bx-trash" /> Excluir</button>
      </>
    }>
      <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{message}</p>
      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 8 }}>Esta ação não pode ser desfeita.</p>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────
function DashboardPage({ onNavigate }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try { const d = await api.get("/dashboard"); setData(d); }
    catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  const stats = data?.stats || {};
  const recentes = data?.recentes || [];

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-icon red"><i className="bx bx-list-ul" /></div><span className="stat-label">Total de OS</span><span className="stat-value">{stats.total || 0}</span></div>
        <div className="stat-card"><div className="stat-icon orange"><i className="bx bx-time" /></div><span className="stat-label">Em Andamento</span><span className="stat-value">{stats.em_andamento || 0}</span></div>
        <div className="stat-card"><div className="stat-icon green"><i className="bx bx-check-circle" /></div><span className="stat-label">Concluídas</span><span className="stat-value">{stats.prontos || 0}</span></div>
        <div className="stat-card"><div className="stat-icon red"><i className="bx bx-dollar" /></div><span className="stat-label">Faturamento (prontas)</span><span className="stat-value red" style={{ fontSize: "1.3rem" }}>{formatCurrency(stats.faturamento)}</span></div>
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title"><i className="bx bx-time" style={{ marginRight: 8, color: "var(--red)" }} />Em Andamento</span>
          <button className="btn btn-outline btn-sm" onClick={() => onNavigate("ordens")}>Ver todas</button>
        </div>
        <div className="table-wrapper">
          {recentes.length === 0
            ? <div className="empty-state"><i className="bx bx-check-shield" /><p>Nenhuma ordem em andamento.</p></div>
            : <table><thead><tr><th>Nº OS</th><th>Cliente</th><th>Equipamento</th><th>Data</th><th>Valor</th></tr></thead>
              <tbody>{recentes.map(o => (
                <tr key={o.id}>
                  <td className="td-numero">{o.numero}</td>
                  <td className="td-cliente">{o.cliente_nome}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{o.equipamento}</td>
                  <td style={{ color: "var(--text-muted)" }}>{formatDate(o.criado_em)}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(o.valor)}</td>
                </tr>
              ))}</tbody></table>}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// ORDENS PAGE
// ─────────────────────────────────────────────
function OrdensPage({ toast }) {
  const [ordens, setOrdens]         = useState([]);
  const [clientes, setClientes]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [modalNova, setModalNova]   = useState(false);
  const [modalEdit, setModalEdit]   = useState(null);
  const [modalDetail, setModalDetail] = useState(null);
  const [modalDelete, setModalDelete] = useState(null);

  const loadOrdens = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "todos") params.set("status", statusFilter);
      setOrdens(await api.get(`/ordens?${params}`));
    } catch (err) { toast.error("Erro ao carregar ordens"); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { api.get("/clientes").then(setClientes).catch(() => {}); }, []);
  useEffect(() => { const t = setTimeout(() => loadOrdens(), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { loadOrdens(); }, [statusFilter]);

  function handleSaved(saved) {
    setOrdens(prev => {
      const idx = prev.findIndex(o => o.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
  }

  function handleStatusChange(updated) {
    setOrdens(prev => prev.map(o => o.id === updated.id ? updated : o));
    if (modalDetail?.id === updated.id) setModalDetail(updated);
  }

  async function handleDelete() {
    if (!modalDelete) return;
    try { await api.delete(`/ordens/${modalDelete.id}`); toast.success(`OS ${modalDelete.numero} excluída`); setOrdens(prev => prev.filter(o => o.id !== modalDelete.id)); setModalDelete(null); setModalDetail(null); }
    catch (err) { toast.error(err.message); }
  }

  const FILTROS = [{ key: "todos", label: "Todos" }, { key: "em_andamento", label: "Em andamento" }, { key: "pronto", label: "Prontos" }, { key: "cancelado", label: "Cancelados" }];

  return (
    <>
      <div className="card">
        <div className="card-header" style={{ flexWrap: "wrap", gap: 12 }}>
          <div className="search-bar">
            <i className="bx bx-search" />
            <input placeholder="Buscar por cliente, equipamento, nº OS..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="filter-tabs">
            {FILTROS.map(f => <button key={f.key} className={`filter-tab ${statusFilter === f.key ? "active" : ""}`} onClick={() => setStatusFilter(f.key)}>{f.label}</button>)}
          </div>
          <button className="btn btn-primary" onClick={() => setModalNova(true)}><i className="bx bx-plus" /> Nova OS</button>
        </div>
        <div className="table-wrapper">
          {loading ? <Spinner /> : ordens.length === 0
            ? <div className="empty-state"><i className="bx bx-clipboard" /><p>Nenhuma ordem de serviço encontrada.</p><button className="btn btn-primary" onClick={() => setModalNova(true)}><i className="bx bx-plus" /> Criar primeira OS</button></div>
            : <table>
              <thead><tr><th>Nº OS</th><th>Cliente</th><th>Equipamento</th><th>Problema</th><th>Valor</th><th>Data</th><th>Status</th><th /></tr></thead>
              <tbody>{ordens.map(o => (
                <tr key={o.id} onClick={() => setModalDetail(o)} style={{ cursor: "pointer" }}>
                  <td className="td-numero">{o.numero}</td>
                  <td className="td-cliente">{o.cliente_nome}</td>
                  <td style={{ color: "var(--text-secondary)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.equipamento}</td>
                  <td style={{ color: "var(--text-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.problema}</td>
                  <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>{formatCurrency(o.valor)}</td>
                  <td style={{ color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(o.criado_em)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="td-actions">
                      <button className="btn btn-ghost btn-sm" title="Editar" onClick={() => setModalEdit(o)}><i className="bx bx-edit" /></button>
                      <button className="btn btn-ghost btn-sm" title="Excluir" style={{ color: "var(--red)" }} onClick={() => setModalDelete(o)}><i className="bx bx-trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>}
        </div>
      </div>
      {!loading && ordens.length > 0 && <p style={{ marginTop: 10, fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "right" }}>{ordens.length} ordem{ordens.length !== 1 ? "s" : ""} encontrada{ordens.length !== 1 ? "s" : ""}</p>}

      {modalNova    && <OrdemModal clientes={clientes} onClose={() => setModalNova(false)} onSaved={handleSaved} toast={toast} />}
      {modalEdit    && <OrdemModal ordem={modalEdit} clientes={clientes} onClose={() => setModalEdit(null)} onSaved={handleSaved} toast={toast} />}
      {modalDetail  && <OrdemDetailModal ordem={modalDetail} onClose={() => setModalDetail(null)} onEdit={o => setModalEdit(o)} onStatusChange={handleStatusChange} onDelete={o => setModalDelete(o)} toast={toast} />}
      {modalDelete  && <ConfirmModal message={`Deseja excluir a OS ${modalDelete.numero} do cliente "${modalDelete.cliente_nome}"?`} onConfirm={handleDelete} onClose={() => setModalDelete(null)} />}
    </>
  );
}

// ─────────────────────────────────────────────
// CLIENTES PAGE
// ─────────────────────────────────────────────
function ClientesPage({ toast }) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [modalNovo, setModalNovo] = useState(false);
  const [modalEdit, setModalEdit] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const params = new URLSearchParams(); if (search.trim()) params.set("q", search.trim()); setClientes(await api.get(`/clientes?${params}`)); }
    catch { toast.error("Erro ao carregar clientes"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { const t = setTimeout(() => load(), 350); return () => clearTimeout(t); }, [search]);
  useEffect(() => { load(); }, []);

  function handleSaved(saved) {
    setClientes(prev => {
      const idx = prev.findIndex(c => c.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [...prev, saved].sort((a, b) => a.nome.localeCompare(b.nome));
    });
  }

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div className="search-bar"><i className="bx bx-search" /><input placeholder="Buscar clientes..." value={search} onChange={e => setSearch(e.target.value)} /></div>
          <button className="btn btn-primary" onClick={() => setModalNovo(true)}><i className="bx bx-user-plus" /> Novo Cliente</button>
        </div>
        <div className="table-wrapper">
          {loading ? <Spinner /> : clientes.length === 0
            ? <div className="empty-state"><i className="bx bx-group" /><p>Nenhum cliente cadastrado.</p><button className="btn btn-primary" onClick={() => setModalNovo(true)}><i className="bx bx-user-plus" /> Cadastrar cliente</button></div>
            : <table>
              <thead><tr><th /><th>Nome</th><th>Telefone</th><th>Cadastrado em</th><th /></tr></thead>
              <tbody>{clientes.map(c => (
                <tr key={c.id} className="client-row">
                  <td><div className="avatar">{getInitials(c.nome)}</div></td>
                  <td><div className="td-cliente">{c.nome}</div></td>
                  <td style={{ color: "var(--text-secondary)" }}>{c.telefone || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                  <td style={{ color: "var(--text-muted)" }}>{formatDate(c.criado_em)}</td>
                  <td><div className="td-actions"><button className="btn btn-ghost btn-sm" onClick={() => setModalEdit(c)}><i className="bx bx-edit" /></button></div></td>
                </tr>
              ))}</tbody>
            </table>}
        </div>
      </div>
      {modalNovo && <ClienteModal onClose={() => setModalNovo(false)} onSaved={handleSaved} toast={toast} />}
      {modalEdit && <ClienteModal cliente={modalEdit} onClose={() => setModalEdit(null)} onSaved={handleSaved} toast={toast} />}
    </>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR + LAYOUT
// ─────────────────────────────────────────────
const PAGES = [
  { key: "dashboard", label: "Dashboard",          icon: "bx-home-alt" },
  { key: "ordens",    label: "Ordens de Serviço",  icon: "bx-clipboard" },
  { key: "clientes",  label: "Clientes",            icon: "bx-group" },
];

function Sidebar({ page, onNavigate, theme, onToggleTheme }) {
  const { user } = useAuthState();

  function handleLogout() { doLogout(); }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Ordem<span>Tech</span></h1>
        <p>Gestão de OS</p>
      </div>

      <nav className="sidebar-nav">
        {PAGES.map(p => (
          <button key={p.key} className={`nav-item ${page === p.key ? "active" : ""}`} onClick={() => onNavigate(p.key)}>
            <i className={`bx ${p.icon}`} />{p.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={onToggleTheme}>
          <i className={`bx ${theme === "dark" ? "bx-sun" : "bx-moon"}`} />
          {theme === "dark" ? "Modo claro" : "Modo escuro"}
        </button>

        {user && (
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{(user.name || user.email || "?").charAt(0).toUpperCase()}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name || user.email}</span>
              <span className="sidebar-user-role">{user.role}</span>
            </div>
            <button className="sidebar-logout-btn" onClick={handleLogout} title="Sair"><i className="bx bx-log-out" /></button>
          </div>
        )}
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const [page, setPage]   = useState("dashboard");
  const [theme, setTheme] = useState(() => localStorage.getItem("ordemtech-theme") || "light");
  const toast             = useToast();
  const { logged }        = useAuthState();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("ordemtech-theme", theme);
  }, [theme]);

  if (!logged) return <LoginPage />;

  return (
    <div className="app-layout">
      <Sidebar page={page} onNavigate={setPage} theme={theme} onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")} />
      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{{ dashboard: "Dashboard", ordens: "Ordens de Serviço", clientes: "Clientes" }[page]}</span>
          <div className="topbar-actions">
            {page === "ordens" && <button className="btn btn-primary btn-sm" onClick={() => {}}><i className="bx bx-plus" /> Nova OS</button>}
          </div>
        </div>
        <div className="page-body">
          {page === "dashboard" && <DashboardPage onNavigate={setPage} />}
          {page === "ordens"    && <OrdensPage toast={toast} />}
          {page === "clientes"  && <ClientesPage toast={toast} />}
        </div>
      </div>
    </div>
  );
}