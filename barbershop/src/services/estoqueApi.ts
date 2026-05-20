import api from "./api";
import type { Produto, AlertaEstoque, MovEstoque } from "../types";

type CreateProduto = {
  nome: string;
  categoria?: string;
  fornecedor?: string;
  unidade?: string;
  precoUnitario?: number;
  quantidadeAtual?: number;
  quantidadeMin?: number;
  validade?: string;
};

type RegisterMov = {
  tipo: "ENTRADA" | "SAIDA" | "AJUSTE";
  quantidade: number;
  motivo?: string;
};

export const estoqueApi = {
  list: (ativos?: boolean) =>
    api.get<{ success: true; data: Produto[] }>("/barbershop/estoque", {
      params: ativos !== undefined ? { ativos: String(ativos) } : {},
    }),

  get: (id: string) =>
    api.get<{ success: true; data: Produto }>(`/barbershop/estoque/${id}`),

  alertas: () =>
    api.get<{ success: true; data: AlertaEstoque[] }>(
      "/barbershop/estoque/alertas",
    ),

  create: (body: CreateProduto) =>
    api.post<{ success: true; data: Produto }>("/barbershop/estoque", body),

  update: (id: string, body: Partial<CreateProduto> & { ativo?: boolean }) =>
    api.patch<{ success: true; data: Produto }>(
      `/barbershop/estoque/${id}`,
      body,
    ),

  registrarMovimentacao: (id: string, body: RegisterMov) =>
    api.post<{
      success: true;
      data: { movimentacao: MovEstoque; novaQuantidade: number };
    }>(`/barbershop/estoque/${id}/movimentacao`, body),
};
