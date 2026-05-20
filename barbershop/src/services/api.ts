import axios from "axios";

// ─────────────────────────────────────────────────────────────
//  Instância base do axios
//  Todas as chamadas da app passam por aqui
// ─────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// ── Interceptor de request — injeta o token JWT ───────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("barber_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Interceptor de response — trata 401 globalmente ──────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("barber_token");
      localStorage.removeItem("barber_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
