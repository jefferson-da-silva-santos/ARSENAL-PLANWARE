'use strict';

const bcrypt = require('bcryptjs');
const repo = require('../AdminRepository');
const { validateSystems, validateRole } = require('../AdminUtils');

const SALT_ROUNDS = 12;

async function execute({ tenantId, name, email, password, role = 'USER', permissions = [] }) {
  if (!tenantId || !name || !email || !password) {
    const err = new Error('tenantId, name, email e password são obrigatórios');
    err.status = 400;
    throw err;
  }

  if (password.length < 8) {
    const err = new Error('A senha deve ter no mínimo 8 caracteres');
    err.status = 400;
    throw err;
  }

  const roleError = validateRole(role);
  if (roleError) {
    const err = new Error(roleError);
    err.status = 400;
    throw err;
  }

  if (permissions.length > 0) {
    const systemsError = validateSystems(permissions);
    if (systemsError) {
      const err = new Error(systemsError);
      err.status = 400;
      throw err;
    }
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await repo.findUserByEmail(normalizedEmail);
  if (existing) {
    const err = new Error('Este e-mail já está em uso');
    err.status = 409;
    throw err;
  }

  const tenant = await repo.findTenantById(tenantId);
  if (!tenant || !tenant.active) {
    const err = new Error('Tenant não encontrado ou inativo');
    err.status = 404;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await repo.createUser({
    tenantId,
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    role,
  });

  if (permissions.length > 0) {
    const perms = permissions.map(system => ({ system, granted: true }));
    await repo.upsertPermissions(user.id, perms);
  }

  return {
    ...user,
    permissions: permissions.map(system => ({ system, granted: true })),
  };
}

module.exports = { execute };