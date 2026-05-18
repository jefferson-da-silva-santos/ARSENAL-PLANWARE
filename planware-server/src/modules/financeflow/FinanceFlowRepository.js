'use strict';

const prisma = require('../../db/client');

// ── Meses ─────────────────────────────────────────────────────

async function findOrCreateMonth(tenantId, year, month) {
  const existing = await prisma.fcMonth.findUnique({
    where: { tenantId_year_month: { tenantId, year, month } },
  });
  if (existing) return existing;
  return prisma.fcMonth.create({ data: { tenantId, year, month } });
}

async function findMonthWithAll(tenantId, year, month) {
  return prisma.fcMonth.findUnique({
    where: { tenantId_year_month: { tenantId, year, month } },
    include: {
      categories: { orderBy: { name: 'asc' } },
      transactions: {
        orderBy: [{ dueDate: 'asc' }, { id: 'asc' }],
        include: { category: { select: { name: true } } },
      },
      incomes: { orderBy: { id: 'asc' } },
    },
  });
}

// ── Categorias ────────────────────────────────────────────────

// Substitui todas as categorias do mês (delete + insert em transação)
async function replaceCategories(fcMonthId, categories) {
  return prisma.$transaction(async (tx) => {
    await tx.fcCategory.deleteMany({ where: { fcMonthId } });

    const created = [];
    for (const cat of categories) {
      if (!cat.name?.trim()) continue;
      const c = await tx.fcCategory.create({
        data: {
          fcMonthId,
          name: cat.name.trim(),
          percentage: parseFloat(cat.percentage) || 0,
        },
      });
      created.push(c);
    }

    return created;
  });
}

// ── Transações ────────────────────────────────────────────────

async function findTransactionById(id) {
  return prisma.fcTransaction.findUnique({ where: { id } });
}

async function createTransaction(data) {
  return prisma.fcTransaction.create({ data });
}

async function createManyTransactions(dataArray) {
  return prisma.$transaction(
    dataArray.map((d) => prisma.fcTransaction.create({ data: d }))
  );
}

async function updateTransaction(id, data) {
  return prisma.fcTransaction.update({ where: { id }, data });
}

async function deleteTransaction(id) {
  return prisma.fcTransaction.delete({ where: { id } });
}

async function deleteTransactionsByGroup(installmentGroupId) {
  return prisma.fcTransaction.deleteMany({ where: { installmentGroupId } });
}

// ── Entradas ──────────────────────────────────────────────────

async function findIncomeById(id) {
  return prisma.fcIncome.findUnique({ where: { id } });
}

async function createIncome(data) {
  return prisma.fcIncome.create({ data });
}

async function updateIncome(id, data) {
  return prisma.fcIncome.update({ where: { id }, data });
}

async function deleteIncome(id) {
  return prisma.fcIncome.delete({ where: { id } });
}

module.exports = {
  findOrCreateMonth,
  findMonthWithAll,
  replaceCategories,
  findTransactionById,
  createTransaction,
  createManyTransactions,
  updateTransaction,
  deleteTransaction,
  deleteTransactionsByGroup,
  findIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
};