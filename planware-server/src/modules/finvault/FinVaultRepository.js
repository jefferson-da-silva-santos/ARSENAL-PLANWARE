'use strict';

const prisma = require('../../db/client');

// ─────────────────────────────────────────────────────────────
//  TRANSAÇÕES
// ─────────────────────────────────────────────────────────────

async function findAllTransactions(tenantId, { type, category, from, to, limit = 200 } = {}) {
  return prisma.finTransaction.findMany({
    where: {
      tenantId,
      ...(type     && { type }),
      ...(category && { category }),
      // FIX: o spread condicional com parênteses estava mal formado no original
      // ...(from || to) && { date: {...} }  ← isso é parsed como: spread do resultado de &&
      // O correto é usar um objeto explícito dentro do spread:
      ...((from || to) ? {
        date: {
          ...(from && { gte: new Date(from) }),
          ...(to   && { lte: new Date(to + 'T23:59:59') }),
        },
      } : {}),
    },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    take: Math.min(limit, 500),
  });
}

async function findTransactionById(tenantId, id) {
  return prisma.finTransaction.findFirst({
    where: { id, tenantId },
  });
}

async function createTransaction(tenantId, { type, amount, category, description, date }) {
  return prisma.finTransaction.create({
    data: {
      tenantId,
      type,
      amount,
      category:    category    ?? null,
      description: description ?? null,
      date:        new Date(date),
    },
  });
}

async function deleteTransaction(tenantId, id) {
  const deleted = await prisma.finTransaction.deleteMany({
    where: { id, tenantId },
  });

  if (deleted.count === 0) {
    const err = new Error('Transação não encontrada');
    err.status = 404;
    throw err;
  }

  return deleted;
}

// ─────────────────────────────────────────────────────────────
//  RESUMOS / AGREGAÇÕES
// ─────────────────────────────────────────────────────────────

async function getSummaryByMonth(tenantId, month) {
  const year = new Date().getFullYear();
  const from = new Date(`${year}-${month}-01`);
  // Último dia do mês: day 0 do próximo mês
  const to   = new Date(year, parseInt(month, 10), 0, 23, 59, 59);

  const rows = await prisma.finTransaction.findMany({
    where: {
      tenantId,
      date: { gte: from, lte: to },
    },
    select: { type: true, amount: true },
  });

  const income  = rows.filter(r => r.type === 'INCOME').reduce((s, r)  => s + r.amount, 0);
  const expense = rows.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);

  return {
    income,
    expense,
    balance:           income - expense,
    transaction_count: rows.length,
  };
}

async function getDailyCash(tenantId, date) {
  const rows = await prisma.finTransaction.findMany({
    where: {
      tenantId,
      date: {
        gte: new Date(date + 'T00:00:00'),
        lte: new Date(date + 'T23:59:59'),
      },
    },
    select: { type: true, amount: true },
  });

  const income  = rows.filter(r => r.type === 'INCOME').reduce((s, r)  => s + r.amount, 0);
  const expense = rows.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);

  return { balance: income - expense };
}

async function getByCategory(tenantId, type = 'EXPENSE') {
  const rows = await prisma.finTransaction.groupBy({
    by:      ['category'],
    where:   { tenantId, type },
    _sum:    { amount: true },
    _count:  true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  return rows.map(r => ({
    category: r.category ?? 'Outros',
    total:    r._sum.amount ?? 0,
    count:    r._count,
  }));
}

async function getMonthlyEvolution(tenantId) {
  const rows = await prisma.finTransaction.findMany({
    where:   { tenantId },
    select:  { type: true, amount: true, date: true },
    orderBy: { date: 'asc' },
  });

  const map = new Map();

  for (const row of rows) {
    const d   = new Date(row.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    if (!map.has(key)) map.set(key, { income: 0, expense: 0 });

    const entry = map.get(key);
    if (row.type === 'INCOME')  entry.income  += row.amount;
    if (row.type === 'EXPENSE') entry.expense += row.amount;
  }

  return Array.from(map.entries())
    .slice(-12)
    .map(([key, val]) => {
      const [year, month] = key.split('-');
      return {
        month:    `${month}/${year}`,
        sort_key: key.replace('-', ''),
        income:   val.income,
        expense:  val.expense,
        total:    val.income + val.expense,
      };
    });
}

async function getGlobalBalance(tenantId) {
  const rows = await prisma.finTransaction.findMany({
    where:  { tenantId },
    select: { type: true, amount: true },
  });

  const income  = rows.filter(r => r.type === 'INCOME').reduce((s, r)  => s + r.amount, 0);
  const expense = rows.filter(r => r.type === 'EXPENSE').reduce((s, r) => s + r.amount, 0);

  return { income, expense };
}

module.exports = {
  findAllTransactions,
  findTransactionById,
  createTransaction,
  deleteTransaction,
  getSummaryByMonth,
  getDailyCash,
  getByCategory,
  getMonthlyEvolution,
  getGlobalBalance,
};