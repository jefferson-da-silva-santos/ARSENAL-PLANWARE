'use strict';
const repo   = require('../BillingRepository');
const prisma = require('../../../db/client');

const VALID_TYPES = ['MONTHLY', 'ANNUAL', 'LIFETIME', 'CUSTOM'];

async function execute(tenantId, { planId, type, startedAt, renewsAt, notes }) {
  if (!tenantId) throw Object.assign(new Error('tenantId é obrigatório'), { status: 400 });
  if (!planId)   throw Object.assign(new Error('planId é obrigatório'),   { status: 400 });

  if (type && !VALID_TYPES.includes(type)) {
    throw Object.assign(new Error(`type inválido. Válidos: ${VALID_TYPES.join(', ')}`), { status: 400 });
  }

  const [tenant, plan] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    repo.findPlanById(planId),
  ]);

  if (!tenant) throw Object.assign(new Error('Tenant não encontrado'), { status: 404 });
  if (!plan)   throw Object.assign(new Error('Plano não encontrado'),  { status: 404 });

  return repo.upsertTenantPlan(tenantId, { planId, type, startedAt, renewsAt, notes });
}
module.exports = { execute };
