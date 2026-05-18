'use strict';

const repo = require('../ClientProRepository');
const { formatClient } = require('../ClientProUtils');

async function execute(tenantId, id, data) {
  if (!data.nome?.trim()) {
    throw Object.assign(new Error('Nome é obrigatório'), { status: 400 });
  }

  const result = await repo.updateClient(tenantId, id, data);

  if (result.count === 0) {
    throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });
  }

  const updated = await repo.findClientById(tenantId, id);
  return formatClient(updated);
}

module.exports = { execute };