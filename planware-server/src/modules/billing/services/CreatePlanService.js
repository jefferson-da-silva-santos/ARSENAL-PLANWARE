'use strict';
const repo = require('../BillingRepository');

async function execute({ name, description, price, systems }) {
  if (!name?.trim())       throw Object.assign(new Error('name é obrigatório'), { status: 400 });
  if (price == null || isNaN(price)) throw Object.assign(new Error('price é obrigatório'), { status: 400 });
  return repo.createPlan({ name: name.trim(), description, price: parseFloat(price), systems: systems || [] });
}
module.exports = { execute };
