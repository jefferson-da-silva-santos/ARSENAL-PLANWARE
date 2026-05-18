'use strict';

const repo = require('../StockProRepository');
const { validateMovement, formatMovement } = require('../StockProUtils');

async function execute(tenantId, data) {
  const errors = validateMovement(data);
  if (errors.length) {
    const err = new Error(errors.join(', '));
    err.status = 400;
    throw err;
  }

  const movement = await repo.registerMovement(tenantId, {
    productId: data.product_id,
    type: data.type,
    quantity: Number(data.quantity),
    reason: data.reason,
  });

  return formatMovement(movement);
}

module.exports = { execute };