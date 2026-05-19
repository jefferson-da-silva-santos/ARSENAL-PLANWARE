'use strict';

const prisma = require('../../db/client');

// ─────────────────────────────────────────────────────────────
//  PLANOS
// ─────────────────────────────────────────────────────────────

async function findAllPlans({ activeOnly = false } = {}) {
  return prisma.plan.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { price: 'asc' },
    include: { _count: { select: { tenantPlans: true } } },
  });
}

async function findPlanById(id) {
  return prisma.plan.findUnique({
    where: { id },
    include: { _count: { select: { tenantPlans: true } } },
  });
}

async function createPlan({ name, description, price, systems }) {
  return prisma.plan.create({
    data: { name, description: description || null, price, systems: systems || [] },
  });
}

async function updatePlan(id, data) {
  return prisma.plan.update({ where: { id }, data });
}

async function togglePlanActive(id, active) {
  return prisma.plan.update({ where: { id }, data: { active } });
}

// ─────────────────────────────────────────────────────────────
//  TENANT PLAN (assinatura)
// ─────────────────────────────────────────────────────────────

async function findTenantPlan(tenantId) {
  return prisma.tenantPlan.findUnique({
    where: { tenantId },
    include: {
      plan: true,
      tenant: { select: { id: true, name: true, slug: true, active: true } },
    },
  });
}

async function upsertTenantPlan(tenantId, { planId, type, startedAt, renewsAt, notes }) {
  return prisma.tenantPlan.upsert({
    where: { tenantId },
    create: {
      tenantId,
      planId,
      type:      type      || 'MONTHLY',
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      renewsAt:  renewsAt  ? new Date(renewsAt)  : null,
      notes:     notes     || null,
    },
    update: {
      planId,
      type:      type      || 'MONTHLY',
      startedAt: startedAt ? new Date(startedAt) : undefined,
      renewsAt:  renewsAt  ? new Date(renewsAt)  : null,
      notes:     notes     || null,
      cancelledAt: null,
    },
    include: { plan: true },
  });
}

async function cancelTenantPlan(tenantId) {
  return prisma.tenantPlan.update({
    where: { tenantId },
    data: { cancelledAt: new Date() },
  });
}

// ─────────────────────────────────────────────────────────────
//  COBRANÇAS
// ─────────────────────────────────────────────────────────────

async function findAllCharges({ tenantId, status, type, from, to, page = 1, perPage = 50 } = {}) {
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  if (status)   where.status   = status;
  if (type)     where.type     = type;
  if (from || to) {
    where.dueDate = {};
    if (from) where.dueDate.gte = new Date(from);
    if (to)   where.dueDate.lte = new Date(to + 'T23:59:59');
  }

  const take = Math.min(parseInt(perPage) || 50, 200);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

  const [total, charges] = await Promise.all([
    prisma.charge.count({ where }),
    prisma.charge.findMany({
      where,
      orderBy: { dueDate: 'desc' },
      take,
      skip,
      include: {
        tenant:   { select: { id: true, name: true, slug: true } },
        payments: { select: { id: true, amount: true, method: true, paidAt: true } },
      },
    }),
  ]);

  return { charges, total, page: parseInt(page), perPage: take };
}

async function findChargeById(id) {
  return prisma.charge.findUnique({
    where: { id },
    include: {
      tenant:   { select: { id: true, name: true, slug: true } },
      payments: { orderBy: { paidAt: 'asc' } },
    },
  });
}

async function createCharge({ tenantId, description, amount, dueDate, type, notes }) {
  return prisma.charge.create({
    data: {
      tenantId,
      description,
      amount,
      dueDate:  new Date(dueDate),
      type:     type  || 'SUBSCRIPTION',
      notes:    notes || null,
      status:   'PENDING',
    },
    include: {
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });
}

async function updateCharge(id, data) {
  const payload = { ...data };
  if (payload.dueDate) payload.dueDate = new Date(payload.dueDate);
  return prisma.charge.update({ where: { id }, data: payload });
}

async function updateChargeStatus(id, status) {
  return prisma.charge.update({ where: { id }, data: { status } });
}

async function deleteCharge(id) {
  return prisma.charge.delete({ where: { id } });
}

// Marca cobranças vencidas automaticamente (cron ou chamada manual)
async function markOverdueCharges() {
  const now = new Date();
  const result = await prisma.charge.updateMany({
    where: {
      status:  'PENDING',
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  });
  return result.count;
}

// ─────────────────────────────────────────────────────────────
//  PAGAMENTOS
// ─────────────────────────────────────────────────────────────

async function findPaymentsByCharge(chargeId) {
  return prisma.payment.findMany({
    where:   { chargeId },
    orderBy: { paidAt: 'asc' },
  });
}

async function createPayment(chargeId, { amount, method, paidAt, reference, notes }) {
  // Cria o pagamento
  const payment = await prisma.payment.create({
    data: {
      chargeId,
      amount,
      method,
      paidAt:    paidAt    ? new Date(paidAt) : new Date(),
      reference: reference || null,
      notes:     notes     || null,
    },
  });

  // Recalcula status da cobrança
  await recalcChargeStatus(chargeId);

  return payment;
}

async function deletePayment(id) {
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) return null;

  await prisma.payment.delete({ where: { id } });
  await recalcChargeStatus(payment.chargeId);

  return payment;
}

// Recalcula o status da cobrança com base nos pagamentos
async function recalcChargeStatus(chargeId) {
  const charge   = await prisma.charge.findUnique({ where: { id: chargeId } });
  if (!charge) return;

  const payments = await prisma.payment.findMany({ where: { chargeId } });
  const paid     = payments.reduce((s, p) => s + p.amount, 0);

  let status;
  if (paid <= 0) {
    status = new Date() > charge.dueDate ? 'OVERDUE' : 'PENDING';
  } else if (paid >= charge.amount) {
    status = 'PAID';
  } else {
    status = 'PARTIAL';
  }

  await prisma.charge.update({ where: { id: chargeId }, data: { status } });
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD / STATS
// ─────────────────────────────────────────────────────────────

async function getStats() {
  const now      = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [
    totalCharges,
    pendingCharges,
    overdueCharges,
    paidThisMonth,
    totalReceived,
    totalOpen,
    recentPayments,
    overdueList,
  ] = await Promise.all([
    prisma.charge.count(),
    prisma.charge.count({ where: { status: 'PENDING' } }),
    prisma.charge.count({ where: { status: 'OVERDUE' } }),

    // Valor recebido no mês atual
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { paidAt: { gte: monthStart, lte: monthEnd } },
    }),

    // Total histórico recebido
    prisma.payment.aggregate({ _sum: { amount: true } }),

    // Total em aberto (PENDING + PARTIAL + OVERDUE)
    prisma.charge.aggregate({
      _sum: { amount: true },
      where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
    }),

    // Últimos 5 pagamentos
    prisma.payment.findMany({
      orderBy: { paidAt: 'desc' },
      take: 5,
      include: {
        charge: {
          select: {
            description: true,
            tenant: { select: { name: true } },
          },
        },
      },
    }),

    // Top 5 cobranças vencidas mais antigas
    prisma.charge.findMany({
      where:   { status: 'OVERDUE' },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: { tenant: { select: { id: true, name: true } } },
    }),
  ]);

  return {
    totalCharges,
    pendingCharges,
    overdueCharges,
    paidThisMonth:  paidThisMonth._sum.amount  ?? 0,
    totalReceived:  totalReceived._sum.amount   ?? 0,
    totalOpen:      totalOpen._sum.amount       ?? 0,
    recentPayments,
    overdueList,
  };
}

// Financeiro completo de um tenant
async function getTenantFinancial(tenantId) {
  const [tenantPlan, charges] = await Promise.all([
    findTenantPlan(tenantId),
    prisma.charge.findMany({
      where:   { tenantId },
      orderBy: { dueDate: 'desc' },
      include: { payments: { orderBy: { paidAt: 'asc' } } },
    }),
  ]);

  const totalCharged = charges.reduce((s, c) => s + c.amount, 0);
  const totalPaid    = charges.flatMap(c => c.payments).reduce((s, p) => s + p.amount, 0);
  const totalOpen    = totalCharged - totalPaid;
  const overdue      = charges.filter(c => c.status === 'OVERDUE').length;

  return { tenantPlan, charges, totalCharged, totalPaid, totalOpen, overdue };
}

module.exports = {
  // plans
  findAllPlans, findPlanById, createPlan, updatePlan, togglePlanActive,
  // tenant plans
  findTenantPlan, upsertTenantPlan, cancelTenantPlan,
  // charges
  findAllCharges, findChargeById, createCharge, updateCharge,
  updateChargeStatus, deleteCharge, markOverdueCharges,
  // payments
  findPaymentsByCharge, createPayment, deletePayment, recalcChargeStatus,
  // stats
  getStats, getTenantFinancial,
};
