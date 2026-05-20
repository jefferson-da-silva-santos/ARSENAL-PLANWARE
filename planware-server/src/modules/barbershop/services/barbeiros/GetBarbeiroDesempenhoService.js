'use strict';

/**
 * GetBarbeiroDesempenhoService.js
 *
 * Retorna métricas de desempenho de um barbeiro em um período:
 *  - faturamento total e por serviço
 *  - número de atendimentos
 *  - ticket médio
 *  - comissões geradas e repassadas
 *  - taxa de cancelamento e faltas
 *  - avaliação média
 *  - progresso em relação às metas mensais
 */

const prisma = require('../../../../db/client');
const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, barbeiroId, { de, ate } = {}) {
  if (!barbeiroId) throw utils.badRequest('barbeiroId é obrigatório');

  const barbeiro = await repo.findBarbeiro(tenantId, barbeiroId);
  if (!barbeiro) throw utils.notFound('Barbeiro não encontrado');

  // Período padrão: mês atual
  const hoje = new Date();
  const inicioPeriodo = de ? new Date(de) : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimPeriodo = ate ? new Date(ate) : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  const whereAgend = {
    tenantId,
    barbeiroId,
    dataHora: { gte: inicioPeriodo, lte: fimPeriodo },
  };

  const [
    atendimentos,
    cancelamentos,
    faltas,
    faturamento,
    comissoes,
    avaliacaoMedia,
    servicosMaisFeitos,
  ] = await Promise.all([

    prisma.barberAgendamento.count({ where: { ...whereAgend, status: 'CONCLUIDO' } }),
    prisma.barberAgendamento.count({ where: { ...whereAgend, status: 'CANCELADO' } }),
    prisma.barberAgendamento.count({ where: { ...whereAgend, status: 'FALTOU' } }),

    prisma.barberAgendamento.aggregate({
      where: { ...whereAgend, status: 'CONCLUIDO' },
      _sum: { valorCobrado: true },
    }),

    prisma.barberComissao.aggregate({
      where: {
        tenantId,
        barbeiroId,
        createdAt: { gte: inicioPeriodo, lte: fimPeriodo },
      },
      _sum: { valorComissao: true },
      _count: { id: true },
    }),

    repo.getMediaAvaliacaoBarbeiro(barbeiroId),

    // Serviços mais executados no período
    prisma.barberAgendamento.groupBy({
      by: ['servicoId'],
      where: { ...whereAgend, status: 'CONCLUIDO' },
      _count: { id: true },
      _sum: { valorCobrado: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  const totalFaturado = faturamento._sum.valorCobrado ?? 0;
  const totalAgend = atendimentos + cancelamentos + faltas;
  const taxaCancel = totalAgend > 0 ? ((cancelamentos / totalAgend) * 100).toFixed(1) : '0.0';
  const ticketMedio = atendimentos > 0 ? totalFaturado / atendimentos : 0;

  // Progresso das metas
  const progressoFaturamento = barbeiro.metaMensal
    ? Math.min((totalFaturado / barbeiro.metaMensal) * 100, 100).toFixed(1)
    : null;
  const progressoCortes = barbeiro.metaCortes
    ? Math.min((atendimentos / barbeiro.metaCortes) * 100, 100).toFixed(1)
    : null;

  return {
    barbeiro: utils.formatBarbeiro(barbeiro),
    periodo: { de: inicioPeriodo, ate: fimPeriodo },
    atendimentos: {
      concluidos: atendimentos,
      cancelados: cancelamentos,
      faltas,
      taxaCancelamento: parseFloat(taxaCancel),
    },
    financeiro: {
      totalFaturado: Math.round(totalFaturado * 100) / 100,
      ticketMedio: Math.round(ticketMedio * 100) / 100,
      totalComissao: Math.round((comissoes._sum.valorComissao ?? 0) * 100) / 100,
    },
    metas: {
      metaMensal: barbeiro.metaMensal,
      metaCortes: barbeiro.metaCortes,
      progressoFaturamento: progressoFaturamento ? parseFloat(progressoFaturamento) : null,
      progressoCortes: progressoCortes ? parseFloat(progressoCortes) : null,
    },
    avaliacao: avaliacaoMedia,
    servicosMaisFeitos: servicosMaisFeitos.map(s => ({
      servicoId: s.servicoId,
      quantidade: s._count.id,
      totalFaturado: s._sum.valorCobrado ?? 0,
    })),
  };
}

module.exports = { execute };