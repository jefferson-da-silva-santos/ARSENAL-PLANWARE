'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Adiciona pontos de fidelidade manualmente a um cliente.
 * O fluxo automático ocorre via ConcluirAgendamentoService.
 * Este service é para ajustes manuais pelo operador.
 */
async function execute(tenantId, clienteId, { pontos, motivo } = {}) {
  if (!clienteId) throw utils.badRequest('clienteId é obrigatório');

  const qtd = parseInt(pontos);
  if (isNaN(qtd) || qtd <= 0) {
    throw utils.badRequest('pontos deve ser um inteiro positivo');
  }

  const cliente = await repo.findCliente(tenantId, clienteId);
  if (!cliente) throw utils.notFound('Cliente não encontrado');
  if (!cliente.ativo) throw utils.badRequest('Cliente está inativo');

  await repo.adicionarPontosCliente(clienteId, qtd);

  return {
    clienteId,
    pontosAdicionados: qtd,
    novoSaldo: cliente.pontosFidelidade + qtd,
    motivo: motivo || 'Ajuste manual',
  };
}

module.exports = { execute };