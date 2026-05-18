'use strict';
const repo = require('../FiadoRepository');

async function execute(id, { data_pagamento, observacao }) {
  const parcela = await repo.findParcelaById(id);
  if (!parcela) throw Object.assign(new Error('Parcela não encontrada'), { status: 404 });
  if (parcela.pago) throw Object.assign(new Error('Parcela já está paga'), { status: 400 });
  return repo.pagarParcela(id, { dataPagamento: data_pagamento, observacao });
}

module.exports = { execute };