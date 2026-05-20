'use strict';

const repo = require('../../BarbershopRepository');

/**
 * Dashboard operacional — visão do dia a dia da barbearia.
 * Dados em tempo real para o dono/gerente na tela principal.
 */
async function execute(tenantId) {
  return repo.getDashboardData(tenantId);
}

module.exports = { execute };