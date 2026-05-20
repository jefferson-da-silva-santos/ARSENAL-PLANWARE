import api from "./api";
import type { Servico } from "../types";

type CreateServico = {
  nome: string;
  descricao?: string;
  preco: number;
  duracaoMin: number;
  comissaoPct?: number;
  nivelMinimo?: string;
};

export const servicosApi = {
  list: (ativos?: boolean) =>
    api.get<{ success: true; data: Servico[] }>("/barbershop/servicos", {
      params: ativos !== undefined ? { ativos: String(ativos) } : {},
    }),

  get: (id: string) =>
    api.get<{ success: true; data: Servico }>(`/barbershop/servicos/${id}`),

  create: (body: CreateServico) =>
    api.post<{ success: true; data: Servico }>("/barbershop/servicos", body),

  update: (id: string, body: Partial<CreateServico> & { ativo?: boolean }) =>
    api.patch<{ success: true; data: Servico }>(
      `/barbershop/servicos/${id}`,
      body,
    ),

  delete: (id: string) => api.delete(`/barbershop/servicos/${id}`),
};
