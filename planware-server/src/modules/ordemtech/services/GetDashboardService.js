'use strict';

const repo = require('../OrdemTechRepository');
const { formatOrdem } = require('../OrdemTechUtils');

async function execute(tenantId) {
  const data = await repo.getDashboard(tenantId);

  // FIX: recentes vêm do Prisma com campos camelCase e sem formatação
  // O frontend espera cliente_nome, criado_em, etc. (snake_case via formatOrdem)
  return {
    stats:    data.stats,
    recentes: data.recentes.map(formatOrdem),
  };
}

module.exports = { execute };