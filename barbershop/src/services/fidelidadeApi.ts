import api from './api'
import type { Recompensa, Resgate } from '../types'

type CreateRecompensa = {
  nome             : string
  descricao?       : string
  pontosNecessarios: number
}

export const fidelidadeApi = {
  // ── Recompensas ───────────────────────────────────────────

  listRecompensas: (todas?: boolean) =>
    api.get<{ success: true; data: Recompensa[] }>('/barbershop/fidelidade/recompensas', {
      params: todas ? { todas: 'true' } : {},
    }),

  createRecompensa: (body: CreateRecompensa) =>
    api.post<{ success: true; data: Recompensa }>(
      '/barbershop/fidelidade/recompensas',
      body,
    ),

  updateRecompensa: (id: string, body: Partial<CreateRecompensa> & { ativa?: boolean }) =>
    api.patch<{ success: true; data: Recompensa }>(
      `/barbershop/fidelidade/recompensas/${id}`,
      body,
    ),

  // ── Fidelidade por cliente ────────────────────────────────

  getClienteFidelidade: (clienteId: string) =>
    api.get<{ success: true; data: {
      cliente : { id: string; nome: string; pontos: number }
      resgates: Resgate[]
    } }>(`/barbershop/fidelidade/${clienteId}`),

  // ── Pontos manuais ────────────────────────────────────────

  adicionarPontos: (clienteId: string, pontos: number, motivo?: string) =>
    api.post<{ success: true; data: {
      clienteId        : string
      pontosAdicionados: number
      novoSaldo        : number
      motivo           : string
    } }>('/barbershop/fidelidade/pontos', { clienteId, pontos, motivo }),

  // ── Resgate ───────────────────────────────────────────────

  resgatar: (clienteId: string, recompensaId: string) =>
    api.post<{ success: true; data: {
      resgate      : Resgate
      recompensa   : { id: string; nome: string }
      cliente      : { id: string; nome: string }
      pontosUsados : number
      saldoAnterior: number
      novoSaldo    : number
    } }>('/barbershop/fidelidade/resgatar', { clienteId, recompensaId }),
}