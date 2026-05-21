// ── Auth ──────────────────────────────────────────────────────
export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'SUPERADMIN' | 'USER'
  tenantId: string
  permissions: System[]
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

// ── Tenant ────────────────────────────────────────────────────
export interface Tenant {
  id: string
  name: string
  slug: string
  active: boolean
  createdAt: string
  updatedAt: string
  _count?: { users: number }
}

// ── User ──────────────────────────────────────────────────────
export type System =
  | 'CLIENTPRO' | 'STOCKPRO' | 'FINVAULT'
  | 'FINFLOW'   | 'FINANCEFLOW' | 'KANBAN'
  | 'CLINICA'   | 'ORDEMTECH'   | 'FIADO'

export type Role = 'SUPERADMIN' | 'USER'

export interface Permission {
  system: System
  granted: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  tenantId: string
  createdAt: string
  updatedAt: string
  permissions: Permission[]
  tenant?: { name: string; slug: string }
}

// ── API Response ──────────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// ── Theme ─────────────────────────────────────────────────────
export type Theme = 'dark' | 'light'