'use strict';

const repo = require('../FinFlowRepository');

async function execute(id, deleteAll = false) {
  const tx = await repo.findTransactionById(id);
  if (!tx) throw Object.assign(new Error('Transação não encontrada'), { status: 404 });

  if (tx.isInstallment && tx.installmentGroupId && deleteAll) {
    const result = await repo.deleteTransactionsByGroup(tx.installmentGroupId);
    return { deleted: result.count };
  }

  await repo.deleteTransaction(id);
  return { deleted: 1 };
}

module.exports = { execute };