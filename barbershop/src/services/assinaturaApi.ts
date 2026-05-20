import api from "./api";
import type { Assinatura } from "../types";

type CreateAssinatura = {
  clienteId: string;
  nome: string;
  creditosTotal: number;
  valorMensal: number;
  renovaEm: string;
  servicosIncluidos?: string[];
  observacoes?: string;
};

export const assinaturaApi = {
  list: (status?: string) =>
    api.get<{ success: true; data: Assinatura[] }>("/barbershop/assinaturas", {
      params: status ? { status } : {},
    }),

  create: (body: CreateAssinatura) =>
    api.post<{ success: true; data: Assinatura }>(
      "/barbershop/assinaturas",
      body,
    ),

  usarCredito: (id: string, servicoId?: string) =>
    api.post<{
      success: true;
      data: {
        id: string;
        creditosRestantes: number;
        status: string;
      };
    }>(
      `/barbershop/assinaturas/${id}/usar-credito`,
      servicoId ? { servicoId } : {},
    ),

  renovar: (id: string, novaRenovaEm?: string) =>
    api.post<{ success: true; data: Assinatura }>(
      `/barbershop/assinaturas/${id}/renovar`,
      novaRenovaEm ? { novaRenovaEm } : {},
    ),

  cancelar: (id: string) =>
    api.delete<{
      success: true;
      data: { id: string; status: string; canceladoEm: string };
    }>(`/barbershop/assinaturas/${id}`),
};
