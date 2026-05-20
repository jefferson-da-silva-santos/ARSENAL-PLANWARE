'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Chama o próximo cliente da fila (primeiro AGUARDANDO).
 * Atualiza o status para CHAMADO e registra o horário.
 */
async function execute(tenantId) {
  const fila = await repo.findFilaAtual(tenantId);
  const proximo = fila.find(f => f.status === 'AGUARDANDO');

  if (!proximo) {
    throw utils.notFound('Nenhum cliente aguardando na fila');
  }

  await repo.updateFilaStatus(tenantId, proximo.id, 'CHAMADO');

  return {
    id: proximo.id,
    posicao: proximo.posicao,
    nomeCliente: proximo.cliente?.nome ?? proximo.nomeCliente,
    telefone: proximo.cliente?.telefone ?? proximo.telefone,
    servicoId: proximo.servicoId,
    status: 'CHAMADO',
    chamadoEm: new Date().toISOString(),
  };
}

module.exports = { execute };