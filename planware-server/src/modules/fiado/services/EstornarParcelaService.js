'use strict';
const repo = require('../FiadoRepository');

async function execute(id) {
  const parcela = await repo.findParcelaById(id);
  if (!parcela) throw Object.assign(new Error('Parcela não encontrada'), { status: 404 });
  if (!parcela.pago) throw Object.assign(new Error('Parcela não está paga'), { status: 400 });
  return repo.estornarParcela(id);
}

module.exports = { execute };