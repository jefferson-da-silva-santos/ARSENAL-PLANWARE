import axios from 'axios'
import type { LoginResponse, Tenant, User, System } from '@/types'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Interceptor: injeta token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('planware_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Interceptor: trata 401 ───────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('planware_token')
      localStorage.removeItem('planware_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: LoginResponse }>('/auth/login', { email, password }),
  me: () =>
    api.get<{ success: boolean; data: { id: string; tenantId: string; role: string; permissions: string[] } }>('/auth/me'),
}

// ── Admin — Tenants ───────────────────────────────────────────
export const tenantsApi = {
  list: () =>
    api.get<{ success: boolean; data: Tenant[] }>('/admin/tenants'),
  get: (id: string) =>
    api.get<{ success: boolean; data: Tenant }>(`/admin/tenants/${id}`),
  create: (name: string) =>
    api.post<{ success: boolean; data: Tenant }>('/admin/tenants', { name }),
  toggle: (id: string) =>
    api.patch<{ success: boolean; data: Tenant }>(`/admin/tenants/${id}/toggle`),
}

// ── Admin — Users ─────────────────────────────────────────────
export const usersApi = {
  list: (tenantId?: string) =>
    api.get<{ success: boolean; data: User[] }>('/admin/users', {
      params: tenantId ? { tenantId } : {},
    }),
  get: (id: string) =>
    api.get<{ success: boolean; data: User }>(`/admin/users/${id}`),
  create: (payload: {
    tenantId: string; name: string; email: string
    password: string; role?: string; permissions?: System[]
  }) => api.post<{ success: boolean; data: User }>('/admin/users', payload),
  toggle: (id: string) =>
    api.patch<{ success: boolean; data: User }>(`/admin/users/${id}/toggle`),
  resetPassword: (id: string, password: string) =>
    api.patch(`/admin/users/${id}/password`, { password }),
  delete: (id: string, hard = false) =>
    api.delete(`/admin/users/${id}`, { params: { hard } }),
}

// ── Admin — Permissions ───────────────────────────────────────
export const permissionsApi = {
  get: (userId: string) =>
    api.get<{ success: boolean; data: Array<{ system: System; granted: boolean }> }>(
      `/admin/users/${userId}/permissions`
    ),
  update: (userId: string, permissions: System[]) =>
    api.put(`/admin/users/${userId}/permissions`, { permissions }),
}