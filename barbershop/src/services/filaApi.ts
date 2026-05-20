import api from "./api";
import type { FilaEntry } from "../types";

type EntrarFilaBody = {
  clienteId?: string;
  barbeiroId?: string;
  nomeCliente?: string;
  telefone?: string;
  servicoId?: string;
};

export const filaApi = {
  list: () => api.get<{ success: true; data: FilaEntry[] }>("/barbershop/fila"),

  entrar: (body: EntrarFilaBody) =>
    api.post<{ success: true; data: FilaEntry }>("/barbershop/fila", body),

  chamarProximo: () =>
    api.patch<{
      success: true;
      data: {
        id: string;
        posicao: number;
        nomeCliente: string;
        telefone: string | null;
        servicoId: string | null;
        status: string;
        chamadoEm: string;
      };
    }>("/barbershop/fila/proximo"),

  remover: (id: string) =>
    api.delete<{ success: true; data: { id: string; status: string } }>(
      `/barbershop/fila/${id}`,
    ),
};
