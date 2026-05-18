'use strict';

const repo = require('../FinFlowRepository');
const { validateCategory, normalizeCategoryToDb, formatTransaction } = require('../FinFlowUtils');

async function execute(tenantId, id, body) {
  const tx = await repo.findTransactionById(id);
  if (!tx) throw Object.assign(new Error('Transação não encontrada'), { status: 404 });

  const { description, amount, payment_method, payment_type, category, due_date, paid } = body;

  if (category && !validateCategory(category)) {
    throw Object.assign(new Error('Categoria inválida'), { status: 400 });
  }
  if (amount !== undefined && amount <= 0) {
    throw Object.assign(new Error('Valor deve ser positivo'), { status: 400 });
  }

  const data = {};
  if (description !== undefined) data.description = description;
  if (amount !== undefined) data.amount = amount;
  if (payment_method !== undefined) data.paymentMethod = payment_method;
  if (payment_type !== undefined) data.paymentType = payment_type;
  if (category !== undefined) data.category = normalizeCategoryToDb(category);
  if (due_date !== undefined) data.dueDate = due_date ? new Date(due_date) : null;
  if (paid !== undefined) data.paid = Boolean(paid);

  const updated = await repo.updateTransaction(id, data);
  return formatTransaction(updated);
}

module.exports = { execute };