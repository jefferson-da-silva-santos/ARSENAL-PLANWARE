'use strict';
const repo = require('../BillingRepository');

async function execute(id) {
  const charge = await repo.findChargeById(id);
  if (!charge) throw Object.assign(new Error('Cobrança não encontrada'), { status: 404 });
  if (charge.status === 'PAID')
    throw Object.assign(new Error('Não é possível cancelar uma cobrança já paga'), { status: 400 });

  return repo.updateChargeStatus(id, 'CANCELLED');
}
module.exports = { execute };
