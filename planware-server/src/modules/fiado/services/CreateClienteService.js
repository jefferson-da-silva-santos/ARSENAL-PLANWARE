'use strict';
const repo = require('../FiadoRepository');
const { validateCliente } = require('../FiadoUtils');

async function execute(tenantId, body) {
  const error = validateCliente(body);
  if (error) throw Object.assign(new Error(error), { status: 400 });
  const { nome, telefone, email, observacao } = body;
  return repo.createCliente(tenantId, { nome: nome.trim(), telefone, email, observacao });
}

module.exports = { execute };