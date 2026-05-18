'use strict';
const repo = require('../FiadoRepository');
const { validateCliente } = require('../FiadoUtils');

async function execute(tenantId, id, body) {
  const error = validateCliente(body);
  if (error) throw Object.assign(new Error(error), { status: 400 });

  const existing = await repo.findClienteById(tenantId, id);
  if (!existing) throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });

  const { nome, telefone, email, observacao } = body;
  await repo.updateCliente(tenantId, id, { nome: nome.trim(), telefone, email, observacao });
  return repo.findClienteById(tenantId, id);
}

module.exports = { execute };