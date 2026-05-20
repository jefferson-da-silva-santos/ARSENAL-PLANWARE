'use strict';

const prisma = require('../../../../db/client');
const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Fecha o caixa de um dia específico.
 *
 * Agrega automaticamente:
 *  - Faturamento dos agendamentos CONCLUIDOS no dia
 *  - Comissões geradas no dia
 *  - Despesas lançadas no dia
 *  - Calcula lucro líquido
 *
 * Impede duplicidade: só um fechamento por tenant/dia.
 */
async function execute(tenantId, { data: dataStr, observacoes } = {}) {
  const dia = dataStr || new Date().toISOString().split('T')[0];

  // Valida formato da data
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) {
    throw utils.badRequest('data deve estar no formato YYYY-MM-DD');
  }

  // Impede fechar dia futuro
  const dataFechamento = new Date(dia + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(23, 59, 59, 999);
  if (dataFechamento > hoje) {
    throw utils.badRequest('Não é possível fechar o caixa de um dia futuro');
  }

  // Verifica duplicidade
  const existente = await repo.findFechamentoPorData(tenantId, dia);
  if (existente) {
    throw utils.conflict(`Já existe um fechamento de caixa para ${dia}`);
  }

  const inicioDia = new Date(dia + 'T00:00:00');
  const fimDia = new Date(dia + 'T23:59:59');

  // Agrega os dados do dia em paralelo
  const [faturamento, comissoes, despesas] = await Promise.all([
    prisma.barberAgendamento.aggregate({
      where: { tenantId, dataHora: { gte: inicioDia, lte: fimDia }, status: 'CONCLUIDO' },
      _sum: { valorCobrado: true },
      _count: { id: true },
    }),
    prisma.barberComissao.aggregate({
      where: { tenantId, createdAt: { gte: inicioDia, lte: fimDia } },
      _sum: { valorComissao: true },
    }),
    prisma.barberDespesa.aggregate({
      where: { tenantId, data: { gte: inicioDia, lte: fimDia } },
      _sum: { valor: true },
    }),
  ]);

  const totalFaturado = faturamento._sum.valorCobrado ?? 0;
  const totalComissoes = comissoes._sum.valorComissao ?? 0;
  const totalDespesas = despesas._sum.valor ?? 0;
  const totalLiquido = totalFaturado - totalComissoes - totalDespesas;

  // Arredonda para evitar problemas de ponto flutuante
  const round = (v) => Math.round(v * 100) / 100;

  return repo.createFechamento(tenantId, {
    data: inicioDia,
    totalFaturado: round(totalFaturado),
    totalComissoes: round(totalComissoes),
    totalDespesas: round(totalDespesas),
    totalLiquido: round(totalLiquido),
    qtdAtendimentos: faturamento._count.id ?? 0,
    observacoes: observacoes || null,
  });
}

module.exports = { execute };