import api from "./api";
import type {
  Barbeiro,
  Bloqueio,
  Comissao,
  DesempenhoBarbeiro,
  Agendamento,
} from "../types";

type CreateBarbeiro = {
  nome: string;
  telefone?: string;
  email?: string;
  foto?: string;
  nivel?: string;
  comissaoPct?: number;
  metaMensal?: number;
  metaCortes?: number;
};

type CreateBloqueio = {
  tipo: string;
  inicio: string;
  fim: string;
  motivo?: string;
};

export const barbeirosApi = {
  // ── Barbeiros ─────────────────────────────────────────────

  list: (ativos?: boolean) =>
    api.get<{ success: true; data: Barbeiro[] }>("/barbershop/barbeiros", {
      params: ativos !== undefined ? { ativos: String(ativos) } : {},
    }),

  get: (id: string) =>
    api.get<{ success: true; data: Barbeiro }>(`/barbershop/barbeiros/${id}`),

  create: (body: CreateBarbeiro) =>
    api.post<{ success: true; data: Barbeiro }>("/barbershop/barbeiros", body),

  update: (id: string, body: Partial<CreateBarbeiro>) =>
    api.patch<{ success: true; data: Barbeiro }>(
      `/barbershop/barbeiros/${id}`,
      body,
    ),

  delete: (id: string) => api.delete(`/barbershop/barbeiros/${id}`),

  updateMeta: (
    id: string,
    body: { metaMensal?: number | null; metaCortes?: number | null },
  ) =>
    api.patch<{ success: true; data: Barbeiro }>(
      `/barbershop/barbeiros/${id}/meta`,
      body,
    ),

  getAgenda: (id: string, data?: string) =>
    api.get<{ success: true; data: Agendamento[] }>(
      `/barbershop/barbeiros/${id}/agenda`,
      {
        params: data ? { data } : {},
      },
    ),

  getDesempenho: (id: string, params?: { de?: string; ate?: string }) =>
    api.get<{ success: true; data: DesempenhoBarbeiro }>(
      `/barbershop/barbeiros/${id}/desempenho`,
      { params },
    ),

  // ── Bloqueios ─────────────────────────────────────────────

  listBloqueios: (id: string, params?: { de?: string; ate?: string }) =>
    api.get<{ success: true; data: Bloqueio[] }>(
      `/barbershop/barbeiros/${id}/bloqueios`,
      { params },
    ),

  createBloqueio: (id: string, body: CreateBloqueio) =>
    api.post<{ success: true; data: Bloqueio }>(
      `/barbershop/barbeiros/${id}/bloqueios`,
      body,
    ),

  deleteBloqueio: (barbeiroId: string, bloqueioId: string) =>
    api.delete(`/barbershop/barbeiros/${barbeiroId}/bloqueios/${bloqueioId}`),

  // ── Comissões ─────────────────────────────────────────────

  listComissoes: (
    barbeiroId: string,
    params?: { repassado?: boolean; de?: string; ate?: string },
  ) =>
    api.get<{ success: true; data: Comissao[] }>(
      `/barbershop/barbeiros/${barbeiroId}/comissoes`,
      { params },
    ),

  marcarRepassadas: (barbeiroId: string, ids: string[]) =>
    api.post<{ success: true; data: { repassadas: number } }>(
      `/barbershop/barbeiros/${barbeiroId}/comissoes/repassar`,
      { ids },
    ),
};
