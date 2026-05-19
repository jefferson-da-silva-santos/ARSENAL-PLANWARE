'use strict';
const repo = require('../BillingRepository');

// Marca todas as cobranças PENDING vencidas como OVERDUE
async function execute() {
  const count = await repo.markOverdueCharges();
  return { marked: count };
}
module.exports = { execute };
