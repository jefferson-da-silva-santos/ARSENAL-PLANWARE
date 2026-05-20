import api from "./api";
import type {
  Despesa,
  Fechamento,
  DashboardFinanceiro,
  DashboardData,
} from "../types";

type CreateDespesa = {
  descricao: string;
  valor: number;
  categoria?: string;
  data?: string;
  observacoes?: string;
};

export const financeiroApi = {
  // ── Dashboard operacional (homepage) ─────────────────────

  getDashboard: () =>
    api.get<{ success: true; data: DashboardData }>("/barbershop/dashboard"),

  // ── Dashboard financeiro ──────────────────────────────────

  getDashboardFinanceiro: (params?: { de?: string; ate?: string }) =>
    api.get<{ success: true; data: DashboardFinanceiro }>(
      "/barbershop/financeiro/dashboard",
      { params },
    ),

  // ── Despesas ──────────────────────────────────────────────

  listDespesas: (params?: { de?: string; ate?: string; categoria?: string }) =>
    api.get<{ success: true; data: Despesa[] }>(
      "/barbershop/financeiro/despesas",
      {
        params,
      },
    ),

  createDespesa: (body: CreateDespesa) =>
    api.post<{ success: true; data: Despesa }>(
      "/barbershop/financeiro/despesas",
      body,
    ),

  deleteDespesa: (id: string) =>
    api.delete(`/barbershop/financeiro/despesas/${id}`),

  // ── Fechamento de caixa ───────────────────────────────────

  listFechamentos: (params?: { de?: string; ate?: string }) =>
    api.get<{ success: true; data: Fechamento[] }>(
      "/barbershop/financeiro/fechamento",
      { params },
    ),

  createFechamento: (body?: { data?: string; observacoes?: string }) =>
    api.post<{ success: true; data: Fechamento }>(
      "/barbershop/financeiro/fechamento",
      body ?? {},
    ),
};
