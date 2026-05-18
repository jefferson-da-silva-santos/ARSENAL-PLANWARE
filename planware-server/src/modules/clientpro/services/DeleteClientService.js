'use strict';

const repo = require('../ClientProRepository');

async function execute(tenantId, id) {
  const client = await repo.findClientById(tenantId, id);

  if (!client) {
    throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });
  }

  await repo.deleteClient(tenantId, id);
  return { deleted: true, id };
}

module.exports = { execute };