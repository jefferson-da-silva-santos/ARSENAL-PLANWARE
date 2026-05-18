'use strict';

const repo = require('../FinanceFlowRepository');

async function execute(tenantId, fcMonthId, categories) {
  if (!Array.isArray(categories)) {
    throw Object.assign(new Error('categories deve ser um array'), { status: 400 });
  }
  if (categories.length > 6) {
    throw Object.assign(new Error('Máximo de 6 categorias por mês'), { status: 400 });
  }

  const totalPct = categories.reduce((s, c) => s + (parseFloat(c.percentage) || 0), 0);
  if (totalPct > 100.01) {
    throw Object.assign(
      new Error(`Total de porcentagens (${totalPct.toFixed(1)}%) excede 100%`),
      { status: 400 }
    );
  }

  const updated = await repo.replaceCategories(fcMonthId, categories);
  return { categories: updated };
}

module.exports = { execute };