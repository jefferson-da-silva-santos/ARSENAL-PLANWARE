'use strict';

const repo = require('../ErrorsRepository');

/**
 * Retorna o detalhe completo de um erro (inclui stack e requestBody).
 */
async function execute(id) {
  const error = await repo.findById(id);
  if (!error) {
    const err = new Error('Erro não encontrado');
    err.status = 404;
    throw err;
  }
  return error;
}

module.exports = { execute };