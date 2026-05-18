'use strict';

const repo = require('../FinVaultRepository');
const { buildAlerts } = require('../FinVaultUtils');

async function execute(tenantId) {
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  const [globalBalance, monthly] = await Promise.all([
    repo.getGlobalBalance(tenantId),
    repo.getSummaryByMonth(tenantId, currentMonth),
  ]);

  return buildAlerts({ globalBalance, monthly });
}

module.exports = { execute };