'use strict';
const repo = require('../FiadoRepository');

async function execute(id) {
  const conta = await repo.findContaById(id);
  if (!conta) throw Object.assign(new Error('Conta não encontrada'), { status: 404 });
  await repo.deleteConta(id);
  return { deleted: true, id };
}

module.exports = { execute };