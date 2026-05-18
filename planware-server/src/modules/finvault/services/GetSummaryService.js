'use strict';

const repo = require('../FinVaultRepository');

async function execute(tenantId, month) {
  if (!month || !/^(0[1-9]|1[0-2])$/.test(month)) {
    const err = new Error('month deve estar no formato MM (01-12)');
    err.status = 400;
    throw err;
  }

  return repo.getSummaryByMonth(tenantId, month);
}

module.exports = { execute };