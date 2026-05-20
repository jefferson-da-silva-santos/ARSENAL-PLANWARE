'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Renova uma assinatura: repõe os créditos e define nova data de renovação.
 * Pode reativar uma assinatura VENCIDA ou SUSPENSA.
 */
async function execute(tenantId, id, { novaRenovaEm } = {}) {
  const assinatura = await repo.findAssinatura(tenantId, id);
  if (!assinatura) throw utils.notFound('Assinatura não encontrada');

  if (assinatura.status === 'CANCELADA') {
    throw utils.badRequest('Não é possível renovar uma assinatura cancelada. Crie uma nova.');
  }

  // Data de renovação: 30 dias a partir de hoje se não informada
  let renovaEm;
  if (novaRenovaEm) {
    renovaEm = new Date(novaRenovaEm);
    if (isNaN(renovaEm.getTime())) throw utils.badRequest('novaRenovaEm inválido');
    if (renovaEm <= new Date()) throw utils.badRequest('novaRenovaEm deve ser uma data futura');
  } else {
    renovaEm = new Date();
    renovaEm.setDate(renovaEm.getDate() + 30);
  }

  return repo.renovarAssinatura(id, renovaEm.toISOString());
}

module.exports = { execute };