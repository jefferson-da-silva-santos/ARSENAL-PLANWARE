'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, id, data) {
  const produto = await repo.findProduto(tenantId, id);
  if (!produto) throw utils.notFound('Produto não encontrado');

  const payload = {};

  if (data.nome !== undefined) payload.nome = data.nome.trim();
  if (data.categoria !== undefined) payload.categoria = data.categoria;
  if (data.fornecedor !== undefined) payload.fornecedor = data.fornecedor;
  if (data.unidade !== undefined) payload.unidade = data.unidade;
  if (data.validade !== undefined) payload.validade = data.validade;
  if (data.ativo !== undefined) payload.ativo = data.ativo;

  if (data.precoUnitario !== undefined) {
    const p = parseFloat(data.precoUnitario);
    if (isNaN(p) || p < 0) throw utils.badRequest('precoUnitario deve ser não-negativo');
    payload.precoUnitario = p;
  }

  if (data.quantidadeMin !== undefined) {
    const v = parseInt(data.quantidadeMin);
    if (isNaN(v) || v < 0) throw utils.badRequest('quantidadeMin deve ser não-negativo');
    payload.quantidadeMin = v;
  }

  await repo.updateProduto(tenantId, id, payload);
  return repo.findProduto(tenantId, id);
}

module.exports = { execute };