'use strict';
const repo = require('../OrdemTechRepository');

async function execute(tenantId, id, { nome, telefone }) {
  if (!nome?.trim()) throw Object.assign(new Error('Nome é obrigatório'), { status: 400 });
  const existing = await repo.findClienteById(tenantId, id);
  if (!existing) throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });
  await repo.updateCliente(tenantId, id, { nome: nome.trim(), telefone: telefone?.trim() || null });
  return repo.findClienteById(tenantId, id);
}

module.exports = { execute };