'use strict';

const repo = require('../FinVaultRepository');
const { validateTransaction, normalizeTypeToDb, formatTransaction } = require('../FinVaultUtils');

async function execute(tenantId, data) {
  const errors = validateTransaction(data);
  if (errors.length) {
    const err = new Error(errors.join(', '));
    err.status = 400;
    throw err;
  }

  const tx = await repo.createTransaction(tenantId, {
    type: normalizeTypeToDb(data.type),
    amount: Number(data.amount),
    category: data.category ?? null,
    description: data.description ?? null,
    date: data.date,
  });

  return formatTransaction(tx);
}

module.exports = { execute };