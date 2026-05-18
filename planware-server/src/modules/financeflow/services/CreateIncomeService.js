'use strict';

const repo = require('../FinanceFlowRepository');
const { formatIncome } = require('../FinanceFlowUtils');

async function execute(tenantId, { year, month, description, amount, received }) {
  if (!description || !amount || !year || !month) {
    throw Object.assign(new Error('Campos obrigatórios: description, amount, year, month'), { status: 400 });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw Object.assign(new Error('Valor inválido'), { status: 400 });
  }

  const monthRow = await repo.findOrCreateMonth(tenantId, parseInt(year), parseInt(month));

  const income = await repo.createIncome({
    fcMonthId: monthRow.id,
    description,
    amount: parsedAmount,
    received: Boolean(received),
  });

  return formatIncome(income);
}

module.exports = { execute };