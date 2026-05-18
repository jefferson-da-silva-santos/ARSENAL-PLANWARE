'use strict';

const repo = require('../FinanceFlowRepository');

async function execute(id) {
  const entry = await repo.findIncomeById(id);
  if (!entry) throw Object.assign(new Error('Entrada não encontrada'), { status: 404 });
  await repo.deleteIncome(id);
  return { deleted: true, id };
}

module.exports = { execute };