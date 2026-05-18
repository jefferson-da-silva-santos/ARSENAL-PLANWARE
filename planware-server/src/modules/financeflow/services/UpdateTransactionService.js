'use strict';

const repo = require('../FinanceFlowRepository');
const { formatTransaction } = require('../FinanceFlowUtils');

const ALLOWED_FIELDS = ['description', 'amount', 'payment_method', 'payment_type', 'category_id', 'due_date', 'paid'];

async function execute(tenantId, id, body) {
  const tx = await repo.findTransactionById(id);
  if (!tx) throw Object.assign(new Error('Transação não encontrada'), { status: 404 });

  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in body) {
      if (key === 'paid') data.paid = Boolean(body[key]);
      else if (key === 'amount') data.amount = parseFloat(body[key]);
      else if (key === 'category_id') data.categoryId = body[key] || null;
      else if (key === 'due_date') data.dueDate = body[key] || null;
      else if (key === 'payment_method') data.paymentMethod = body[key];
      else if (key === 'payment_type') data.paymentType = body[key];
      else data[key] = body[key];
    }
  }

  if (Object.keys(data).length === 0) {
    throw Object.assign(new Error('Nenhum campo válido para atualizar'), { status: 400 });
  }

  const updated = await repo.updateTransaction(id, data);
  return formatTransaction(updated);
}

module.exports = { execute };