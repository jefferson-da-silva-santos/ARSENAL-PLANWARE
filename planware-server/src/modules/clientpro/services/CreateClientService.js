'use strict';

const repo = require('../ClientProRepository');
const { formatClient } = require('../ClientProUtils');

async function execute(tenantId, { nome, telefone, email, endereco, observacoes }) {
  if (!nome?.trim()) {
    throw Object.assign(new Error('Nome é obrigatório'), { status: 400 });
  }

  const client = await repo.createClient(tenantId, { nome, telefone, email, endereco, observacoes });
  return formatClient(client);
}

module.exports = { execute };