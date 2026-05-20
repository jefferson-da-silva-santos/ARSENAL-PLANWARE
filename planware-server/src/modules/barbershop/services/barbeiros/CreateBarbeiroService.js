'use strict';

// ─── CreateBarbeiroService ────────────────────────────────────
const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function createExecute(tenantId, data) {
  if (!data.nome?.trim()) throw utils.badRequest('nome é obrigatório');
  if (data.nivel) utils.validateNivel(data.nivel);

  if (data.comissaoPct != null) {
    const c = parseFloat(data.comissaoPct);
    if (isNaN(c) || c < 0 || c > 100) {
      throw utils.badRequest('comissaoPct deve ser entre 0 e 100');
    }
  }

  const barbeiro = await repo.createBarbeiro(tenantId, {
    nome: data.nome.trim(),
    telefone: data.telefone || null,
    email: data.email || null,
    foto: data.foto || null,
    nivel: data.nivel || 'JUNIOR',
    comissaoPct: data.comissaoPct != null ? parseFloat(data.comissaoPct) : null,
    metaMensal: data.metaMensal != null ? parseFloat(data.metaMensal) : null,
    metaCortes: data.metaCortes != null ? parseInt(data.metaCortes) : null,
  });

  return utils.formatBarbeiro(barbeiro);
}

module.exports = { execute: createExecute };