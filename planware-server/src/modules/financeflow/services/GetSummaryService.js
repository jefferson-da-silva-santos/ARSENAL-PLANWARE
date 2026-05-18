'use strict';

const repo = require('../FinanceFlowRepository');
const { computeSummary } = require('../FinanceFlowUtils');

async function execute(tenantId, year, month) {
  const monthRow = await repo.findMonthWithAll(tenantId, year, month);
  if (!monthRow) return { summary: null };

  const summary = computeSummary(monthRow.categories, monthRow.transactions, monthRow.incomes);
  return { summary };
}

module.exports = { execute };