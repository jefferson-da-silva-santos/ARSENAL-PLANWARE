'use strict';

const repo = require('../StockProRepository');

async function execute(tenantId, id) {
  const product = await repo.findProductById(tenantId, id);
  if (!product) {
    const err = new Error('Produto não encontrado');
    err.status = 404;
    throw err;
  }

  await repo.softDeleteProduct(tenantId, id);
  return { deleted: true, id };
}

module.exports = { execute };