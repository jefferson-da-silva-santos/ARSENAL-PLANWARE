'use strict';

const VALID_MOVEMENT_TYPES = ['IN', 'OUT'];

function validateProduct(data) {
  const errors = [];

  if (!data.nome || !data.nome.trim()) {
    errors.push('nome é obrigatório');
  }

  if (data.preco_venda !== undefined && data.preco_venda < 0) {
    errors.push('preco_venda não pode ser negativo');
  }

  if (data.preco_custo !== undefined && data.preco_custo < 0) {
    errors.push('preco_custo não pode ser negativo');
  }

  if (data.quantidade_estoque !== undefined && data.quantidade_estoque < 0) {
    errors.push('quantidade_estoque não pode ser negativa');
  }

  if (data.estoque_minimo !== undefined && data.estoque_minimo < 0) {
    errors.push('estoque_minimo não pode ser negativo');
  }

  return errors;
}

function validateMovement(data) {
  const errors = [];

  if (!data.product_id) errors.push('product_id é obrigatório');

  if (!data.type || !VALID_MOVEMENT_TYPES.includes(data.type)) {
    errors.push(`type deve ser IN ou OUT`);
  }

  if (!data.quantity || !Number.isInteger(Number(data.quantity)) || Number(data.quantity) <= 0) {
    errors.push('quantity deve ser um inteiro positivo');
  }

  return errors;
}

// Formata produto para resposta — converte campos camelCase do Prisma
// de volta para snake_case esperado pelos frontends existentes
function formatProduct(product) {
  if (!product) return null;
  return {
    id: product.id,
    nome: product.nome,
    sku: product.sku,
    preco_custo: product.precoCusto,
    preco_venda: product.precoVenda,
    quantidade_estoque: product.quantidadeEstoque,
    estoque_minimo: product.estoqueMinimo,
    unidade_medida: product.unidadeMedida,
    marca: product.marca,
    ncm: product.ncm,
    categoria: product.categoria,
    ativo: product.ativo,
    criado_em: product.criadoEm,
  };
}

function formatMovement(movement) {
  if (!movement) return null;
  return {
    id: movement.id,
    product_id: movement.productId,
    type: movement.type,
    quantity: movement.quantity,
    date: movement.date,
    reason: movement.reason,
    produto_nome: movement.product?.nome ?? null,
    sku: movement.product?.sku ?? null,
  };
}

module.exports = {
  validateProduct,
  validateMovement,
  formatProduct,
  formatMovement,
};