'use strict';

const repo = require('../ErrorsRepository');

/**
 * Lista erros com filtros e paginação.
 * Se grouped=true, agrupa por fingerprint e ordena por frequência.
 */
async function execute(query) {
  const {
    module, tenantId, resolved, statusCode,
    from, to, q,
    page = 1,
    perPage = 50,
    grouped = 'false',
  } = query;

  const filters = { module, tenantId, resolved, statusCode, from, to, q };

  if (grouped === 'true') {
    const errors = await repo.findAllGrouped(filters);
    return { errors, total: errors.length, grouped: true };
  }

  const result = await repo.findAll(filters, { page, perPage });
  return { ...result, grouped: false };
}

module.exports = { execute };