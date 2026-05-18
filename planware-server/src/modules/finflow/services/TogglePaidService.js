'use strict';

const repo = require('../FinFlowRepository');

async function execute(id) {
  const tx = await repo.findTransactionById(id);
  if (!tx) throw Object.assign(new Error('Transação não encontrada'), { status: 404 });

  const updated = await repo.togglePaid(id, !tx.paid);
  return { id: updated.id, paid: updated.paid };
}

module.exports = { execute };