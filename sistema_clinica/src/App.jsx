import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import "./App.css";

// ─────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────
const API          = "http://localhost:3000/clinica/api";
const AUTH_BASE    = "http://localhost:3000/auth";
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
  return json.data; // { accessToken, user }
}

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────
const AppContext = createContext(null);
const useApp = () => useContext(AppContext);

// ─────────────────────────────────────────────
// API HELPER
// ─────────────────────────────────────────────
// O módulo Clinica do PlanwareServer usa JWT (req.user injetado pelo middleware auth.js)
// Os headers x-usuario-* são mantidos por compatibilidade futura mas o auth real é via Bearer
function useApi() {
  const { usuario } = useApp();

  const req = useCallback(async (method, path, body = null, isForm = false) => {
    const token = auth.getToken();
    const headers = {};

    // JWT para o middleware do PlanwareServer
    if (token) headers["Authorization"] = `Bearer ${token}`;

    // Headers de compatibilidade com o módulo clinica
    if (usuario) {
      headers["x-usuario-id"]     = String(usuario.id);
      headers["x-usuario-nome"]   = usuario.nome || usuario.name || "Sistema";
      headers["x-usuario-perfil"] = usuario.perfil || usuario.role || "admin";
    }

    if (!isForm) headers["Content-Type"] = "application/json";

    const opts = { method, headers };
    if (body) opts.body = isForm ? body : JSON.stringify(body);

    const r = await fetch(`${API}${path}`, opts);

    // Token expirado → desloga
    if (r.status === 401) { doLogout(); return; }

    const data = await r.json();
    if (!data.sucesso) throw new Error(data.mensagem || "Erro desconhecido");
    return data.dados;
  }, [usuario]);

  return {
    get:    (p)       => req("GET",    p),
    post:   (p, b)    => req("POST",   p, b),
    put:    (p, b)    => req("PUT",    p, b),
    del:    (p)       => req("DELETE", p),
    upload: (p, f)    => req("POST",   p, f, true),
  };
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)}>
          <i className={`bx ${t.type === "success" ? "bx-check-circle" : t.type === "error" ? "bx-x-circle" : "bx-info-circle"}`} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

function useToast() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), []);
  return { toasts, toast: add, removeToast: remove };
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────
function Modal({ title, onClose, children, size = "md" }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal modal-${size}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}><i className="bx bx-x" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// CONFIRM
// ─────────────────────────────────────────────
function Confirm({ msg, onConfirm, onCancel }) {
  return (
    <Modal title="Confirmar ação" onClose={onCancel} size="sm">
      <p style={{ marginBottom: "1.5rem", color: "var(--text-secondary)" }}>{msg}</p>
      <div className="flex gap-sm justify-end">
        <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button className="btn btn-danger" onClick={onConfirm}>Confirmar</button>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// BADGE STATUS
// ─────────────────────────────────────────────
const STATUS_MAP = {
  agendado:       { label: "Agendado",       cls: "badge-info" },
  confirmado:     { label: "Confirmado",     cls: "badge-primary" },
  em_atendimento: { label: "Em Atendimento", cls: "badge-warning" },
  finalizado:     { label: "Finalizado",     cls: "badge-success" },
  cancelado:      { label: "Cancelado",      cls: "badge-danger" },
  faltou:         { label: "Faltou",         cls: "badge-muted" },
};
function Badge({ status }) {
  const s = STATUS_MAP[status] || { label: status, cls: "badge-muted" };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

// ─────────────────────────────────────────────
// FORMATTERS
// ─────────────────────────────────────────────
const fmtCPF = (v = "") => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};
const fmtTel = (v = "") => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length > 10) return d.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  return d.replace(/(\d{2})(\d{4,5})(\d{4})/, "($1) $2-$3");
};
const fmtDate = s => {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString("pt-BR");
};
const fmtDateTime = s => {
  if (!s) return "—";
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
};
const calcIdade = nasc => {
  if (!nasc) return null;
  const hoje = new Date();
  const n = new Date(nasc);
  let age = hoje.getFullYear() - n.getFullYear();
  const m = hoje.getMonth() - n.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) age--;
  return age;
};

// ─────────────────────────────────────────────
// INPUT CPF / TEL
// ─────────────────────────────────────────────
function InputCPF({ value, onChange, ...props }) {
  return <input {...props} value={fmtCPF(value)} onChange={e => onChange(e.target.value.replace(/\D/g, ""))} maxLength={14} />;
}
function InputTel({ value, onChange, ...props }) {
  return <input {...props} value={fmtTel(value)} onChange={e => onChange(e.target.value.replace(/\D/g, ""))} maxLength={15} />;
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function Login() {
  const [email, setEmail]       = useState("");
  const [senha, setSenha]       = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [erro, setErro]         = useState("");
  const { logged }              = useAuthState();

  // Já logado → o App vai renderizar o Layout
  if (logged) return null;

  const handleLogin = async e => {
    e.preventDefault();
    setErro("");
    setLoading(true);
    try {
      const { accessToken, user } = await apiLogin(email.trim(), senha);

      // Verifica permissão CLINICA
      const hasAccess = user.role === "SUPERADMIN" || user.permissions?.includes("CLINICA");
      if (!hasAccess) { setErro("Você não tem acesso ao módulo Clínica"); return; }

      // Adapta user para o formato que o AppContext espera (mantém compatibilidade)
      const usuarioAdaptado = {
        id:     user.id,
        nome:   user.name,
        email:  user.email,
        perfil: user.role === "SUPERADMIN" ? "admin" : "profissional",
        // Campos originais também
        name:        user.name,
        role:        user.role,
        permissions: user.permissions,
      };

      doLogin(accessToken, usuarioAdaptado);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg">
        <div className="login-blob login-blob-1" />
        <div className="login-blob login-blob-2" />
      </div>
      <div className="login-card">
        <div className="login-logo">
          <i className="bx bx-plus-medical" />
          <span>ClinicaDesk</span>
        </div>
        <p className="login-subtitle">Sistema de Gestão Clínica — Planware</p>

        <form onSubmit={handleLogin} className="login-form">
          {erro && (
            <div className="alert alert-danger">
              <i className="bx bx-error-circle" />{erro}
            </div>
          )}

          <div className="field">
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

          <div className="field">
            <label>Senha</label>
            <div className="login-input-wrap">
              <i className="bx bx-lock-alt login-input-icon" />
              <input
                type={showPass ? "text" : "password"}
                className="login-input login-input--has-right"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                required autoComplete="current-password"
              />
              <button type="button" className="login-eye-btn" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                <i className={`bx ${showPass ? "bx-hide" : "bx-show"}`} />
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" /> : <><i className="bx bx-log-in" />Entrar</>}
          </button>
        </form>

        <p className="login-hint">Use suas credenciais Planware</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard() {
  const api = useApi();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get("/dashboard").then(setData).finally(() => setLoading(false)); }, []);

  if (loading) return <div className="page-loader"><span className="spinner lg" /></div>;
  if (!data) return null;

  const statusHoje = data.agend_status || [];
  const getStatus = s => statusHoje.find(x => x.status === s)?.n || 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1><i className="bx bxs-dashboard" />Dashboard</h1>
        <span className="text-muted">{new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon"><i className="bx bxs-user-detail" /></div>
          <div className="stat-info"><span className="stat-num">{data.total_pacientes}</span><span className="stat-label">Pacientes cadastrados</span></div>
        </div>
        <div className="stat-card stat-teal">
          <div className="stat-icon"><i className="bx bxs-calendar-check" /></div>
          <div className="stat-info"><span className="stat-num">{data.agend_hoje}</span><span className="stat-label">Agendamentos hoje</span></div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon"><i className="bx bxs-clinic" /></div>
          <div className="stat-info"><span className="stat-num">{data.atend_hoje}</span><span className="stat-label">Atendimentos hoje</span></div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon"><i className="bx bxs-bell" /></div>
          <div className="stat-info"><span className="stat-num">{data.alertas_pendentes}</span><span className="stat-label">Alertas pendentes</span></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header"><h3><i className="bx bxs-pie-chart-alt-2" />Status de Hoje</h3></div>
          <div className="status-breakdown">
            {[
              { s: "agendado",       icon: "bx-time",        label: "Agendados" },
              { s: "confirmado",     icon: "bx-check",       label: "Confirmados" },
              { s: "em_atendimento", icon: "bx-loader-alt",  label: "Em Atendimento" },
              { s: "finalizado",     icon: "bx-check-double", label: "Finalizados" },
              { s: "cancelado",      icon: "bx-x",           label: "Cancelados" },
            ].map(({ s, icon, label }) => (
              <div key={s} className="status-item">
                <i className={`bx ${icon}`} />
                <span className="status-label">{label}</span>
                <span className="status-count">{getStatus(s)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3><i className="bx bxs-calendar" />Próximos Hoje</h3></div>
          {data.proximos_agendamentos.length === 0 ? (
            <div className="empty-state sm"><i className="bx bx-calendar-x" /><span>Nenhum agendamento</span></div>
          ) : (
            <div className="agenda-list">
              {data.proximos_agendamentos.map(ag => (
                <div key={ag.id} className="agenda-item">
                  <div className="agenda-time">{ag.data_hora?.slice(11, 16)}</div>
                  <div className="agenda-info">
                    <span className="agenda-paciente">{ag.paciente_nome}</span>
                    <span className="agenda-tipo">{ag.tipo}</span>
                  </div>
                  <Badge status={ag.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// PACIENTES
// ─────────────────────────────────────────────
function Pacientes() {
  const api = useApi();
  const { toast } = useApp();
  const [pacientes, setPacientes]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [pagina, setPagina]         = useState(1);
  const [busca, setBusca]           = useState("");
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [confirm, setConfirm]       = useState(null);
  const [detalhe, setDetalhe]       = useState(null);
  const buscaRef = useRef();
  const LIMITE = 15;

  const carregar = useCallback(async (pg = 1, q = busca) => {
    setLoading(true);
    try {
      const d = await api.get(`/pacientes?pagina=${pg}&limite=${LIMITE}${q ? `&q=${encodeURIComponent(q)}` : ""}`);
      setPacientes(d.pacientes);
      setTotal(d.total);
      setPagina(pg);
    } finally { setLoading(false); }
  }, [busca]);

  useEffect(() => { carregar(1, ""); }, []);

  const handleBusca = e => {
    const v = e.target.value;
    setBusca(v);
    clearTimeout(buscaRef.current);
    buscaRef.current = setTimeout(() => carregar(1, v), 400);
  };

  const handleSalvar = async dados => {
    try {
      if (dados.id) { await api.put(`/pacientes/${dados.id}`, dados); toast("Paciente atualizado com sucesso"); }
      else { await api.post("/pacientes", dados); toast("Paciente cadastrado com sucesso"); }
      setModal(null);
      carregar(pagina);
    } catch (e) { toast(e.message, "error"); }
  };

  const handleExcluir = async id => {
    try { await api.del(`/pacientes/${id}`); toast("Paciente removido"); setConfirm(null); carregar(pagina); }
    catch (e) { toast(e.message, "error"); }
  };

  const abrirDetalhe = async pac => {
    try {
      const d    = await api.get(`/pacientes/${pac.id}`);
      const atend = await api.get(`/atendimentos?paciente_id=${pac.id}`);
      setDetalhe({ paciente: d, atendimentos: Array.isArray(atend) ? atend : [] });
    } catch (e) { toast(e.message, "error"); }
  };

  const totalPaginas = Math.ceil(total / LIMITE);

  return (
    <div className="page">
      <div className="page-header">
        <h1><i className="bx bxs-user-detail" />Pacientes</h1>
        <button className="btn btn-primary" onClick={() => setModal({})}><i className="bx bx-plus" />Novo Paciente</button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <i className="bx bx-search" />
          <input placeholder="Buscar por nome, CPF ou telefone..." value={busca} onChange={handleBusca} />
        </div>
        <span className="text-muted">{total} paciente{total !== 1 ? "s" : ""}</span>
      </div>

      {loading ? <div className="page-loader"><span className="spinner" /></div> : (
        <>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr><th>Nome</th><th>CPF</th><th>Telefone</th><th>Nascimento</th><th>Convênio</th><th>Atendimentos</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {pacientes.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><i className="bx bx-search-alt" /><span>Nenhum paciente encontrado</span></div></td></tr>
                ) : pacientes.map(p => (
                  <tr key={p.id}>
                    <td><button className="link-btn" onClick={() => abrirDetalhe(p)}>{p.nome}</button></td>
                    <td className="mono">{fmtCPF(p.cpf)}</td>
                    <td>{fmtTel(p.telefone)}</td>
                    <td>{fmtDate(p.data_nascimento)}{p.data_nascimento && <span className="text-muted"> ({calcIdade(p.data_nascimento)}a)</span>}</td>
                    <td>{p.convenio || "—"}</td>
                    <td><span className="badge badge-primary">{p.total_atendimentos || 0}</span></td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn" title="Editar" onClick={() => setModal(p)}><i className="bx bx-edit" /></button>
                        <button className="icon-btn danger" title="Remover" onClick={() => setConfirm(p.id)}><i className="bx bx-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPaginas > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost btn-sm" disabled={pagina === 1} onClick={() => carregar(pagina - 1)}><i className="bx bx-chevron-left" /></button>
              <span>Página {pagina} de {totalPaginas}</span>
              <button className="btn btn-ghost btn-sm" disabled={pagina === totalPaginas} onClick={() => carregar(pagina + 1)}><i className="bx bx-chevron-right" /></button>
            </div>
          )}
        </>
      )}

      {modal !== null && (
        <Modal title={modal.id ? "Editar Paciente" : "Novo Paciente"} onClose={() => setModal(null)} size="lg">
          <FormPaciente inicial={modal} onSalvar={handleSalvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
      {confirm && <Confirm msg="Remover este paciente?" onConfirm={() => handleExcluir(confirm)} onCancel={() => setConfirm(null)} />}
      {detalhe && (
        <Modal title={`Prontuário — ${detalhe.paciente.nome}`} onClose={() => setDetalhe(null)} size="xl">
          <DetalhePaciente dados={detalhe} onFechar={() => setDetalhe(null)} />
        </Modal>
      )}
    </div>
  );
}

function FormPaciente({ inicial, onSalvar, onCancelar }) {
  const [f, setF] = useState({
    nome: "", cpf: "", telefone: "", email: "", data_nascimento: "",
    sexo: "", endereco: "", convenio: "", observacoes: "", ...inicial
  });
  const set = k => e => setF(p => ({ ...p, [k]: typeof e === "string" ? e : e.target.value }));
  return (
    <form className="form" onSubmit={e => { e.preventDefault(); onSalvar(f); }}>
      <div className="form-grid-2">
        <div className="field span-2"><label>Nome completo *</label><input value={f.nome} onChange={set("nome")} required placeholder="Nome do paciente" /></div>
        <div className="field"><label>CPF *</label><InputCPF value={f.cpf} onChange={v => setF(p => ({ ...p, cpf: v }))} required placeholder="000.000.000-00" /></div>
        <div className="field"><label>Telefone</label><InputTel value={f.telefone} onChange={v => setF(p => ({ ...p, telefone: v }))} placeholder="(00) 00000-0000" /></div>
        <div className="field"><label>E-mail</label><input type="email" value={f.email} onChange={set("email")} placeholder="email@exemplo.com" /></div>
        <div className="field"><label>Data de nascimento</label><input type="date" value={f.data_nascimento} onChange={set("data_nascimento")} /></div>
        <div className="field"><label>Sexo</label><select value={f.sexo} onChange={set("sexo")}><option value="">Selecionar</option><option value="M">Masculino</option><option value="F">Feminino</option><option value="O">Outro</option></select></div>
        <div className="field"><label>Convênio</label><input value={f.convenio} onChange={set("convenio")} placeholder="Ex: Unimed, SUS..." /></div>
        <div className="field span-2"><label>Endereço</label><input value={f.endereco} onChange={set("endereco")} placeholder="Rua, número, bairro, cidade" /></div>
        <div className="field span-2"><label>Observações</label><textarea value={f.observacoes} onChange={set("observacoes")} rows={3} placeholder="Alergias, informações relevantes..." /></div>
      </div>
      <div className="flex gap-sm justify-end mt-lg">
        <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primary"><i className="bx bx-save" />Salvar</button>
      </div>
    </form>
  );
}

function DetalhePaciente({ dados }) {
  const { paciente: p, atendimentos } = dados;
  return (
    <div className="detalhe-paciente">
      <div className="paciente-info-grid">
        <div className="info-card">
          <div className="info-header"><i className="bx bxs-user" /><strong>{p.nome}</strong></div>
          <div className="info-row"><span>CPF</span><span className="mono">{fmtCPF(p.cpf)}</span></div>
          <div className="info-row"><span>Telefone</span><span>{fmtTel(p.telefone) || "—"}</span></div>
          <div className="info-row"><span>Nascimento</span><span>{fmtDate(p.data_nascimento)}{p.data_nascimento && ` (${calcIdade(p.data_nascimento)} anos)`}</span></div>
          <div className="info-row"><span>Convênio</span><span>{p.convenio || "—"}</span></div>
          {p.observacoes && <div className="info-obs"><i className="bx bx-note" />{p.observacoes}</div>}
        </div>
      </div>
      <div className="historico-header"><h4><i className="bx bx-history" />Histórico de Atendimentos ({atendimentos.length})</h4></div>
      <div className="historico-timeline">
        {atendimentos.length === 0 ? (
          <div className="empty-state sm"><i className="bx bx-clipboard" /><span>Nenhum atendimento registrado</span></div>
        ) : atendimentos.map(at => (
          <div key={at.id} className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <div className="timeline-header">
                <span className="timeline-data">{fmtDateTime(at.data_hora)}</span>
                <Badge status={at.status} />
                <span className="timeline-tipo">{at.tipo}</span>
              </div>
              <div className="timeline-prof"><i className="bx bx-user-check" />{at.profissional_nome}</div>
              <div className="timeline-motivo"><strong>Motivo:</strong> {at.motivo}</div>
              {at.diagnostico && <div className="timeline-field"><strong>Diagnóstico:</strong> {at.diagnostico}</div>}
              {at.conduta && <div className="timeline-field"><strong>Conduta:</strong> {at.conduta}</div>}
              {at.retorno_em && <div className="timeline-retorno"><i className="bx bx-calendar-event" />Retorno: {fmtDate(at.retorno_em)}</div>}
              {at.total_anexos > 0 && <div className="timeline-anexos"><i className="bx bx-paperclip" />{at.total_anexos} anexo(s)</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AGENDA
// ─────────────────────────────────────────────
function Agenda() {
  const api = useApi();
  const { toast, usuario } = useApp();
  const [agendamentos, setAgendamentos] = useState([]);
  const [data, setData]                 = useState(new Date().toISOString().slice(0, 10));
  const [modal, setModal]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [filtroProf, setFiltroProf]     = useState("");
  const [confirm, setConfirm]           = useState(null);

  // Para o módulo Clinica do PlanwareServer os "usuários" são os Users do tenant
  // Usamos uma lista fixa de profissionais vinda do próprio usuário logado
  const profissionais = [{ id: usuario?.id, nome: usuario?.nome || usuario?.name || "Eu" }];

  const carregar = useCallback(async (d, prof) => {
    setLoading(true);
    try {
      const params = [`data=${d}`, prof ? `profissional_id=${prof}` : ""].filter(Boolean).join("&");
      const rows   = await api.get(`/agendamentos?${params}`);
      setAgendamentos(Array.isArray(rows) ? rows : []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(data, filtroProf); }, []);

  const handleSalvar = async dados => {
    try {
      if (dados.id) { await api.put(`/agendamentos/${dados.id}`, dados); toast("Agendamento atualizado"); }
      else { await api.post("/agendamentos", dados); toast("Agendamento criado com sucesso"); }
      setModal(null);
      carregar(data, filtroProf);
    } catch (e) { toast(e.message, "error"); }
  };

  const handleStatus = async (id, status) => {
    try { await api.put(`/agendamentos/${id}`, { status }); toast("Status atualizado"); carregar(data, filtroProf); }
    catch (e) { toast(e.message, "error"); }
  };

  const handleCancelar = async id => {
    try { await api.del(`/agendamentos/${id}`); toast("Agendamento cancelado"); setConfirm(null); carregar(data, filtroProf); }
    catch (e) { toast(e.message, "error"); }
  };

  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + i + 1);
    return d.toISOString().slice(0, 10);
  });

  const navData = dias => {
    const d = new Date(data);
    d.setDate(d.getDate() + dias);
    const nova = d.toISOString().slice(0, 10);
    setData(nova);
    carregar(nova, filtroProf);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1><i className="bx bxs-calendar" />Agenda</h1>
        <button className="btn btn-primary" onClick={() => setModal({})}><i className="bx bx-plus" />Novo Agendamento</button>
      </div>

      <div className="agenda-toolbar">
        <div className="data-nav">
          <button className="btn btn-ghost btn-sm" onClick={() => navData(-1)}><i className="bx bx-chevron-left" /></button>
          <input type="date" value={data} onChange={e => { setData(e.target.value); carregar(e.target.value, filtroProf); }} className="date-input" />
          <button className="btn btn-ghost btn-sm" onClick={() => navData(1)}><i className="bx bx-chevron-right" /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => { const h = new Date().toISOString().slice(0, 10); setData(h); carregar(h, filtroProf); }}>Hoje</button>
        </div>
      </div>

      <div className="mini-semana">
        {diasSemana.map(d => (
          <button key={d} className={`mini-dia ${d === data ? "ativo" : ""}`} onClick={() => { setData(d); carregar(d, filtroProf); }}>
            <span>{new Date(d + "T12:00").toLocaleDateString("pt-BR", { weekday: "short" })}</span>
            <span>{new Date(d + "T12:00").getDate()}</span>
          </button>
        ))}
      </div>

      {loading ? <div className="page-loader"><span className="spinner" /></div> : (
        <div className="agendamentos-lista">
          {agendamentos.length === 0 ? (
            <div className="empty-state"><i className="bx bx-calendar-x" /><span>Nenhum agendamento para esta data</span></div>
          ) : agendamentos.map(ag => (
            <div key={ag.id} className={`agend-card status-${ag.status}`}>
              <div className="agend-hora">{ag.data_hora?.slice(11, 16)}</div>
              <div className="agend-body">
                <div className="agend-paciente">{ag.paciente_nome}</div>
                <div className="agend-meta">
                  <span><i className="bx bx-clipboard" />{ag.tipo}</span>
                  <span><i className="bx bx-time" />{ag.duracao_min}min</span>
                  {ag.paciente_telefone && <span><i className="bx bx-phone" />{fmtTel(ag.paciente_telefone)}</span>}
                </div>
                {ag.observacoes && <div className="agend-obs">{ag.observacoes}</div>}
              </div>
              <div className="agend-actions">
                <Badge status={ag.status} />
                <div className="actions mt-sm">
                  {ag.status === "agendado"   && <button className="icon-btn success" title="Confirmar" onClick={() => handleStatus(ag.id, "confirmado")}><i className="bx bx-check" /></button>}
                  {ag.status === "confirmado" && <button className="icon-btn primary"  title="Iniciar"   onClick={() => handleStatus(ag.id, "em_atendimento")}><i className="bx bx-play" /></button>}
                  <button className="icon-btn" title="Editar"   onClick={() => setModal(ag)}><i className="bx bx-edit" /></button>
                  <button className="icon-btn danger" title="Cancelar" onClick={() => setConfirm(ag.id)}><i className="bx bx-x" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <Modal title={modal.id ? "Editar Agendamento" : "Novo Agendamento"} onClose={() => setModal(null)} size="lg">
          <FormAgendamento inicial={modal} dataDefault={data} profissionalDefault={usuario?.id} onSalvar={handleSalvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
      {confirm && <Confirm msg="Cancelar este agendamento?" onConfirm={() => handleCancelar(confirm)} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

function FormAgendamento({ inicial, dataDefault, profissionalDefault, onSalvar, onCancelar }) {
  const api = useApi();
  const [pacientes, setPacientes]   = useState([]);
  const [buscaPac, setBuscaPac]     = useState(inicial?.paciente_nome || "");
  const [f, setF] = useState({
    paciente_id: "", profissional_id: profissionalDefault || "",
    data_hora: `${dataDefault}T08:00`, duracao_min: 30,
    tipo: "", status: "agendado", observacoes: "", ...inicial
  });
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const TIPOS = ["Consulta", "Retorno", "Exame", "Procedimento", "Avaliação", "Urgência", "Teleatendimento", "Outro"];

  const buscarPacientes = async q => {
    setBuscaPac(q);
    if (q.length < 2) return setPacientes([]);
    const d = await api.get(`/pacientes?q=${encodeURIComponent(q)}&limite=8`);
    setPacientes(d?.pacientes || []);
  };

  return (
    <form className="form" onSubmit={e => { e.preventDefault(); onSalvar(f); }}>
      <div className="form-grid-2">
        <div className="field span-2">
          <label>Paciente *</label>
          <div className="autocomplete">
            <input value={buscaPac} onChange={e => buscarPacientes(e.target.value)} placeholder="Buscar paciente..." required={!f.paciente_id} />
            {pacientes.length > 0 && (
              <div className="autocomplete-list">
                {pacientes.map(p => (
                  <div key={p.id} className="autocomplete-item" onClick={() => { setF(prev => ({ ...prev, paciente_id: p.id })); setBuscaPac(p.nome); setPacientes([]); }}>
                    <strong>{p.nome}</strong><span>{fmtCPF(p.cpf)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="field">
          <label>Tipo *</label>
          <select value={f.tipo} onChange={set("tipo")} required>
            <option value="">Selecionar</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Data e Hora *</label>
          <input type="datetime-local" value={f.data_hora} onChange={set("data_hora")} required />
        </div>
        <div className="field">
          <label>Duração (min)</label>
          <select value={f.duracao_min} onChange={set("duracao_min")}>
            {[15, 20, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
        {f.id && (
          <div className="field">
            <label>Status</label>
            <select value={f.status} onChange={set("status")}>
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
        )}
        <div className="field span-2">
          <label>Observações</label>
          <textarea value={f.observacoes} onChange={set("observacoes")} rows={2} placeholder="Informações adicionais..." />
        </div>
      </div>
      <div className="flex gap-sm justify-end mt-lg">
        <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primary"><i className="bx bx-save" />Salvar</button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────
// ATENDIMENTOS
// ─────────────────────────────────────────────
function Atendimentos() {
  const api = useApi();
  const { toast } = useApp();
  const [atendimentos, setAtendimentos] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(null);
  const [detalheModal, setDetalheModal] = useState(null);
  const [filtros, setFiltros]           = useState({ data_inicio: "", data_fim: "", tipo: "", status: "" });
  const TIPOS = ["Consulta", "Retorno", "Exame", "Procedimento", "Avaliação", "Urgência", "Teleatendimento", "Outro"];

  const carregar = useCallback(async (f = filtros) => {
    setLoading(true);
    try {
      const q = Object.entries(f).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
      const rows = await api.get(`/atendimentos${q ? "?" + q : ""}`);
      setAtendimentos(Array.isArray(rows) ? rows : []);
    } finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => {
    const hoje = new Date();
    const ini  = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
    const fim  = hoje.toISOString().slice(0, 10);
    const f    = { ...filtros, data_inicio: ini, data_fim: fim };
    setFiltros(f);
    carregar(f);
  }, []);

  const handleSalvar = async dados => {
    try {
      if (dados.id) { await api.put(`/atendimentos/${dados.id}`, dados); toast("Atendimento atualizado"); }
      else { await api.post("/atendimentos", dados); toast("Atendimento registrado com sucesso"); }
      setModal(null);
      carregar();
    } catch (e) { toast(e.message, "error"); }
  };

  const abrirDetalhe = async at => {
    try { const d = await api.get(`/atendimentos/${at.id}`); setDetalheModal(d); }
    catch (e) { toast(e.message, "error"); }
  };

  const setFiltro = k => e => { const nf = { ...filtros, [k]: e.target.value }; setFiltros(nf); carregar(nf); };

  return (
    <div className="page">
      <div className="page-header">
        <h1><i className="bx bxs-clinic" />Atendimentos</h1>
        <button className="btn btn-primary" onClick={() => setModal({})}><i className="bx bx-plus" />Registrar Atendimento</button>
      </div>

      <div className="filtros-bar">
        <div className="field-inline"><label>De</label><input type="date" value={filtros.data_inicio} onChange={setFiltro("data_inicio")} /></div>
        <div className="field-inline"><label>Até</label><input type="date" value={filtros.data_fim} onChange={setFiltro("data_fim")} /></div>
        <select value={filtros.tipo} onChange={setFiltro("tipo")} className="select-inline">
          <option value="">Todos tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filtros.status} onChange={setFiltro("status")} className="select-inline">
          <option value="">Todos status</option>
          {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? <div className="page-loader"><span className="spinner" /></div> : (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Data/Hora</th><th>Paciente</th><th>Profissional</th><th>Tipo</th><th>Motivo</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {atendimentos.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><i className="bx bx-search-alt" /><span>Nenhum atendimento encontrado</span></div></td></tr>
              ) : atendimentos.map(at => (
                <tr key={at.id}>
                  <td className="mono">{fmtDateTime(at.data_hora)}</td>
                  <td><button className="link-btn" onClick={() => abrirDetalhe(at)}>{at.paciente_nome}</button></td>
                  <td>{at.profissional_nome}</td>
                  <td>{at.tipo}</td>
                  <td className="truncate" title={at.motivo}>{at.motivo}</td>
                  <td><Badge status={at.status} /></td>
                  <td><div className="actions"><button className="icon-btn" title="Editar" onClick={() => setModal(at)}><i className="bx bx-edit" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== null && (
        <Modal title={modal.id ? "Editar Atendimento" : "Registrar Atendimento"} onClose={() => setModal(null)} size="xl">
          <FormAtendimento inicial={modal} onSalvar={handleSalvar} onCancelar={() => setModal(null)} />
        </Modal>
      )}
      {detalheModal && (
        <Modal title={`Atendimento — ${detalheModal.paciente_nome}`} onClose={() => setDetalheModal(null)} size="xl">
          <DetalheAtendimento at={detalheModal} onFechar={() => setDetalheModal(null)} />
        </Modal>
      )}
    </div>
  );
}

function FormAtendimento({ inicial, onSalvar, onCancelar }) {
  const api = useApi();
  const { usuario } = useApp();
  const [pacientes, setPacientes]   = useState([]);
  const [buscaPac, setBuscaPac]     = useState(inicial?.paciente_nome || "");
  const [f, setF] = useState({
    paciente_id: "", profissional_id: usuario?.id || "",
    tipo: "", motivo: "", anamnese: "", diagnostico: "", conduta: "",
    observacoes: "", retorno_em: "", status: "em_atendimento", ...inicial
  });
  const set = k => e => setF(p => ({ ...p, [k]: e.target.value }));
  const TIPOS = ["Consulta", "Retorno", "Exame", "Procedimento", "Avaliação", "Urgência", "Teleatendimento", "Outro"];

  const buscarPacientes = async q => {
    setBuscaPac(q);
    if (q.length < 2) return setPacientes([]);
    const d = await api.get(`/pacientes?q=${encodeURIComponent(q)}&limite=8`);
    setPacientes(d?.pacientes || []);
  };

  return (
    <form className="form" onSubmit={e => { e.preventDefault(); onSalvar(f); }}>
      <div className="form-grid-2">
        <div className="field span-2">
          <label>Paciente *</label>
          <div className="autocomplete">
            <input value={buscaPac} onChange={e => buscarPacientes(e.target.value)} placeholder="Buscar paciente..." />
            {pacientes.length > 0 && (
              <div className="autocomplete-list">
                {pacientes.map(p => (
                  <div key={p.id} className="autocomplete-item" onClick={() => { setF(prev => ({ ...prev, paciente_id: p.id })); setBuscaPac(p.nome); setPacientes([]); }}>
                    <strong>{p.nome}</strong><span>{fmtCPF(p.cpf)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="field">
          <label>Tipo *</label>
          <select value={f.tipo} onChange={set("tipo")} required>
            <option value="">Selecionar</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field span-2"><label>Motivo da Consulta *</label><input value={f.motivo} onChange={set("motivo")} required placeholder="Queixa principal do paciente" /></div>
        <div className="field span-2"><label>Anamnese</label><textarea value={f.anamnese} onChange={set("anamnese")} rows={4} placeholder="Histórico clínico, sinais vitais, HDA..." /></div>
        <div className="field span-2"><label>Diagnóstico</label><textarea value={f.diagnostico} onChange={set("diagnostico")} rows={3} placeholder="CID-10, hipóteses diagnósticas..." /></div>
        <div className="field span-2"><label>Conduta / Prescrição</label><textarea value={f.conduta} onChange={set("conduta")} rows={4} placeholder="Tratamento prescrito, orientações..." /></div>
        <div className="field span-2"><label>Observações complementares</label><textarea value={f.observacoes} onChange={set("observacoes")} rows={2} placeholder="Informações adicionais..." /></div>
        <div className="field"><label>Data de retorno</label><input type="date" value={f.retorno_em} onChange={set("retorno_em")} /></div>
        <div className="field"><label>Status</label>
          <select value={f.status} onChange={set("status")}>
            <option value="em_atendimento">Em Atendimento</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>
      <div className="flex gap-sm justify-end mt-lg">
        <button type="button" className="btn btn-ghost" onClick={onCancelar}>Cancelar</button>
        <button type="submit" className="btn btn-primary"><i className="bx bx-save" />Salvar Atendimento</button>
      </div>
    </form>
  );
}

function DetalheAtendimento({ at }) {
  const api = useApi();
  const { toast } = useApp();
  const [uploading, setUploading] = useState(false);
  const [anexos, setAnexos]       = useState(at.anexos || []);
  const fileRef = useRef();

  const handleUpload = async e => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("arquivos", f);
      await api.upload(`/atendimentos/${at.id}/anexos`, fd);
      const d = await api.get(`/atendimentos/${at.id}`);
      setAnexos(d.anexos || []);
      toast(`${files.length} arquivo(s) anexado(s)`);
    } catch (e) { toast(e.message, "error"); } finally { setUploading(false); }
  };

  const handleRemoverAnexo = async id => {
    try { await api.del(`/anexos/${id}`); setAnexos(prev => prev.filter(a => a.id !== id)); toast("Anexo removido"); }
    catch (e) { toast(e.message, "error"); }
  };

  return (
    <div className="detalhe-atendimento">
      <div className="at-grid">
        <div className="at-meta">
          <div className="info-row"><span>Data/Hora</span><strong>{fmtDateTime(at.data_hora)}</strong></div>
          <div className="info-row"><span>Paciente</span><strong>{at.paciente_nome}</strong></div>
          <div className="info-row"><span>Profissional</span><strong>{at.profissional_nome}</strong></div>
          <div className="info-row"><span>Tipo</span><strong>{at.tipo}</strong></div>
          <div className="info-row"><span>Status</span><Badge status={at.status} /></div>
          {at.retorno_em && <div className="info-row"><span>Retorno</span><strong>{fmtDate(at.retorno_em)}</strong></div>}
        </div>
        <div className="at-body">
          {at.motivo      && <div className="prontuario-field"><label>Motivo</label><p>{at.motivo}</p></div>}
          {at.anamnese    && <div className="prontuario-field"><label>Anamnese</label><p>{at.anamnese}</p></div>}
          {at.diagnostico && <div className="prontuario-field"><label>Diagnóstico</label><p>{at.diagnostico}</p></div>}
          {at.conduta     && <div className="prontuario-field"><label>Conduta / Prescrição</label><p>{at.conduta}</p></div>}
          {at.observacoes && <div className="prontuario-field"><label>Observações</label><p>{at.observacoes}</p></div>}
        </div>
      </div>
      <div className="anexos-section">
        <div className="anexos-header">
          <h4><i className="bx bx-paperclip" />Anexos ({anexos.length})</h4>
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()} disabled={uploading}>
            {uploading ? <span className="spinner sm" /> : <><i className="bx bx-upload" />Adicionar</>}
          </button>
          <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" style={{ display: "none" }} onChange={handleUpload} />
        </div>
        <div className="anexos-lista">
          {anexos.length === 0 ? (
            <div className="empty-state sm"><i className="bx bx-folder-open" /><span>Nenhum anexo</span></div>
          ) : anexos.map(a => (
            <div key={a.id} className="anexo-item">
              <i className={`bx ${a.tipo_mime?.includes("pdf") ? "bxs-file-pdf" : a.tipo_mime?.includes("image") ? "bxs-image" : "bxs-file-doc"}`} />
              <a href={`http://localhost:3000/clinica/uploads/${a.nome_arquivo}`} target="_blank" rel="noreferrer">{a.nome_original}</a>
              <span className="text-muted">{Math.round(a.tamanho_bytes / 1024)} KB</span>
              <button className="icon-btn danger sm" onClick={() => handleRemoverAnexo(a.id)}><i className="bx bx-x" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ALERTAS
// ─────────────────────────────────────────────
function AlertasPanel({ onClose }) {
  const api = useApi();
  const { toast } = useApp();
  const [alertas, setAlertas] = useState([]);

  const carregar = async () => { const rows = await api.get("/alertas"); setAlertas(Array.isArray(rows) ? rows : []); };

  useEffect(() => { carregar(); }, []);

  const marcarLido  = async id => { await api.put(`/alertas/${id}/lido`); setAlertas(prev => prev.map(a => a.id === id ? { ...a, lido: 1 } : a)); };
  const marcarTodos = async () => { await api.put("/alertas/lidos/todos"); setAlertas(prev => prev.map(a => ({ ...a, lido: 1 }))); toast("Todos marcados como lidos"); };

  const TIPO_ICON = { RETORNO: "bx-calendar-event", CONSULTA: "bx-calendar-check", SISTEMA: "bx-info-circle" };

  return (
    <div className="alertas-panel">
      <div className="alertas-header">
        <h3><i className="bx bxs-bell" />Alertas</h3>
        <div className="flex gap-sm">
          <button className="btn btn-ghost btn-sm" onClick={marcarTodos}>Marcar todos</button>
          <button className="icon-btn" onClick={onClose}><i className="bx bx-x" /></button>
        </div>
      </div>
      <div className="alertas-lista">
        {alertas.length === 0 ? (
          <div className="empty-state sm"><i className="bx bx-bell-off" /><span>Nenhum alerta</span></div>
        ) : alertas.map(a => (
          <div key={a.id} className={`alerta-item ${a.lido ? "lido" : ""}`} onClick={() => !a.lido && marcarLido(a.id)}>
            <i className={`bx ${TIPO_ICON[a.tipo] || "bx-info-circle"}`} />
            <div className="alerta-body">
              <strong>{a.titulo}</strong>
              {a.mensagem && <p>{a.mensagem}</p>}
              {a.paciente_nome && <span className="text-muted"><i className="bx bx-user" />{a.paciente_nome}</span>}
              <span className="text-muted sm">{fmtDateTime(a.criado_em)}</span>
            </div>
            {!a.lido && <span className="unread-dot" />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR / LAYOUT
// ─────────────────────────────────────────────
const MENU = [
  { id: "dashboard",    icon: "bxs-dashboard",    label: "Dashboard" },
  { id: "pacientes",    icon: "bxs-user-detail",   label: "Pacientes" },
  { id: "agenda",       icon: "bxs-calendar",      label: "Agenda" },
  { id: "atendimentos", icon: "bxs-clinic",        label: "Atendimentos" },
];

function Layout({ usuario, onLogout }) {
  const [pagina, setPagina]           = useState("dashboard");
  const [darkMode, setDarkMode]       = useState(() => localStorage.getItem("theme") === "dark");
  const [alertasOpen, setAlertasOpen] = useState(false);
  const [alertasCount, setAlertasCount] = useState(0);
  const [collapsed, setCollapsed]     = useState(false);
  const { toasts, toast, removeToast } = useToast();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const buscarAlertasCount = useCallback(async () => {
    try {
      const token = auth.getToken();
      const r = await fetch(`${API}/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (d.sucesso) setAlertasCount(d.dados?.alertas_pendentes || 0);
    } catch {}
  }, []);

  useEffect(() => {
    buscarAlertasCount();
    const t = setInterval(buscarAlertasCount, 30000);
    return () => clearInterval(t);
  }, [buscarAlertasCount]);

  const PAGE_MAP = {
    dashboard:    <Dashboard />,
    pacientes:    <Pacientes />,
    agenda:       <Agenda />,
    atendimentos: <Atendimentos />,
  };

  return (
    <AppContext.Provider value={{ usuario, toast }}>
      <div className={`app-layout ${collapsed ? "sidebar-collapsed" : ""}`}>
        <aside className="sidebar">
          <div className="sidebar-brand">
            <i className="bx bx-plus-medical" />
            {!collapsed && <span>ClinicaDesk</span>}
          </div>
          <nav className="sidebar-nav">
            {MENU.map(m => (
              <button key={m.id} className={`nav-item ${pagina === m.id ? "ativo" : ""}`} onClick={() => setPagina(m.id)} title={collapsed ? m.label : ""}>
                <i className={`bx ${m.icon}`} />
                {!collapsed && <span>{m.label}</span>}
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            {!collapsed && (
              <div className="user-info">
                <i className="bx bxs-user-circle" />
                <div>
                  <span className="user-nome">{usuario.nome || usuario.name}</span>
                  <span className="user-perfil">{usuario.perfil || usuario.role}</span>
                </div>
              </div>
            )}
            <button className="icon-btn" onClick={() => setCollapsed(p => !p)} title="Recolher">
              <i className={`bx ${collapsed ? "bx-chevron-right" : "bx-chevron-left"}`} />
            </button>
          </div>
        </aside>

        <div className="main-area">
          <header className="topbar">
            <div className="topbar-left">
              <h2>{MENU.find(m => m.id === pagina)?.label}</h2>
            </div>
            <div className="topbar-right">
              <div className="alertas-btn-wrapper">
                <button className="icon-btn" onClick={() => setAlertasOpen(p => !p)} title="Alertas">
                  <i className="bx bxs-bell" />
                  {alertasCount > 0 && <span className="badge-count">{alertasCount}</span>}
                </button>
                {alertasOpen && <AlertasPanel onClose={() => setAlertasOpen(false)} />}
              </div>
              <button className="icon-btn" onClick={() => setDarkMode(p => !p)} title="Alternar tema">
                <i className={`bx ${darkMode ? "bx-sun" : "bx-moon"}`} />
              </button>
              <button className="btn btn-ghost btn-sm" onClick={onLogout}>
                <i className="bx bx-log-out" />{!collapsed && "Sair"}
              </button>
            </div>
          </header>
          <main className="main-content">
            {PAGE_MAP[pagina] || <Dashboard />}
          </main>
        </div>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </AppContext.Provider>
  );
}

// ─────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────
export default function App() {
  const { user, logged } = useAuthState();

  const handleLogout = () => { doLogout(); };

  if (!logged || !user) return <Login />;
  return <Layout usuario={user} onLogout={handleLogout} />;
}