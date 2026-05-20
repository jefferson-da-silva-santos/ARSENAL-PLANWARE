'use strict';

const repo = require('../../BarbershopRepository');

/**
 * Retorna produtos com estoque abaixo ou igual ao mínimo configurado.
 * Inclui classificação por urgência para facilitar a visualização.
 */
async function execute(tenantId) {
  const produtos = await repo.findProdutosAbaixoDoMinimo(tenantId);

  return produtos.map(p => ({
    id: p.id,
    nome: p.nome,
    categoria: p.categoria,
    quantidadeAtual: p.quantidadeAtual,
    quantidadeMin: p.quantidadeMin,
    urgencia: p.quantidadeAtual === 0 ? 'CRITICO' : 'BAIXO',
    validade: p.validade,
    fornecedor: p.fornecedor,
  })).sort((a, b) => {
    // Crítico primeiro, depois por menor quantidade
    if (a.urgencia !== b.urgencia) return a.urgencia === 'CRITICO' ? -1 : 1;
    return a.quantidadeAtual - b.quantidadeAtual;
  });
}

module.exports = { execute };