'use strict';

const repo = require('../FinanceFlowRepository');
const { formatIncome } = require('../FinanceFlowUtils');

async function execute(id, { description, amount, received }) {
  const entry = await repo.findIncomeById(id);
  if (!entry) throw Object.assign(new Error('Entrada não encontrada'), { status: 404 });

  const data = {};
  if (description !== undefined) data.description = description;
  if (amount !== undefined) data.amount = parseFloat(amount);
  if (received !== undefined) data.received = Boolean(received);

  if (Object.keys(data).length === 0) {
    throw Object.assign(new Error('Nada para atualizar'), { status: 400 });
  }

  const updated = await repo.updateIncome(id, data);
  return formatIncome(updated);
}

module.exports = { execute };