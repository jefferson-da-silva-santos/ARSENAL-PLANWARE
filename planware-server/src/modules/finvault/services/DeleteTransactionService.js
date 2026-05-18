'use strict';

const repo = require('../FinVaultRepository');

async function execute(tenantId, id) {
  if (!id) {
    const err = new Error('id é obrigatório');
    err.status = 400;
    throw err;
  }

  await repo.deleteTransaction(tenantId, id);
  return { success: true };
}

module.exports = { execute };