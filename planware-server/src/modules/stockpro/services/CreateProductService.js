'use strict';

const repo = require('../StockProRepository');
const { validateProduct, formatProduct } = require('../StockProUtils');

async function execute(tenantId, data) {
  const errors = validateProduct(data);
  if (errors.length) {
    const err = new Error(errors.join(', '));
    err.status = 400;
    throw err;
  }

  // SKU único por tenant
  if (data.sku) {
    const existing = await repo.findProductBySku(tenantId, data.sku);
    if (existing) {
      const err = new Error(`SKU "${data.sku}" já está em uso neste tenant`);
      err.status = 409;
      throw err;
    }
  }

  const product = await repo.createProduct(tenantId, data);
  return formatProduct(product);
}

module.exports = { execute };