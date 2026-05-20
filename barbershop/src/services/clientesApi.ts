import api from "./api";
import type { Cliente } from "../types";

type CreateCliente = {
  nome: string;
  telefone?: string;
  email?: string;
  dataNascimento?: string;
  observacoes?: string;
};

export const clientesApi = {
  list: (search?: string) =>
    api.get<{ success: true; data: Cliente[] }>("/barbershop/clientes", {
      params: search ? { q: search } : {},
    }),

  get: (id: string) =>
    api.get<{ success: true; data: Cliente }>(`/barbershop/clientes/${id}`),

  create: (body: CreateCliente) =>
    api.post<{ success: true; data: Cliente }>("/barbershop/clientes", body),

  update: (id: string, body: Partial<CreateCliente> & { ativo?: boolean }) =>
    api.patch<{ success: true; data: Cliente }>(
      `/barbershop/clientes/${id}`,
      body,
    ),
};
