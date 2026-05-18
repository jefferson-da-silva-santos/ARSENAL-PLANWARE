'use strict';

const repo = require('../ErrorsRepository');

/**
 * Remove um erro ou todos de um grupo (fingerprint).
 * Usado para limpar ruído — erros irrelevantes ou já tratados.
 */
async function execute(id, fingerprint) {
  if (fingerprint) {
    const result = await repo.deleteByFingerprint(fingerprint);
    return { deleted: result.count, fingerprint };
  }

  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Erro não encontrado');
    err.status = 404;
    throw err;
  }

  await repo.deleteOne(id);
  return { deleted: 1, id };
}

module.exports = { execute };