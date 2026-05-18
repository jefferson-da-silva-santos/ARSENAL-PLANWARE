'use strict';
const repo = require('../FiadoRepository');

async function execute(tenantId, id) {
  const existing = await repo.findClienteById(tenantId, id);
  if (!existing) throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });
  await repo.deleteCliente(tenantId, id);
  return { deleted: true, id };
}

module.exports = { execute };