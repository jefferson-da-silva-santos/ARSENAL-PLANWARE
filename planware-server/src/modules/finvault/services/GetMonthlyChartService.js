'use strict';

const repo = require('../FinVaultRepository');

async function execute(tenantId) {
  return repo.getMonthlyEvolution(tenantId);
}

module.exports = { execute };