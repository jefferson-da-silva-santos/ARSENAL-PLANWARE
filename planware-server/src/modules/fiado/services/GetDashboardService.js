'use strict';
const repo = require('../FiadoRepository');

async function execute(tenantId) {
  return repo.getDashboard(tenantId);
}

module.exports = { execute };