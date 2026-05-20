'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Adiciona um cliente à fila presencial.
 *
 * Requer que o modo fila esteja habilitado nas configurações.
 * O cliente pode ser cadastrado ou eventual (só nome + telefone).
 * A posição é calculada automaticamente como último da fila atual.
 */
async function execute(tenantId, data) {
  const config = await repo.findConfig(tenantId);

  if (!config?.modoFila) {
    throw utils.badRequest('Modo fila não está habilitado nesta barbearia');
  }

  if (!data.clienteId && !data.nomeCliente) {
    throw utils.badRequest('Informe clienteId (cliente cadastrado) ou nomeCliente (cliente eventual)');
  }

  // Valida cliente cadastrado
  if (data.clienteId) {
    const cliente = await repo.findCliente(tenantId, data.clienteId);
    if (!cliente) throw utils.notFound('Cliente não encontrado');
    if (!cliente.ativo) throw utils.badRequest('Cliente está inativo');
  }

  // Valida barbeiro (se especificado)
  if (data.barbeiroId) {
    const barbeiro = await repo.findBarbeiro(tenantId, data.barbeiroId);
    if (!barbeiro) throw utils.notFound('Barbeiro não encontrado');
    if (!barbeiro.ativo) throw utils.badRequest('Barbeiro está inativo');
  }

  // Valida serviço (se especificado)
  if (data.servicoId) {
    const servico = await repo.findServico(tenantId, data.servicoId);
    if (!servico) throw utils.notFound('Serviço não encontrado');
    if (!servico.ativo) throw utils.badRequest('Serviço está inativo');
  }

  return repo.createFilaEntry(tenantId, {
    clienteId: data.clienteId || null,
    barbeiroId: data.barbeiroId || null,
    nomeCliente: data.nomeCliente || null,
    telefone: data.telefone || null,
    servicoId: data.servicoId || null,
  });
}

module.exports = { execute };