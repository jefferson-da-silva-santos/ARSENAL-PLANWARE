'use strict';

const repo = require('../StockProRepository');
const { validateProduct, formatProduct } = require('../StockProUtils');

async function execute(tenantId, id, data) {
  const errors = validateProduct(data);
  if (errors.length) {
    const err = new Error(errors.join(', '));
    err.status = 400;
    throw err;
  }

  const existing = await repo.findProductById(tenantId, id);
  if (!existing) {
    const err = new Error('Produto não encontrado');
    err.status = 404;
    throw err;
  }

  // Se trocou o SKU, verifica conflito
  if (data.sku && data.sku !== existing.sku) {
    const skuConflict = await repo.findProductBySku(tenantId, data.sku);
    if (skuConflict) {
      const err = new Error(`SKU "${data.sku}" já está em uso neste tenant`);
      err.status = 409;
      throw err;
    }
  }

  await repo.updateProduct(tenantId, id, data);

  const updated = await repo.findProductById(tenantId, id);
  return formatProduct(updated);
}

module.exports = { execute };