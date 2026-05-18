'use strict';

const repo = require('../FinFlowRepository');
const { computeSummary, formatMonth, formatTransaction, formatIncome } = require('../FinFlowUtils');

async function execute(tenantId, year) {
  const months = [];

  for (let m = 1; m <= 12; m++) {
    const monthRow = await repo.findOrCreateMonth(tenantId, year, m);

    // Só retorna dados completos se o mês tem registro real
    const transactions = await repo.findTransactionsByMonth(monthRow.id);
    const incomes = await repo.findIncomesByMonth(monthRow.id);
    const summary = computeSummary(monthRow, transactions, incomes);

    months.push({
      month: formatMonth(monthRow),
      transactions: transactions.map(formatTransaction),
      incomes: incomes.map(formatIncome),
      ...summary,
    });
  }

  return months;
}

module.exports = { execute };