'use strict';

const repo = require('../StockProRepository');

async function execute(tenantId) {
  return repo.getDashboard(tenantId);
}

module.exports = { execute };