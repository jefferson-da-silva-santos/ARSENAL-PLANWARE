'use strict';

// ── UpdateIncomeService ──────────────────────────────────────
const repo = require('../FinFlowRepository');
const { formatIncome } = require('../FinFlowUtils');

async function updateIncome(id, { description, amount, received }) {
  const entry = await repo.findIncomeById(id);
  if (!entry) throw Object.assign(new Error('Entrada não encontrada'), { status: 404 });

  const data = {};
  if (description !== undefined) data.description = description.trim();
  if (amount !== undefined) data.amount = parseFloat(amount);
  if (received !== undefined) data.received = Boolean(received);

  const updated = await repo.updateIncome(id, data);
  return formatIncome(updated);
}

module.exports = { execute: updateIncome };