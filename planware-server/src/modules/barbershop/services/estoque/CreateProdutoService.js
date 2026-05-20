'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, data) {
  if (!data.nome?.trim()) throw utils.badRequest('nome é obrigatório');

  const qtdAtual = parseInt(data.quantidadeAtual ?? 0);
  const qtdMin = parseInt(data.quantidadeMin ?? 5);

  if (isNaN(qtdAtual) || qtdAtual < 0) throw utils.badRequest('quantidadeAtual deve ser não-negativo');
  if (isNaN(qtdMin) || qtdMin < 0) throw utils.badRequest('quantidadeMin deve ser não-negativo');

  if (data.precoUnitario != null) {
    const p = parseFloat(data.precoUnitario);
    if (isNaN(p) || p < 0) throw utils.badRequest('precoUnitario deve ser não-negativo');
  }

  return repo.createProduto(tenantId, {
    nome: data.nome.trim(),
    categoria: data.categoria || null,
    fornecedor: data.fornecedor || null,
    unidade: data.unidade || 'un',
    precoUnitario: data.precoUnitario != null ? parseFloat(data.precoUnitario) : 0,
    quantidadeAtual: qtdAtual,
    quantidadeMin: qtdMin,
    validade: data.validade || null,
  });
}

module.exports = { execute };