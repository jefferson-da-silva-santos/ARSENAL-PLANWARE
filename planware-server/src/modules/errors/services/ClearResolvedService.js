'use strict';

const repo = require('../ErrorsRepository');

/**
 * Apaga erros JÁ RESOLVIDOS mais antigos que N dias.
 * Usado para higiene periódica do banco — evita acúmulo infinito.
 * Padrão: 30 dias.
 */
async function execute(days = 30) {
  const d = parseInt(days);
  if (isNaN(d) || d < 1 || d > 365) {
    const err = new Error('days deve ser um número entre 1 e 365');
    err.status = 400;
    throw err;
  }

  const result = await repo.clearResolved(d);
  return { deleted: result.count, olderThanDays: d };
}

module.exports = { execute };