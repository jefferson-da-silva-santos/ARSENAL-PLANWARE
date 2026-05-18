'use strict';
const repo = require('../OrdemTechRepository');

async function execute(tenantId, id) {
  const existing = await repo.findOrdemById(tenantId, id);
  if (!existing) throw Object.assign(new Error('Ordem não encontrada'), { status: 404 });
  await repo.deleteOrdem(tenantId, id);
  return { deleted: true, id };
}

module.exports = { execute };