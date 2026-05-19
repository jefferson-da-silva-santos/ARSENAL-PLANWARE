'use strict';
const repo = require('../BillingRepository');

async function execute(id, data) {
  const plan = await repo.findPlanById(id);
  if (!plan) throw Object.assign(new Error('Plano não encontrado'), { status: 404 });

  const payload = {};
  if (data.name        !== undefined) payload.name        = data.name.trim();
  if (data.description !== undefined) payload.description = data.description;
  if (data.price       !== undefined) payload.price       = parseFloat(data.price);
  if (data.systems     !== undefined) payload.systems     = data.systems;
  if (data.active      !== undefined) payload.active      = data.active;

  return repo.updatePlan(id, payload);
}
module.exports = { execute };
