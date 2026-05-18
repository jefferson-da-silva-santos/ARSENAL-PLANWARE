'use strict';

const repo = require('../FinFlowRepository');
const { formatIncome } = require('../FinFlowUtils');

async function execute(tenantId, { year, month, description, amount, received }) {
  if (!description?.trim()) throw Object.assign(new Error('Descrição obrigatória'), { status: 400 });
  if (!amount || amount <= 0) throw Object.assign(new Error('Valor deve ser positivo'), { status: 400 });
  if (!year || !month) throw Object.assign(new Error('Ano e mês obrigatórios'), { status: 400 });

  const monthRow = await repo.findOrCreateMonth(tenantId, year, month);

  const income = await repo.createIncome({
    flowMonthId: monthRow.id,
    description: description.trim(),
    amount: parseFloat(amount),
    received: received ? true : false,
  });

  return formatIncome(income);
}

module.exports = { execute };