'use strict';
const repo = require('../OrdemTechRepository');

async function execute(tenantId, { nome, telefone }) {
  if (!nome?.trim()) throw Object.assign(new Error('Nome é obrigatório'), { status: 400 });
  const existing = await repo.findClienteByNome(tenantId, nome.trim());
  if (existing) throw Object.assign(new Error('Já existe um cliente com esse nome'), { status: 409 });
  return repo.createCliente(tenantId, { nome: nome.trim(), telefone: telefone?.trim() || null });
}

module.exports = { execute };