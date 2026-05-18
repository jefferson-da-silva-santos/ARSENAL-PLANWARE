'use strict';

const repo = require('../ErrorsRepository');

/**
 * Reabre um erro marcado como resolvido.
 * Útil quando o erro volta a acontecer após uma "correção".
 */
async function execute(id) {
  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Erro não encontrado');
    err.status = 404;
    throw err;
  }

  if (!existing.resolved) {
    const err = new Error('Este erro já está aberto');
    err.status = 400;
    throw err;
  }

  return repo.unresolveOne(id);
}

module.exports = { execute };