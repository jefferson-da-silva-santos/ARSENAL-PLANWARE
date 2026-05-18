'use strict';

const repo                   = require('../FinVaultRepository');
const { normalizeTypeToDb }  = require('../FinVaultUtils');

async function execute(tenantId, type = 'expense') {
  const dbType = normalizeTypeToDb(type);
  if (!['INCOME', 'EXPENSE'].includes(dbType)) {
    const err = new Error('type deve ser "income" ou "expense"');
    err.status = 400;
    throw err;
  }

  return repo.getByCategory(tenantId, dbType);
}

module.exports = { execute };