'use strict';

const repo = require('../FinFlowRepository');
const { computeSummary, formatMonth, formatTransaction, formatIncome } = require('../FinFlowUtils');

async function execute(tenantId, year, month) {
  if (!year || month < 1 || month > 12) {
    const err = new Error('Ano ou mês inválido');
    err.status = 400;
    throw err;
  }

  const monthRow = await repo.findOrCreateMonth(tenantId, year, month);
  const transactions = await repo.findTransactionsByMonth(monthRow.id);
  const incomes = await repo.findIncomesByMonth(monthRow.id);
  const summary = computeSummary(monthRow, transactions, incomes);

  return {
    month: formatMonth(monthRow),
    transactions: transactions.map(formatTransaction),
    incomes: incomes.map(formatIncome),
    ...summary,
  };
}

module.exports = { execute };