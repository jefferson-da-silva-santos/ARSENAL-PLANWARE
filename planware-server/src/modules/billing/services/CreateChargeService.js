'use strict';
const repo   = require('../BillingRepository');
const prisma = require('../../../db/client');

const VALID_TYPES = ['SUBSCRIPTION', 'SETUP', 'EXTRA', 'CUSTOM'];

async function execute({ tenantId, description, amount, dueDate, type, notes }) {
  if (!tenantId)    throw Object.assign(new Error('tenantId é obrigatório'),    { status: 400 });
  if (!description) throw Object.assign(new Error('description é obrigatória'), { status: 400 });
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
    throw Object.assign(new Error('amount deve ser um valor positivo'), { status: 400 });
  if (!dueDate)     throw Object.assign(new Error('dueDate é obrigatório'),     { status: 400 });

  if (type && !VALID_TYPES.includes(type)) {
    throw Object.assign(new Error(`type inválido. Válidos: ${VALID_TYPES.join(', ')}`), { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw Object.assign(new Error('Tenant não encontrado'), { status: 404 });

  return repo.createCharge({
    tenantId,
    description: description.trim(),
    amount: parseFloat(amount),
    dueDate,
    type:  type  || 'SUBSCRIPTION',
    notes: notes || null,
  });
}
module.exports = { execute };
