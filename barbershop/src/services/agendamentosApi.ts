import api from "./api";
import type { Agendamento, Disponibilidade } from "../types";

type ListParams = {
  data?: string; // YYYY-MM-DD — filtra um dia inteiro
  de?: string;
  ate?: string;
  barbeiroId?: string;
  clienteId?: string;
  status?: string;
  page?: number;
  perPage?: number;
};

type CreateAgendamento = {
  barbeiroId: string;
  servicoId: string;
  dataHora: string;
  clienteId?: string;
  nomeCliente?: string;
  telefoneCliente?: string;
  origem?: string;
  observacoes?: string;
};

type ListResponse = {
  success: true;
  data: {
    agendamentos: Agendamento[];
    total: number;
    page: number;
    perPage: number;
  };
};

export const agendamentosApi = {
  // Disponibilidade de slots — chamada mais crítica da agenda
  getDisponibilidade: (params: {
    barbeiroId: string;
    servicoId: string;
    data: string; // YYYY-MM-DD
  }) =>
    api.get<{ success: true; data: Disponibilidade }>(
      "/barbershop/agendamentos/disponibilidade",
      { params },
    ),

  list: (params?: ListParams) =>
    api.get<ListResponse>("/barbershop/agendamentos", { params }),

  get: (id: string) =>
    api.get<{ success: true; data: Agendamento }>(
      `/barbershop/agendamentos/${id}`,
    ),

  create: (body: CreateAgendamento) =>
    api.post<{ success: true; data: Agendamento }>(
      "/barbershop/agendamentos",
      body,
    ),

  update: (
    id: string,
    body: {
      dataHora?: string;
      barbeiroId?: string;
      status?: string;
      observacoes?: string;
    },
  ) =>
    api.patch<{ success: true; data: Agendamento }>(
      `/barbershop/agendamentos/${id}`,
      body,
    ),

  cancelar: (id: string) =>
    api.post<{ success: true; data: { id: string; status: string } }>(
      `/barbershop/agendamentos/${id}/cancelar`,
    ),

  concluir: (id: string, valorFinal?: number) =>
    api.post<{ success: true; data: Agendamento }>(
      `/barbershop/agendamentos/${id}/concluir`,
      valorFinal !== undefined ? { valorFinal } : {},
    ),
};
