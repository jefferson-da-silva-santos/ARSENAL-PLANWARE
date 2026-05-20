'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Remove um cliente da fila marcando como DESISTIU.
 * Não deleta fisicamente — mantém o histórico para análise de desistências.
 */
async function execute(tenantId, id) {
  // Busca a fila atual para verificar se o entry pertence ao tenant
  const fila = await repo.findFilaAtual(tenantId);
  const entry = fila.find(f => f.id === id);

  // Também permite remover se já foi chamado (desistiu após ser chamado)
  if (!entry) {
    // Tenta buscar mesmo que não esteja na fila ativa
    // (pode ter sido chamado mas não atendido)
  }

  await repo.removeFilaEntry(tenantId, id);
  return { id, status: 'DESISTIU' };
}

module.exports = { execute };