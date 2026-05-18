'use strict';

const repo = require('../FinFlowRepository');
const { validatePercents, computeSummary, formatMonth, formatTransaction, formatIncome } = require('../FinFlowUtils');

async function execute(tenantId, year, month, { income, pct_essential, pct_personal, pct_savings }) {
  if (income !== undefined && income < 0) {
    const err = new Error('Renda não pode ser negativa');
    err.status = 400;
    throw err;
  }

  const hasPercents = pct_essential !== undefined || pct_personal !== undefined || pct_savings !== undefined;
  if (hasPercents && !validatePercents(pct_essential, pct_personal, pct_savings)) {
    const err = new Error('Os percentuais devem somar 100%');
    err.status = 400;
    throw err;
  }

  const monthRow = await repo.findOrCreateMonth(tenantId, year, month);

  const data = {};
  if (income !== undefined) data.income = income;
  if (pct_essential !== undefined) data.pctEssential = pct_essential;
  if (pct_personal !== undefined) data.pctPersonal = pct_personal;
  if (pct_savings !== undefined) data.pctSavings = pct_savings;

  const updated = await repo.updateMonth(monthRow.id, data);
  const transactions = await repo.findTransactionsByMonth(updated.id);
  const incomes = await repo.findIncomesByMonth(updated.id);
  const summary = computeSummary(updated, transactions, incomes);

  return {
    month: formatMonth(updated),
    transactions: transactions.map(formatTransaction),
    incomes: incomes.map(formatIncome),
    ...summary,
  };
}

module.exports = { execute };