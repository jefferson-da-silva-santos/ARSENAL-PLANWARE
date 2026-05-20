'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, id, data) {
  const cliente = await repo.findCliente(tenantId, id);
  if (!cliente) throw utils.notFound('Cliente não encontrado');

  // Se está mudando o telefone, verifica duplicidade
  if (data.telefone && data.telefone !== cliente.telefone) {
    const existente = await repo.findClienteByTelefone(tenantId, data.telefone);
    if (existente && existente.id !== id) {
      throw utils.conflict('Este telefone já pertence a outro cliente');
    }
  }

  const payload = {};
  if (data.nome !== undefined) payload.nome = data.nome.trim();
  if (data.telefone !== undefined) payload.telefone = data.telefone;
  if (data.email !== undefined) payload.email = data.email;
  if (data.dataNascimento !== undefined) payload.dataNascimento = data.dataNascimento;
  if (data.observacoes !== undefined) payload.observacoes = data.observacoes;
  if (data.ativo !== undefined) payload.ativo = data.ativo;

  await repo.updateCliente(tenantId, id, payload);
  const atualizado = await repo.findCliente(tenantId, id);
  return utils.formatCliente(atualizado);
}

module.exports = { execute };