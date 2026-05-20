'use strict';

const prisma = require('../../../../db/client');
const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Dashboard financeiro da barbearia para um período.
 * Padrão: mês atual.
 *
 * Retorna:
 *  - Faturamento bruto, comissões, despesas, lucro líquido
 *  - Ticket médio e quantidade de atendimentos
 *  - Faturamento por barbeiro
 *  - Faturamento por serviço
 *  - Comparativo com período anterior (variação %)
 */
async function execute(tenantId, { de, ate } = {}) {
  const hoje = new Date();
  const inicio = de ? new Date(de) : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = ate ? new Date(ate) : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  if (de && isNaN(inicio.getTime())) throw utils.badRequest('de inválido');
  if (ate && isNaN(fim.getTime())) throw utils.badRequest('ate inválido');

  // Período anterior equivalente para comparativo
  const diffMs = fim.getTime() - inicio.getTime();
  const inicioAnt = new Date(inicio.getTime() - diffMs - 1);
  const fimAnt = new Date(inicio.getTime() - 1);

  const [
    faturamento,
    faturamentoAnt,
    comissoes,
    despesas,
    porBarbeiro,
    porServico,
    fechamentos,
  ] = await Promise.all([

    prisma.barberAgendamento.aggregate({
      where: { tenantId, dataHora: { gte: inicio, lte: fim }, status: 'CONCLUIDO' },
      _sum: { valorCobrado: true },
      _count: { id: true },
    }),

    // Período anterior para comparativo
    prisma.barberAgendamento.aggregate({
      where: { tenantId, dataHora: { gte: inicioAnt, lte: fimAnt }, status: 'CONCLUIDO' },
      _sum: { valorCobrado: true },
    }),

    prisma.barberComissao.aggregate({
      where: { tenantId, createdAt: { gte: inicio, lte: fim } },
      _sum: { valorComissao: true },
    }),

    prisma.barberDespesa.aggregate({
      where: { tenantId, data: { gte: inicio, lte: fim } },
      _sum: { valor: true },
    }),

    // Faturamento agrupado por barbeiro
    prisma.barberAgendamento.groupBy({
      by: ['barbeiroId'],
      where: { tenantId, dataHora: { gte: inicio, lte: fim }, status: 'CONCLUIDO' },
      _sum: { valorCobrado: true },
      _count: { id: true },
      orderBy: { _sum: { valorCobrado: 'desc' } },
    }),

    // Faturamento agrupado por serviço
    prisma.barberAgendamento.groupBy({
      by: ['servicoId'],
      where: { tenantId, dataHora: { gte: inicio, lte: fim }, status: 'CONCLUIDO' },
      _sum: { valorCobrado: true },
      _count: { id: true },
      orderBy: { _sum: { valorCobrado: 'desc' } },
      take: 10,
    }),

    repo.findFechamentos(tenantId, {
      de: inicio.toISOString(),
      ate: fim.toISOString(),
    }),
  ]);

  const round = (v) => Math.round((v ?? 0) * 100) / 100;

  const totalFaturado = round(faturamento._sum.valorCobrado);
  const totalAnt = round(faturamentoAnt._sum.valorCobrado ?? 0);
  const totalComissoes = round(comissoes._sum.valorComissao ?? 0);
  const totalDespesas = round(despesas._sum.valor ?? 0);
  const lucroLiquido = round(totalFaturado - totalComissoes - totalDespesas);
  const atendimentos = faturamento._count.id ?? 0;
  const ticketMedio = atendimentos > 0 ? round(totalFaturado / atendimentos) : 0;
  const variacaoFat = totalAnt > 0
    ? round(((totalFaturado - totalAnt) / totalAnt) * 100)
    : null;

  return {
    periodo: { de: inicio, ate: fim },
    totalFaturado,
    totalComissoes,
    totalDespesas,
    lucroLiquido,
    atendimentos,
    ticketMedio,
    variacaoFaturamento: variacaoFat,   // % vs período anterior
    porBarbeiro: porBarbeiro.map(b => ({
      barbeiroId: b.barbeiroId,
      faturamento: round(b._sum.valorCobrado ?? 0),
      atendimentos: b._count.id,
    })),
    porServico: porServico.map(s => ({
      servicoId: s.servicoId,
      faturamento: round(s._sum.valorCobrado ?? 0),
      atendimentos: s._count.id,
    })),
    fechamentos,
  };
}

module.exports = { execute };