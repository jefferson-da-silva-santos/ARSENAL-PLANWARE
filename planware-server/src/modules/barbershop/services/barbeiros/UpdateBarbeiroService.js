'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

// ─── UpdateBarbeiroService ────────────────────────────────────
async function updateExecute(tenantId, id, data) {
  const barbeiro = await repo.findBarbeiro(tenantId, id);
  if (!barbeiro) throw utils.notFound('Barbeiro não encontrado');

  const payload = {};
  if (data.nome !== undefined) payload.nome = data.nome.trim();
  if (data.telefone !== undefined) payload.telefone = data.telefone;
  if (data.email !== undefined) payload.email = data.email;
  if (data.foto !== undefined) payload.foto = data.foto;
  if (data.metaMensal !== undefined) payload.metaMensal = parseFloat(data.metaMensal);
  if (data.metaCortes !== undefined) payload.metaCortes = parseInt(data.metaCortes);

  if (data.nivel) {
    utils.validateNivel(data.nivel);
    payload.nivel = data.nivel;
  }
  if (data.comissaoPct != null) {
    const c = parseFloat(data.comissaoPct);
    if (isNaN(c) || c < 0 || c > 100) throw utils.badRequest('comissaoPct deve ser entre 0 e 100');
    payload.comissaoPct = c;
  }

  await repo.updateBarbeiro(tenantId, id, payload);
  const atualizado = await repo.findBarbeiro(tenantId, id);
  return utils.formatBarbeiro(atualizado);
}

module.exports = { execute: updateExecute };