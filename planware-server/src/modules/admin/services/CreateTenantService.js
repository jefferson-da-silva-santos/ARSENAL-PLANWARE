'use strict';

const repo = require('../AdminRepository');
const { slugify } = require('../AdminUtils');

async function execute({ name }) {
  if (!name || !name.trim()) {
    const err = new Error('name é obrigatório');
    err.status = 400;
    throw err;
  }

  const slug = slugify(name.trim());

  const existing = await repo.findTenantBySlug(slug);
  if (existing) {
    const err = new Error(`Já existe um tenant com o slug "${slug}"`);
    err.status = 409;
    throw err;
  }

  return repo.createTenant({ name: name.trim(), slug });
}

module.exports = { execute };