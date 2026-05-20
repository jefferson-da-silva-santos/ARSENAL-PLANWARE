'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Desativa um serviço em vez de deletar fisicamente.
 * Serviços com agendamentos históricos não podem ser removidos
 * para manter a integridade dos registros financeiros.
 */
async function execute(tenantId, id) {
  const servico = await repo.findServico(tenantId, id);
  if (!servico) throw utils.notFound('Serviço não encontrado');

  // Desativa em vez de deletar — preserva integridade histórica
  await repo.toggleServico(tenantId, id, false);

  return { id, ativo: false };
}

module.exports = { execute };