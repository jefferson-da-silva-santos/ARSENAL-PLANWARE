import { api } from "./api"

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

export interface SystemError {
  id:          string
  module:      string
  route:       string
  method:      string
  statusCode:  number
  errorType:   string
  message:     string
  tenantId:    string | null
  tenantName:  string | null
  userId:      string | null
  userEmail:   string | null
  ip:          string | null
  resolved:    boolean
  resolvedAt:  string | null
  resolvedBy:  string | null
  resolution:  string | null
  fingerprint: string | null
  createdAt:   string
  // só no detalhe completo
  stack?:        string | null
  requestBody?:  string | null
  queryParams?:  string | null
  userAgent?:    string | null
  // agrupado
  count?:        number
  latestAt?:     string
  firstSeenAt?:  string
}

export interface ErrorStats {
  total:      number
  unresolved: number
  critical:   number
  last24h:    number
  byModule:   { module: string; count: number }[]
  topErrors:  {
    fingerprint: string
    module:      string
    route:       string
    method:      string
    errorType:   string
    message:     string
    count:       number
  }[]
}

export interface ErrorsListParams {
  module?:     string
  tenantId?:   string
  resolved?:   string          // 'true' | 'false' | ''
  statusCode?: string
  from?:       string
  to?:         string
  q?:          string
  page?:       number
  perPage?:    number
  grouped?:    'true' | 'false'
}

export interface ErrorsListResponse {
  errors:  SystemError[]
  total:   number
  page:    number
  perPage: number
  grouped: boolean
}

// ─────────────────────────────────────────────────────────────
//  API
// ─────────────────────────────────────────────────────────────

export const errorsApi = {
  stats: () =>
    api.get<{ success: true; data: ErrorStats }>('/admin/errors/stats'),

  list: (params: ErrorsListParams = {}) =>
    api.get<{ success: true; data: ErrorsListResponse }>('/admin/errors', { params }),

  get: (id: string) =>
    api.get<{ success: true; data: SystemError }>(`/admin/errors/${id}`),

  occurrences: (fingerprint: string, params?: { page?: number; perPage?: number }) =>
    api.get<{ success: true; data: ErrorsListResponse }>(
      `/admin/errors/${fingerprint}/occurrences`,
      { params }
    ),

  resolve: (id: string, body: { resolution?: string; fingerprint?: string }) =>
    api.post<{ success: true; data: unknown }>(`/admin/errors/${id}/resolve`, body),

  unresolve: (id: string) =>
    api.post<{ success: true; data: SystemError }>(`/admin/errors/${id}/unresolve`),

  delete: (id: string, fingerprint?: string) =>
    api.delete(`/admin/errors/${id}`, { params: fingerprint ? { fingerprint } : {} }),

  clearResolved: (days = 30) =>
    api.delete(`/admin/errors/clear`, { params: { days } }),
}