'use strict';

const prisma = require('../../db/client');

// ─────────────────────────────────────────────────────────────
//  TENANTS
// ─────────────────────────────────────────────────────────────

async function findAllTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { users: true } } },
  });
}

async function findTenantById(id) {
  return prisma.tenant.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
}

async function findTenantBySlug(slug) {
  return prisma.tenant.findUnique({ where: { slug } });
}

async function createTenant({ name, slug }) {
  return prisma.tenant.create({
    data: { name, slug, active: true },
  });
}

async function updateTenantActive(id, active) {
  return prisma.tenant.update({
    where: { id },
    data: { active },
  });
}

// ─────────────────────────────────────────────────────────────
//  USUÁRIOS
// ─────────────────────────────────────────────────────────────

async function findAllUsers({ tenantId } = {}) {
  return prisma.user.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      tenantId: true,
      createdAt: true,
      permissions: { select: { system: true, granted: true } },
      tenant: { select: { name: true, slug: true } },
    },
  });
}

async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      tenantId: true,
      createdAt: true,
      updatedAt: true,
      permissions: { select: { system: true, granted: true } },
      tenant: { select: { name: true, slug: true } },
    },
  });
}

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function createUser({ tenantId, name, email, passwordHash, role }) {
  return prisma.user.create({
    data: { tenantId, name, email, passwordHash, role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      tenantId: true,
    },
  });
}

async function updateUserActive(id, active) {
  return prisma.user.update({
    where: { id },
    data: { active },
    select: { id: true, name: true, email: true, active: true },
  });
}

async function updateUserPassword(id, passwordHash) {
  return prisma.user.update({
    where: { id },
    data: { passwordHash },
    select: { id: true, name: true, email: true },
  });
}

async function deleteUser(id) {
  return prisma.user.delete({ where: { id } });
}

// ─────────────────────────────────────────────────────────────
//  PERMISSÕES
// ─────────────────────────────────────────────────────────────

async function findPermissionsByUser(userId) {
  return prisma.userPermission.findMany({
    where: { userId },
    select: { system: true, granted: true },
  });
}

// Recebe array de { system, granted } e faz upsert de cada um
async function upsertPermissions(userId, permissions) {
  const ops = permissions.map(({ system, granted }) =>
    prisma.userPermission.upsert({
      where: { userId_system: { userId, system } },
      update: { granted },
      create: { userId, system, granted },
    })
  );
  return prisma.$transaction(ops);
}

async function revokeAllPermissions(userId) {
  return prisma.userPermission.deleteMany({ where: { userId } });
}

module.exports = {
  // tenants
  findAllTenants,
  findTenantById,
  findTenantBySlug,
  createTenant,
  updateTenantActive,
  // users
  findAllUsers,
  findUserById,
  findUserByEmail,
  createUser,
  updateUserActive,
  updateUserPassword,
  deleteUser,
  // permissions
  findPermissionsByUser,
  upsertPermissions,
  revokeAllPermissions,
};