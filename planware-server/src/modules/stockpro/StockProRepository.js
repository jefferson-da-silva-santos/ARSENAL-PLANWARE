'use strict';

const prisma = require('../../db/client');

// ─────────────────────────────────────────────────────────────
//  PRODUTOS
// ─────────────────────────────────────────────────────────────

async function findAllProducts(tenantId, search = '') {
  return prisma.product.findMany({
    where: {
      tenantId,
      ativo: true,
      ...(search && {
        OR: [
          { nome:      { contains: search, mode: 'insensitive' } },
          { sku:       { contains: search, mode: 'insensitive' } },
          { marca:     { contains: search, mode: 'insensitive' } },
          { categoria: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { nome: 'asc' },
  });
}

async function findProductById(tenantId, id) {
  return prisma.product.findFirst({
    where: { id, tenantId, ativo: true },
  });
}

async function findProductBySku(tenantId, sku) {
  return prisma.product.findUnique({
    where: { tenantId_sku: { tenantId, sku } },
  });
}

async function createProduct(tenantId, data) {
  return prisma.product.create({
    data: {
      tenantId,
      nome:              data.nome,
      sku:               data.sku               ?? null,
      precoCusto:        data.preco_custo        ?? 0,
      precoVenda:        data.preco_venda        ?? 0,
      quantidadeEstoque: data.quantidade_estoque ?? 0,
      estoqueMinimo:     data.estoque_minimo     ?? 5,
      unidadeMedida:     data.unidade_medida     ?? 'un',
      marca:             data.marca              ?? null,
      ncm:               data.ncm               ?? null,
      categoria:         data.categoria          ?? null,
    },
  });
}

async function updateProduct(tenantId, id, data) {
  return prisma.product.updateMany({
    where: { id, tenantId },
    data: {
      nome:          data.nome,
      sku:           data.sku           ?? null,
      precoCusto:    data.preco_custo   ?? 0,
      precoVenda:    data.preco_venda   ?? 0,
      estoqueMinimo: data.estoque_minimo ?? 5,
      unidadeMedida: data.unidade_medida ?? 'un',
      marca:         data.marca         ?? null,
      ncm:           data.ncm           ?? null,
      categoria:     data.categoria     ?? null,
    },
  });
}

async function softDeleteProduct(tenantId, id) {
  return prisma.product.updateMany({
    where: { id, tenantId },
    data:  { ativo: false },
  });
}

// ─────────────────────────────────────────────────────────────
//  MOVIMENTAÇÕES
// ─────────────────────────────────────────────────────────────

async function findAllMovements(tenantId) {
  return prisma.movement.findMany({
    where:   { tenantId },
    orderBy: { date: 'desc' },
    include: { product: { select: { nome: true, sku: true } } },
  });
}

async function findMovementsByProduct(tenantId, productId) {
  return prisma.movement.findMany({
    where:   { tenantId, productId },
    orderBy: { date: 'desc' },
    // Sem include — histórico de produto individual não precisa do nome
  });
}

async function registerMovement(tenantId, { productId, type, quantity, reason }) {
  const delta = type === 'IN' ? quantity : -quantity;

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findFirst({
      where: { id: productId, tenantId, ativo: true },
    });

    if (!product) {
      const err = new Error('Produto não encontrado');
      err.status = 404;
      throw err;
    }

    const newQty = product.quantidadeEstoque + delta;

    if (newQty < 0) {
      const err = new Error('Estoque insuficiente para esta saída');
      err.status = 400;
      throw err;
    }

    await tx.product.update({
      where: { id: productId },
      data:  { quantidadeEstoque: newQty },
    });

    return tx.movement.create({
      data: {
        tenantId,
        productId,
        type,
        quantity,
        reason: reason ?? 'Ajuste manual',
      },
    });
  });
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────

async function getDashboard(tenantId) {
  // FIX: não usa prisma.product.fields.estoqueMinimo dentro de where —
  // o Prisma não suporta comparação entre campos na mesma tabela via where normal.
  // Solução: busca todos os produtos e filtra em memória.
  const [allProducts, recentMovements] = await Promise.all([
    prisma.product.findMany({
      where:  { tenantId, ativo: true },
      select: {
        quantidadeEstoque: true,
        precoVenda:        true,
        estoqueMinimo:     true,
      },
    }),

    // FIX: busca movimentações recentes COM include para ter produto_nome
    prisma.movement.findMany({
      where:   { tenantId },
      orderBy: { date: 'desc' },
      take:    5,
      include: { product: { select: { nome: true, sku: true } } },
    }),
  ]);

  const total      = allProducts.length;
  const lowStock   = allProducts.filter(p => p.quantidadeEstoque <= p.estoqueMinimo).length;
  const totalValue = allProducts.reduce((sum, p) => sum + p.quantidadeEstoque * p.precoVenda, 0);

  return { total, lowStock, totalValue, recentMovements };
}

// Retorna produtos com estoque abaixo ou igual ao mínimo (para rota /alerts)
async function getLowStockProducts(tenantId) {
  const products = await prisma.product.findMany({
    where:  { tenantId, ativo: true },
    select: {
      id:                true,
      nome:              true,
      sku:               true,
      quantidadeEstoque: true,
      estoqueMinimo:     true,
      unidadeMedida:     true,
    },
  });
  return products.filter(p => p.quantidadeEstoque <= p.estoqueMinimo);
}

module.exports = {
  findAllProducts,
  findProductById,
  findProductBySku,
  createProduct,
  updateProduct,
  softDeleteProduct,
  findAllMovements,
  findMovementsByProduct,
  registerMovement,
  getDashboard,
  getLowStockProducts,
};