'use strict';

const repo = require('../FinanceFlowRepository');
const { computeSummary, formatTransaction, formatIncome } = require('../FinanceFlowUtils');

async function execute(tenantId, year, month) {
  if (!year || month < 1 || month > 12) {
    throw Object.assign(new Error('Ano ou mês inválido'), { status: 400 });
  }

  let monthRow = await repo.findMonthWithAll(tenantId, year, month);
  if (!monthRow) {
    await repo.findOrCreateMonth(tenantId, year, month);
    monthRow = await repo.findMonthWithAll(tenantId, year, month);
  }

  return {
    month: { id: monthRow.id, year: monthRow.year, month: monthRow.month },
    categories: monthRow.categories,
    transactions: monthRow.transactions.map(formatTransaction),
    incomes: monthRow.incomes.map(formatIncome),
  };
}

module.exports = { execute };