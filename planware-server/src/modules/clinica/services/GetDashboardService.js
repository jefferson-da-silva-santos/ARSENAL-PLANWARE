'use strict';

const repo = require('../ClinicaRepository');

async function execute(tenantId) {
  return repo.getDashboard(tenantId);
}

module.exports = { execute };