'use strict';

const prisma = require('../../db/client');

// ── Feedbacks ─────────────────────────────────────────────────

// Todos os feedbacks de um tenant (visão do usuário)
async function findByTenant(tenantId, { type, status } = {}) {
  return prisma.feedback.findMany({
    where: {
      tenantId,
      ...(type && { type }),
      ...(status && { status }),
    },
    include: {
      user: { select: { name: true, email: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true, role: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// Todos os feedbacks de todos os tenants (visão do superadmin)
async function findAll({ type, status, tenantId } = {}) {
  return prisma.feedback.findMany({
    where: {
      ...(type && { type }),
      ...(status && { status }),
      ...(tenantId && { tenantId }),
    },
    include: {
      user: { select: { name: true, email: true } },
      tenant: { select: { name: true, slug: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true, role: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function findById(id) {
  return prisma.feedback.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      tenant: { select: { name: true, slug: true } },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true, role: true } } },
      },
    },
  });
}

async function createFeedback({ tenantId, userId, type, title, description }) {
  return prisma.feedback.create({
    data: { tenantId, userId, type, title, description },
    include: {
      user: { select: { name: true, email: true } },
    },
  });
}

async function updateStatus(id, status) {
  return prisma.feedback.update({
    where: { id },
    data: { status },
  });
}

async function deleteFeedback(id) {
  return prisma.feedback.delete({ where: { id } });
}

// ── Replies ───────────────────────────────────────────────────

async function createReply({ feedbackId, userId, message }) {
  return prisma.feedbackReply.create({
    data: { feedbackId, userId, message },
    include: {
      user: { select: { name: true, role: true } },
    },
  });
}

module.exports = {
  findByTenant,
  findAll,
  findById,
  createFeedback,
  updateStatus,
  deleteFeedback,
  createReply,
};