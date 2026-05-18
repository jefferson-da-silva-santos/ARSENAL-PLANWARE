'use strict';
const repo = require('../OrdemTechRepository');
const { validateStatus, normalizeStatus, formatOrdem } = require('../OrdemTechUtils');

async function execute(tenantId, id, status) {
  if (!validateStatus(status)) {
    throw Object.assign(new Error('Status inválido. Use: em_andamento, pronto, cancelado'), { status: 400 });
  }
  const existing = await repo.findOrdemById(tenantId, id);
  if (!existing) throw Object.assign(new Error('Ordem não encontrada'), { status: 404 });

  await repo.updateOrdem(tenantId, id, { status: normalizeStatus(status) });
  return formatOrdem(await repo.findOrdemById(tenantId, id));
}

module.exports = { execute };