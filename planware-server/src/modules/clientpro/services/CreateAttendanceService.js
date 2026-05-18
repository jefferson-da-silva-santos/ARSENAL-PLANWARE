'use strict';

const repo = require('../ClientProRepository');

async function execute(tenantId, clientId, { descricao, data }) {
  if (!descricao?.trim()) {
    throw Object.assign(new Error('Descrição é obrigatória'), { status: 400 });
  }

  // Garante que o cliente pertence ao tenant
  const client = await repo.findClientById(tenantId, clientId);
  if (!client) {
    throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });
  }

  return repo.createAttendance(clientId, { descricao, data });
}

module.exports = { execute };