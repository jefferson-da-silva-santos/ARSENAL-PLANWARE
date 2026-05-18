'use strict';

const repo = require('../ErrorsRepository');

/**
 * Lista todas as ocorrências de um mesmo erro (mesmo fingerprint).
 * Usado no painel ao clicar em "Ver X ocorrências".
 */
async function execute(fingerprint, { page = 1, perPage = 20 } = {}) {
  if (!fingerprint) {
    const err = new Error('fingerprint é obrigatório');
    err.status = 400;
    throw err;
  }
  return repo.findByFingerprint(fingerprint, { page, perPage });
}

module.exports = { execute };