'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Cadastra um novo cliente na barbearia.
 * Verifica duplicidade por telefone dentro do mesmo tenant.
 */
async function execute(tenantId, data) {
  if (!data.nome?.trim()) throw utils.badRequest('nome é obrigatório');

  if (data.telefone) {
    const existente = await repo.findClienteByTelefone(tenantId, data.telefone);
    if (existente) {
      throw utils.conflict('Já existe um cliente cadastrado com este telefone');
    }
  }

  const cliente = await repo.createCliente(tenantId, {
    nome: data.nome.trim(),
    telefone: data.telefone || null,
    email: data.email || null,
    dataNascimento: data.dataNascimento || null,
    observacoes: data.observacoes || null,
  });

  return utils.formatCliente(cliente);
}

module.exports = { execute };