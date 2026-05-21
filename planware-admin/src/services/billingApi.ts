import { api } from "./api";

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

export type BillingType = "MONTHLY" | "ANNUAL" | "LIFETIME" | "CUSTOM";
export type ChargeStatus =
  | "PENDING"
  | "PARTIAL"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";
export type ChargeType = "SUBSCRIPTION" | "SETUP" | "EXTRA" | "CUSTOM";
export type PaymentMethod =
  | "PIX"
  | "TRANSFER"
  | "CASH"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "OTHER";

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  systems: string[];
  active: boolean;
  createdAt: string;
  _count?: { tenantPlans: number };
}

export interface TenantPlan {
  id: string;
  tenantId: string;
  planId: string;
  type: BillingType;
  startedAt: string;
  renewsAt: string | null;
  cancelledAt: string | null;
  notes: string | null;
  plan: Plan;
  tenant?: { id: string; name: string; slug: string; active: boolean };
}

export interface Payment {
  id: string;
  chargeId: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  reference: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Charge {
  id: string;
  tenantId: string;
  description: string;
  amount: number;
  dueDate: string;
  status: ChargeStatus;
  type: ChargeType;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: { id: string; name: string; slug: string };
  payments?: Payment[];
}

export interface BillingStats {
  totalCharges: number;
  pendingCharges: number;
  overdueCharges: number;
  paidThisMonth: number;
  totalReceived: number;
  totalOpen: number;
  recentPayments: (Payment & {
    charge: { description: string; tenant: { name: string } };
  })[];
  overdueList: (Charge & { tenant: { id: string; name: string } })[];
}

export interface TenantFinancial {
  tenantPlan: TenantPlan | null;
  charges: (Charge & { payments: Payment[] })[];
  totalCharged: number;
  totalPaid: number;
  totalOpen: number;
  overdue: number;
}

// ─────────────────────────────────────────────────────────────
//  API
// ─────────────────────────────────────────────────────────────

export const billingApi = {
  // Stats
  stats: () =>
    api.get<{ success: true; data: BillingStats }>("/admin/billing/stats"),

  // Planos
  listPlans: (activeOnly?: boolean) =>
    api.get<{ success: true; data: Plan[] }>("/admin/billing/plans", {
      params: activeOnly ? { active: "true" } : {},
    }),
  createPlan: (body: Partial<Plan>) =>
    api.post<{ success: true; data: Plan }>("/admin/billing/plans", body),
  updatePlan: (id: string, body: Partial<Plan>) =>
    api.patch<{ success: true; data: Plan }>(
      `/admin/billing/plans/${id}`,
      body,
    ),
  togglePlan: (id: string) =>
    api.patch<{ success: true; data: Plan }>(
      `/admin/billing/plans/${id}/toggle`,
    ),

  // Assinaturas
  getTenantPlan: (tenantId: string) =>
    api.get<{ success: true; data: TenantPlan | null }>(
      `/admin/billing/tenants/${tenantId}/plan`,
    ),
  assignPlan: (
    tenantId: string,
    body: {
      planId: string;
      type: BillingType;
      startedAt?: string;
      renewsAt?: string;
      notes?: string;
    },
  ) =>
    api.put<{ success: true; data: TenantPlan }>(
      `/admin/billing/tenants/${tenantId}/plan`,
      body,
    ),
  cancelTenantPlan: (tenantId: string) =>
    api.delete(`/admin/billing/tenants/${tenantId}/plan`),
  getTenantFinancial: (tenantId: string) =>
    api.get<{ success: true; data: TenantFinancial }>(
      `/admin/billing/tenants/${tenantId}/financial`,
    ),

  // Cobranças
  listCharges: (params?: {
    tenantId?: string;
    status?: string;
    type?: string;
    from?: string;
    to?: string;
    page?: number;
    perPage?: number;
  }) =>
    api.get<{
      success: true;
      data: { charges: Charge[]; total: number; page: number; perPage: number };
    }>("/admin/billing/charges", { params }),
  getCharge: (id: string) =>
    api.get<{ success: true; data: Charge }>(`/admin/billing/charges/${id}`),
  createCharge: (body: {
    tenantId: string;
    description: string;
    amount: number;
    dueDate: string;
    type?: ChargeType;
    notes?: string;
  }) =>
    api.post<{ success: true; data: Charge }>("/admin/billing/charges", body),
  updateCharge: (id: string, body: Partial<Charge>) =>
    api.patch<{ success: true; data: Charge }>(
      `/admin/billing/charges/${id}`,
      body,
    ),
  cancelCharge: (id: string) =>
    api.post<{ success: true; data: Charge }>(
      `/admin/billing/charges/${id}/cancel`,
    ),
  deleteCharge: (id: string) => api.delete(`/admin/billing/charges/${id}`),
  markOverdue: () =>
    api.post<{ success: true; data: { marked: number } }>(
      "/admin/billing/charges/mark-overdue",
    ),

  // Pagamentos
  registerPayment: (
    chargeId: string,
    body: {
      amount: number;
      method: PaymentMethod;
      paidAt?: string;
      reference?: string;
      notes?: string;
    },
  ) =>
    api.post<{ success: true; data: Payment }>(
      `/admin/billing/charges/${chargeId}/payments`,
      body,
    ),
  deletePayment: (id: string) => api.delete(`/admin/billing/payments/${id}`),
};
