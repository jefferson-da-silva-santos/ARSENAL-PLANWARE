'use strict';

const repo = require('../ErrorsRepository');

/**
 * Marca um erro como resolvido.
 * Se `fingerprint` for fornecido no body, resolve TODOS os erros
 * do mesmo grupo de uma vez — ideal para erros repetidos.
 */
async function execute(id, { resolution, fingerprint, resolvedBy }) {
  if (fingerprint) {
    const result = await repo.resolveByFingerprint(fingerprint, { resolvedBy, resolution });
    return { resolved: result.count, fingerprint };
  }

  // Verifica se existe antes de atualizar
  const existing = await repo.findById(id);
  if (!existing) {
    const err = new Error('Erro não encontrado');
    err.status = 404;
    throw err;
  }

  return repo.resolveOne(id, { resolvedBy, resolution });
}

module.exports = { execute };