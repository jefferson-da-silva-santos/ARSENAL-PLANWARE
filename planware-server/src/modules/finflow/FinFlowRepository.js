'use strict';

const prisma = require('../../db/client');

// ─────────────────────────────────────────────────────────────
//  MESES
// ─────────────────────────────────────────────────────────────

async function findOrCreateMonth(tenantId, year, month) {
  const existing = await prisma.flowMonth.findUnique({
    where: { tenantId_year_month: { tenantId, year, month } },
  });
  if (existing) return existing;

  return prisma.flowMonth.create({
    data: { tenantId, year, month },
  });
}

async function findMonthById(id) {
  return prisma.flowMonth.findUnique({ where: { id } });
}

async function updateMonth(id, data) {
  return prisma.flowMonth.update({
    where: { id },
    data,
  });
}

// ─────────────────────────────────────────────────────────────
//  TRANSAÇÕES
// ─────────────────────────────────────────────────────────────

async function findTransactionsByMonth(flowMonthId) {
  return prisma.flowTransaction.findMany({
    where: { flowMonthId },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
  });
}

async function findTransactionById(id) {
  return prisma.flowTransaction.findUnique({ where: { id } });
}

async function createTransaction(data) {
  return prisma.flowTransaction.create({ data });
}

async function createManyTransactions(dataArray) {
  return prisma.$transaction(
    dataArray.map((data) => prisma.flowTransaction.create({ data }))
  );
}

async function updateTransaction(id, data) {
  return prisma.flowTransaction.update({ where: { id }, data });
}

async function deleteTransaction(id) {
  return prisma.flowTransaction.delete({ where: { id } });
}

async function deleteTransactionsByGroup(installmentGroupId) {
  return prisma.flowTransaction.deleteMany({ where: { installmentGroupId } });
}

async function togglePaid(id, paid) {
  return prisma.flowTransaction.update({
    where: { id },
    data: { paid },
  });
}

// Transações não pagas nos próximos N dias (para o tenant inteiro)
async function findUpcoming(tenantId, days = 30) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  limit.setHours(23, 59, 59, 999);

  return prisma.flowTransaction.findMany({
    where: {
      paid: false,
      dueDate: { gte: today, lte: limit },
      flowMonth: { tenantId },
    },
    include: { flowMonth: { select: { year: true, month: true } } },
    orderBy: { dueDate: 'asc' },
    take: 50,
  });
}

// ─────────────────────────────────────────────────────────────
//  ENTRADAS
// ─────────────────────────────────────────────────────────────

async function findIncomesByMonth(flowMonthId) {
  return prisma.flowIncome.findMany({
    where: { flowMonthId },
    orderBy: { createdAt: 'asc' },
  });
}

async function findIncomeById(id) {
  return prisma.flowIncome.findUnique({ where: { id } });
}

async function createIncome(data) {
  return prisma.flowIncome.create({ data });
}

async function updateIncome(id, data) {
  return prisma.flowIncome.update({ where: { id }, data });
}

async function deleteIncome(id) {
  return prisma.flowIncome.delete({ where: { id } });
}

async function toggleReceived(id, received) {
  return prisma.flowIncome.update({
    where: { id },
    data: { received },
  });
}

module.exports = {
  findOrCreateMonth,
  findMonthById,
  updateMonth,
  findTransactionsByMonth,
  findTransactionById,
  createTransaction,
  createManyTransactions,
  updateTransaction,
  deleteTransaction,
  deleteTransactionsByGroup,
  togglePaid,
  findUpcoming,
  findIncomesByMonth,
  findIncomeById,
  createIncome,
  updateIncome,
  deleteIncome,
  toggleReceived,
};