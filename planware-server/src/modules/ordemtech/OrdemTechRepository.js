'use strict';

const prisma = require('../../db/client');

// ── Clientes ──────────────────────────────────────────────────

async function findAllClientes(tenantId, search = '') {
  return prisma.ordemCliente.findMany({
    where: {
      tenantId,
      ...(search && {
        OR: [
          { nome:     { contains: search, mode: 'insensitive' } },
          { telefone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { nome: 'asc' },
  });
}

async function findClienteById(tenantId, id) {
  // FIX: garante que id é string (UUID), nunca número
  return prisma.ordemCliente.findFirst({
    where: { id: String(id), tenantId },
  });
}

async function findClienteByNome(tenantId, nome) {
  return prisma.ordemCliente.findFirst({
    where: { tenantId, nome: { equals: nome, mode: 'insensitive' } },
  });
}

async function createCliente(tenantId, { nome, telefone }) {
  return prisma.ordemCliente.create({
    data: { tenantId, nome, telefone: telefone || null },
  });
}

async function updateCliente(tenantId, id, { nome, telefone }) {
  return prisma.ordemCliente.updateMany({
    where: { id: String(id), tenantId },
    data:  { nome, telefone: telefone || null },
  });
}

// ── Ordens ────────────────────────────────────────────────────

async function countOrdens(tenantId) {
  return prisma.ordem.count({ where: { tenantId } });
}

async function findAllOrdens(tenantId, { search, status } = {}) {
  return prisma.ordem.findMany({
    where: {
      tenantId,
      ...(status && { status }),
      ...(search && {
        OR: [
          { numero:      { contains: search, mode: 'insensitive' } },
          { equipamento: { contains: search, mode: 'insensitive' } },
          { problema:    { contains: search, mode: 'insensitive' } },
          { observacoes: { contains: search, mode: 'insensitive' } },
          { cliente: { nome: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    },
    include: { cliente: { select: { nome: true, telefone: true } } },
    orderBy: { criadoEm: 'desc' },
  });
}

async function findOrdemById(tenantId, id) {
  return prisma.ordem.findFirst({
    where: { id: String(id), tenantId },
    include: { cliente: { select: { nome: true, telefone: true } } },
  });
}

async function createOrdem(tenantId, data) {
  return prisma.ordem.create({
    data: { tenantId, ...data },
    include: { cliente: { select: { nome: true, telefone: true } } },
  });
}

async function updateOrdem(tenantId, id, data) {
  return prisma.ordem.updateMany({
    where: { id: String(id), tenantId },
    data,
  });
}

async function deleteOrdem(tenantId, id) {
  return prisma.ordem.deleteMany({
    where: { id: String(id), tenantId },
  });
}

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(tenantId) {
  const [stats, recentes] = await Promise.all([
    prisma.ordem.groupBy({
      by:    ['status'],
      where: { tenantId },
      _count: true,
      _sum:   { valor: true },
    }),
    prisma.ordem.findMany({
      where:   { tenantId, status: 'EM_ANDAMENTO' },
      include: { cliente: { select: { nome: true } } },
      orderBy: { criadoEm: 'desc' },
      take: 5,
    }),
  ]);

  const totals = {
    total:        0,
    em_andamento: 0,
    prontos:      0,
    cancelados:   0,
    faturamento:  0,
  };

  for (const s of stats) {
    totals.total += s._count;
    if (s.status === 'EM_ANDAMENTO') totals.em_andamento = s._count;
    if (s.status === 'PRONTO')       { totals.prontos = s._count; totals.faturamento = s._sum.valor || 0; }
    if (s.status === 'CANCELADO')    totals.cancelados = s._count;
  }

  return { stats: totals, recentes };
}

module.exports = {
  findAllClientes, findClienteById, findClienteByNome, createCliente, updateCliente,
  countOrdens, findAllOrdens, findOrdemById, createOrdem, updateOrdem, deleteOrdem,
  getDashboard,
};