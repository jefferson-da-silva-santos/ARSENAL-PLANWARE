import { useState, useEffect, useCallback, createContext, useContext } from "react";
import "./App.css";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const API_BASE      = "http://localhost:3000/kanban/";
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
// THEME CONTEXT
// ─────────────────────────────────────────────
const ThemeContext = createContext(null);
const useTheme = () => useContext(ThemeContext);

// ─────────────────────────────────────────────
// API COM JWT
// ─────────────────────────────────────────────
const apiClient = {
  async request(method, path, body) {
    const token = auth.getToken();
    const opts = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE}${path}`, opts);

    if (res.status === 401) { doLogout(); return; }

    const json = await res.json();
    if (!json.success) throw new Error(json.error || "Erro desconhecido");
    return json.data;
  },
  get:    path        => apiClient.request("GET",    path),
  post:   (path, b)  => apiClient.request("POST",   path, b),
  put:    (path, b)  => apiClient.request("PUT",    path, b),
  patch:  (path, b)  => apiClient.request("PATCH",  path, b),
  delete: path       => apiClient.request("DELETE", path),

  getTasks:      ()       => apiClient.get("/tasks"),
  createTask:    data     => apiClient.post("/tasks", data),
  updateTask:    (id, d)  => apiClient.put(`/tasks/${id}`, d),
  moveTask:      (id, d)  => apiClient.patch(`/tasks/${id}/move`, d),
  deleteTask:    id       => apiClient.delete(`/tasks/${id}`),
  getColumns:    ()       => apiClient.get("/columns"),
  createColumn:  data     => apiClient.post("/columns", data),
  updateColumn:  (id, d)  => apiClient.put(`/columns/${id}`, d),
  deleteColumn:  id       => apiClient.delete(`/columns/${id}`),
  getMembers:    ()       => apiClient.get("/members"),
  createMember:  data     => apiClient.post("/members", data),
  updateMember:  (id, d)  => apiClient.put(`/members/${id}`, d),
  deleteMember:  id       => apiClient.delete(`/members/${id}`),
  getStats:      ()       => apiClient.get("/stats"),
};

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
let toastQueue = [];
let toastSetState = null;

const toast = {
  show(message, type = "success") {
    const id = Date.now() + Math.random();
    toastQueue = [...toastQueue, { id, message, type }];
    if (toastSetState) toastSetState([...toastQueue]);
    setTimeout(() => {
      toastQueue = toastQueue.filter(t => t.id !== id);
      if (toastSetState) toastSetState([...toastQueue]);
    }, 3500);
  },
  success: msg => toast.show(msg, "success"),
  error:   msg => toast.show(msg, "error"),
  info:    msg => toast.show(msg, "info"),
};

function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => { toastSetState = setToasts; return () => { toastSetState = null; }; }, []);
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <i className={`bx ${t.type === "success" ? "bx-check-circle" : t.type === "error" ? "bx-x-circle" : "bx-info-circle"}`}></i>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = e => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><i className="bx bx-x"></i></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function ConfirmDialog({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal modal-sm">
        <div className="modal-body" style={{ textAlign: "center" }}>
          <i className="bx bx-error-circle" style={{ fontSize: 48, color: "var(--danger)", display: "block", marginBottom: 12 }}></i>
          <p style={{ marginBottom: 20 }}>{message}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
            <button className="btn btn-danger" onClick={onConfirm}>Confirmar</button>
          </div>
        </div>
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
  const [theme,    setTheme]    = useState(() => localStorage.getItem("kb_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("kb_theme", theme);
  }, [theme]);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    if (!email.trim() || !senha) { setErro("Preencha e-mail e senha"); return; }
    setLoading(true);
    try {
      const { accessToken, user } = await apiLogin(email.trim(), senha);
      const hasAccess = user.role === "SUPERADMIN" || user.permissions?.includes("KANBAN");
      if (!hasAccess) { setErro("Você não tem acesso ao módulo KanbanFlow"); return; }
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
          <i className="bx bx-layout"></i>
          <span>KanbanFlow</span>
        </div>
        <p className="login-subtitle">Gestão de Tarefas — Planware</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {erro && (
            <div className="login-error">
              <i className="bx bx-error-circle"></i>
              <span>{erro}</span>
            </div>
          )}

          <div className="login-field">
            <label>E-mail</label>
            <div className="login-input-wrap">
              <i className="bx bx-envelope login-input-icon"></i>
              <input
                type="email" className="login-input" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required autoFocus autoComplete="email"
              />
            </div>
          </div>

          <div className="login-field">
            <label>Senha</label>
            <div className="login-input-wrap">
              <i className="bx bx-lock-alt login-input-icon"></i>
              <input
                type={showPass ? "text" : "password"} className="login-input login-input--has-right"
                value={senha} onChange={e => setSenha(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
              />
              <button type="button" className="login-eye-btn" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                <i className={`bx ${showPass ? "bx-hide" : "bx-show"}`}></i>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary login-submit-btn" disabled={loading}>
            {loading
              ? <><div className="loader-ring" style={{ width: 16, height: 16, borderWidth: 2 }} /> Entrando...</>
              : <><i className="bx bx-log-in"></i> Entrar</>
            }
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
// PRIORITY BADGE / AVATAR (iguais ao original)
// ─────────────────────────────────────────────
const priorityMap = {
  low:    { label: "Baixa",  icon: "bx-chevron-down",  cls: "priority-low"    },
  medium: { label: "Média",  icon: "bx-minus",          cls: "priority-medium" },
  high:   { label: "Alta",   icon: "bx-chevron-up",     cls: "priority-high"   },
};

function PriorityBadge({ priority }) {
  const p = priorityMap[priority] || priorityMap.medium;
  return <span className={`priority-badge ${p.cls}`}><i className={`bx ${p.icon}`}></i> {p.label}</span>;
}

function Avatar({ name, color, size = 28 }) {
  const initials = name ? name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?";
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: color || "#888" }} title={name}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────
// TASK FORM
// ─────────────────────────────────────────────
function TaskForm({ initialData, columns, members, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    column_id: initialData?.column_id || columns[0]?.id || "",
    member_id: initialData?.member_id || "",
    priority: initialData?.priority || "medium",
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    try { await onSave({ ...form, member_id: form.member_id || null }); }
    finally { setSaving(false); }
  };

  return (
    <div className="task-form">
      <div className="form-group">
        <label>Título *</label>
        <input className="form-input" value={form.title} onChange={e => set("title", e.target.value)}
          placeholder="Nome da tarefa" autoFocus onKeyDown={e => e.key === "Enter" && handleSubmit()} />
      </div>
      <div className="form-group">
        <label>Descrição</label>
        <textarea className="form-input form-textarea" value={form.description}
          onChange={e => set("description", e.target.value)} placeholder="Detalhes opcionais..." rows={3} />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Coluna</label>
          <select className="form-input" value={form.column_id} onChange={e => set("column_id", Number(e.target.value))}>
            {columns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Prioridade</label>
          <select className="form-input" value={form.priority} onChange={e => set("priority", e.target.value)}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>
      <div className="form-group">
        <label>Responsável</label>
        <select className="form-input" value={form.member_id} onChange={e => set("member_id", Number(e.target.value) || "")}>
          <option value="">— Sem responsável —</option>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? <><i className="bx bx-loader-alt bx-spin"></i> Salvando...</> : <><i className="bx bx-check"></i> Salvar</>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TASK CARD
// ─────────────────────────────────────────────
function TaskCard({ task, columns, members, onUpdate, onDelete, onMove, isDragging, onDragStart, onDragEnd }) {
  const [editOpen, setEditOpen]     = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSave = async data => {
    try { await onUpdate(task.id, data); setEditOpen(false); toast.success("Tarefa atualizada!"); }
    catch (err) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    try { await onDelete(task.id); toast.success("Tarefa removida."); }
    catch (err) { toast.error(err.message); }
    setConfirmOpen(false);
  };

  return (
    <>
      <div className={`task-card ${isDragging ? "task-card-dragging" : ""}`}
        draggable onDragStart={e => onDragStart(e, task)} onDragEnd={onDragEnd}>
        <div className="task-card-header">
          <PriorityBadge priority={task.priority} />
          <div className="task-card-actions">
            <button className="icon-btn" title="Editar" onClick={() => setEditOpen(true)}><i className="bx bx-edit-alt"></i></button>
            <button className="icon-btn icon-btn-danger" title="Excluir" onClick={() => setConfirmOpen(true)}><i className="bx bx-trash"></i></button>
          </div>
        </div>
        <h4 className="task-card-title">{task.title}</h4>
        {task.description && <p className="task-card-desc">{task.description}</p>}
        <div className="task-card-footer">
          {task.member_name
            ? <div className="task-member"><Avatar name={task.member_name} color={task.member_color} size={24} /><span>{task.member_name}</span></div>
            : <span className="task-no-member">Sem responsável</span>}
          <span className="task-date">{new Date(task.updated_at).toLocaleDateString("pt-BR")}</span>
        </div>
        <div className="task-move-row">
          {columns.filter(c => c.id !== task.column_id).map(c => (
            <button key={c.id} className="move-btn" style={{ "--col-color": c.color }}
              onClick={() => onMove(task.id, c.id)} title={`Mover para ${c.title}`}>
              <i className="bx bx-right-arrow-circle"></i> {c.title}
            </button>
          ))}
        </div>
      </div>
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Tarefa">
        <TaskForm initialData={task} columns={columns} members={members} onSave={handleSave} onCancel={() => setEditOpen(false)} />
      </Modal>
      <ConfirmDialog open={confirmOpen} message={`Excluir a tarefa "${task.title}"?`} onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
    </>
  );
}

// ─────────────────────────────────────────────
// KANBAN COLUMN
// ─────────────────────────────────────────────
function KanbanColumn({ column, tasks, columns, members, onCreateTask, onUpdateTask, onDeleteTask, onMoveTask, onUpdateColumn, onDeleteColumn, dragOverCol, setDragOverCol, draggingTask, onDragStart, onDragEnd }) {
  const [editOpen, setEditOpen]     = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [addOpen, setAddOpen]       = useState(false);
  const [colTitle, setColTitle]     = useState(column.title);
  const [colColor, setColColor]     = useState(column.color);
  const isOver = dragOverCol === column.id;

  const handleDragOver = e => { e.preventDefault(); setDragOverCol(column.id); };
  const handleDrop = e => {
    e.preventDefault();
    if (draggingTask && draggingTask.column_id !== column.id) onMoveTask(draggingTask.id, column.id);
    setDragOverCol(null);
  };

  const handleSaveCol = async () => {
    try { await onUpdateColumn(column.id, { title: colTitle, color: colColor }); setEditOpen(false); toast.success("Coluna atualizada!"); }
    catch (err) { toast.error(err.message); }
  };

  const handleDeleteCol = async () => {
    try { await onDeleteColumn(column.id); toast.success("Coluna removida."); }
    catch (err) { toast.error(err.message); }
    setConfirmOpen(false);
  };

  const handleAddTask = async data => {
    try { await onCreateTask({ ...data, column_id: column.id }); setAddOpen(false); toast.success("Tarefa criada!"); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <div className={`kanban-column ${isOver ? "kanban-column-over" : ""}`}
      onDragOver={handleDragOver} onDragLeave={() => setDragOverCol(null)} onDrop={handleDrop}
      style={{ "--col-accent": column.color }}>
      <div className="column-header">
        <div className="column-header-left">
          <span className="column-dot" style={{ background: column.color }}></span>
          <h3 className="column-title">{column.title}</h3>
          <span className="column-count">{tasks.length}</span>
        </div>
        <div className="column-header-right">
          <button className="icon-btn" title="Editar coluna" onClick={() => setEditOpen(true)}><i className="bx bx-cog"></i></button>
          <button className="icon-btn icon-btn-danger" title="Excluir coluna" onClick={() => setConfirmOpen(true)}><i className="bx bx-trash"></i></button>
        </div>
      </div>
      <div className="column-tasks">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} columns={columns} members={members}
            onUpdate={onUpdateTask} onDelete={onDeleteTask}
            onMove={(taskId, colId) => onMoveTask(taskId, colId)}
            isDragging={draggingTask?.id === task.id}
            onDragStart={onDragStart} onDragEnd={onDragEnd} />
        ))}
        {isOver && draggingTask && draggingTask.column_id !== column.id && (
          <div className="drop-placeholder"><i className="bx bx-plus"></i> Soltar aqui</div>
        )}
      </div>
      <button className="add-task-btn" onClick={() => setAddOpen(true)}>
        <i className="bx bx-plus"></i> Adicionar tarefa
      </button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Coluna">
        <div className="task-form">
          <div className="form-group">
            <label>Nome da Coluna</label>
            <input className="form-input" value={colTitle} onChange={e => setColTitle(e.target.value)} autoFocus />
          </div>
          <div className="form-group">
            <label>Cor</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="color" value={colColor} onChange={e => setColColor(e.target.value)} style={{ width: 48, height: 36, border: "none", borderRadius: 8, cursor: "pointer" }} />
              <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{colColor}</span>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setEditOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSaveCol}>Salvar</button>
          </div>
        </div>
      </Modal>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={`Nova tarefa em "${column.title}"`}>
        <TaskForm initialData={{ column_id: column.id }} columns={columns} members={members} onSave={handleAddTask} onCancel={() => setAddOpen(false)} />
      </Modal>

      <ConfirmDialog open={confirmOpen} message={`Excluir a coluna "${column.title}" e todas as suas tarefas?`} onConfirm={handleDeleteCol} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
}

// ─────────────────────────────────────────────
// MEMBERS PANEL
// ─────────────────────────────────────────────
function MembersPanel({ members, onAdd, onDelete }) {
  const [open, setOpen]           = useState(false);
  const [name, setName]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const handleAdd = async () => {
    if (!name.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try { await onAdd({ name }); setName(""); toast.success("Membro adicionado!"); }
    catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try { await onDelete(confirmId); toast.success("Membro removido."); }
    catch (err) { toast.error(err.message); }
    setConfirmId(null);
  };

  return (
    <>
      <button className="btn btn-ghost header-btn" onClick={() => setOpen(true)}>
        <i className="bx bx-group"></i> Equipe
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Gerenciar Equipe">
        <div className="members-panel">
          <div className="members-add">
            <input className="form-input" placeholder="Nome do membro" value={name}
              onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()} />
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? <i className="bx bx-loader-alt bx-spin"></i> : <i className="bx bx-plus"></i>} Adicionar
            </button>
          </div>
          <div className="members-list">
            {members.length === 0 && <p className="empty-state">Nenhum membro cadastrado.</p>}
            {members.map(m => (
              <div key={m.id} className="member-item">
                <Avatar name={m.name} color={m.color} size={32} />
                <span className="member-name">{m.name}</span>
                <button className="icon-btn icon-btn-danger" onClick={() => setConfirmId(m.id)}><i className="bx bx-trash"></i></button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={!!confirmId} message="Remover este membro? Suas tarefas ficarão sem responsável." onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />
    </>
  );
}

// ─────────────────────────────────────────────
// STATS PANEL
// ─────────────────────────────────────────────
function StatsPanel({ stats }) {
  const [open, setOpen] = useState(false);
  if (!stats) return null;
  return (
    <>
      <button className="btn btn-ghost header-btn" onClick={() => setOpen(true)}>
        <i className="bx bx-bar-chart-alt-2"></i> Estatísticas
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Visão Geral">
        <div className="stats-panel">
          <div className="stats-total">
            <span className="stats-number">{stats.totalTasks}</span>
            <span className="stats-label">tarefas no total</span>
          </div>
          <div className="stats-section">
            <h4>Por Coluna</h4>
            {stats.byColumn.map(c => (
              <div key={c.title} className="stats-row"><span>{c.title}</span><span className="stats-count">{c.count}</span></div>
            ))}
          </div>
          <div className="stats-section">
            <h4>Por Prioridade</h4>
            {stats.byPriority.map(p => (
              <div key={p.priority} className="stats-row"><PriorityBadge priority={p.priority} /><span className="stats-count">{p.count}</span></div>
            ))}
          </div>
          {stats.byMember.length > 0 && (
            <div className="stats-section">
              <h4>Por Responsável</h4>
              {stats.byMember.map(m => (
                <div key={m.name} className="stats-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Avatar name={m.name} color={m.color} size={22} />
                    <span>{m.name}</span>
                  </div>
                  <span className="stats-count">{m.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────
// ADD COLUMN
// ─────────────────────────────────────────────
function AddColumnButton({ onCreate }) {
  const [open, setOpen]     = useState(false);
  const [title, setTitle]   = useState("");
  const [color, setColor]   = useState("#4A90D9");
  const [saving, setSaving] = useState(false);

  const handle = async () => {
    if (!title.trim()) { toast.error("Nome é obrigatório"); return; }
    setSaving(true);
    try { await onCreate({ title, color }); setTitle(""); setColor("#4A90D9"); setOpen(false); toast.success("Coluna criada!"); }
    catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  return (
    <>
      <button className="add-column-btn" onClick={() => setOpen(true)}>
        <i className="bx bx-plus"></i><span>Nova Coluna</span>
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Nova Coluna">
        <div className="task-form">
          <div className="form-group">
            <label>Nome</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
          <div className="form-group">
            <label>Cor</label>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: 48, height: 36, border: "none", borderRadius: 8, cursor: "pointer" }} />
              <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>{color}</span>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn btn-primary" onClick={handle} disabled={saving}>
              {saving ? <i className="bx bx-loader-alt bx-spin"></i> : <><i className="bx bx-plus"></i> Criar</>}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────
// FILTER BAR
// ─────────────────────────────────────────────
function FilterBar({ members, filter, setFilter }) {
  return (
    <div className="filter-bar">
      <div className="search-box">
        <i className="bx bx-search"></i>
        <input className="search-input" placeholder="Buscar tarefa..."
          value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
        {filter.search && (
          <button className="search-clear" onClick={() => setFilter(f => ({ ...f, search: "" }))}>
            <i className="bx bx-x"></i>
          </button>
        )}
      </div>
      <select className="form-input filter-select" value={filter.member} onChange={e => setFilter(f => ({ ...f, member: e.target.value }))}>
        <option value="">Todos os responsáveis</option>
        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <select className="form-input filter-select" value={filter.priority} onChange={e => setFilter(f => ({ ...f, priority: e.target.value }))}>
        <option value="">Todas as prioridades</option>
        <option value="high">Alta</option>
        <option value="medium">Média</option>
        <option value="low">Baixa</option>
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────
function KanbanApp() {
  const [theme, setTheme]           = useState(() => localStorage.getItem("kb_theme") || "dark");
  const [columns, setColumns]       = useState([]);
  const [tasks, setTasks]           = useState([]);
  const [members, setMembers]       = useState([]);
  const [stats, setStats]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [draggingTask, setDraggingTask] = useState(null);
  const [dragOverCol, setDragOverCol]   = useState(null);
  const [filter, setFilter]             = useState({ search: "", member: "", priority: "" });
  const { user }                        = useAuthState();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("kb_theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const loadAll = useCallback(async () => {
    try {
      const [cols, tks, mbs, st] = await Promise.all([
        apiClient.getColumns(), apiClient.getTasks(),
        apiClient.getMembers(), apiClient.getStats(),
      ]);
      setColumns(cols); setTasks(tks); setMembers(mbs); setStats(st);
    } catch {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleCreateTask  = async data => { const t = await apiClient.createTask(data); setTasks(p => [...p, t]); const s = await apiClient.getStats(); setStats(s); };
  const handleUpdateTask  = async (id, data) => { const t = await apiClient.updateTask(id, data); setTasks(p => p.map(x => x.id === id ? t : x)); const s = await apiClient.getStats(); setStats(s); };
  const handleDeleteTask  = async id => { await apiClient.deleteTask(id); setTasks(p => p.filter(x => x.id !== id)); const s = await apiClient.getStats(); setStats(s); };
  const handleMoveTask    = async (id, colId) => { const t = await apiClient.moveTask(id, { column_id: colId }); setTasks(p => p.map(x => x.id === id ? t : x)); toast.info("Tarefa movida!"); const s = await apiClient.getStats(); setStats(s); };
  const handleCreateColumn = async data => { const c = await apiClient.createColumn(data); setColumns(p => [...p, c]); };
  const handleUpdateColumn = async (id, data) => { const c = await apiClient.updateColumn(id, data); setColumns(p => p.map(x => x.id === id ? c : x)); };
  const handleDeleteColumn = async id => { await apiClient.deleteColumn(id); setColumns(p => p.filter(x => x.id !== id)); setTasks(p => p.filter(x => x.column_id !== id)); const s = await apiClient.getStats(); setStats(s); };
  const handleAddMember    = async data => { const m = await apiClient.createMember(data); setMembers(ms => [...ms, m]); };
  const handleDeleteMember = async id => { await apiClient.deleteMember(id); setMembers(ms => ms.filter(m => m.id !== id)); setTasks(p => p.map(x => x.member_id === id ? { ...x, member_id: null, member_name: null, member_color: null } : x)); };

  const handleDragStart = (e, task) => { setDraggingTask(task); e.dataTransfer.effectAllowed = "move"; };
  const handleDragEnd   = () => { setDraggingTask(null); setDragOverCol(null); };

  const filteredTasks = tasks.filter(t => {
    if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false;
    if (filter.member && String(t.member_id) !== String(filter.member)) return false;
    if (filter.priority && t.priority !== filter.priority) return false;
    return true;
  });

  if (loading) return (
    <div className="app loading-screen">
      <div className="loader"><div className="loader-ring"></div><span>Carregando KanbanFlow...</span></div>
    </div>
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="app">
        <header className="app-header">
          <div className="header-brand">
            <i className="bx bx-layout"></i>
            <span className="brand-name">KanbanFlow</span>
            {stats && <span className="brand-count">{stats.totalTasks} tarefas</span>}
          </div>
          <div className="header-actions">
            <StatsPanel stats={stats} />
            <MembersPanel members={members} onAdd={handleAddMember} onDelete={handleDeleteMember} />
            <button className="btn btn-ghost header-btn theme-toggle" onClick={toggleTheme} title="Alternar tema">
              <i className={`bx ${theme === "dark" ? "bx-sun" : "bx-moon"}`}></i>
            </button>
            {/* User + logout */}
            {user && (
              <div className="header-user">
                <Avatar name={user.name || user.email} color="#4A90D9" size={28} />
                <span className="header-user-name">{user.name || user.email}</span>
                <button className="btn btn-ghost header-btn" onClick={() => { doLogout(); toast.info("Sessão encerrada"); }} title="Sair">
                  <i className="bx bx-log-out"></i>
                </button>
              </div>
            )}
          </div>
        </header>

        <FilterBar members={members} filter={filter} setFilter={setFilter} />

        <main className="kanban-board">
          {columns.map(col => (
            <KanbanColumn key={col.id} column={col}
              tasks={filteredTasks.filter(t => t.column_id === col.id)}
              columns={columns} members={members}
              onCreateTask={handleCreateTask} onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask} onMoveTask={handleMoveTask}
              onUpdateColumn={handleUpdateColumn} onDeleteColumn={handleDeleteColumn}
              dragOverCol={dragOverCol} setDragOverCol={setDragOverCol}
              draggingTask={draggingTask} onDragStart={handleDragStart} onDragEnd={handleDragEnd} />
          ))}
          <AddColumnButton onCreate={handleCreateColumn} />
        </main>

        <ToastContainer />
      </div>
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────
export default function App() {
  const { logged } = useAuthState();

  if (!logged) return (
    <>
      <LoginPage />
      <ToastContainer />
    </>
  );

  return <KanbanApp />;
}