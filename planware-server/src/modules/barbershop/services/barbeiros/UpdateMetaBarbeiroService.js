'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Atualiza as metas mensais de um barbeiro.
 * Separado do UpdateBarbeiroService para tornar a ação explícita
 * e facilitar permissões granulares futuramente.
 */
async function execute(tenantId, id, { metaMensal, metaCortes }) {
  const barbeiro = await repo.findBarbeiro(tenantId, id);
  if (!barbeiro) throw utils.notFound('Barbeiro não encontrado');

  const payload = {};

  if (metaMensal !== undefined) {
    if (metaMensal !== null) {
      const v = parseFloat(metaMensal);
      if (isNaN(v) || v < 0) throw utils.badRequest('metaMensal deve ser um valor não-negativo');
      payload.metaMensal = v;
    } else {
      payload.metaMensal = null; // remove meta
    }
  }

  if (metaCortes !== undefined) {
    if (metaCortes !== null) {
      const v = parseInt(metaCortes);
      if (isNaN(v) || v < 0) throw utils.badRequest('metaCortes deve ser um inteiro não-negativo');
      payload.metaCortes = v;
    } else {
      payload.metaCortes = null;
    }
  }

  if (Object.keys(payload).length === 0) {
    throw utils.badRequest('Nenhuma meta para atualizar. Informe metaMensal ou metaCortes');
  }

  await repo.updateBarbeiro(tenantId, id, payload);
  const atualizado = await repo.findBarbeiro(tenantId, id);
  return utils.formatBarbeiro(atualizado);
}

module.exports = { execute };