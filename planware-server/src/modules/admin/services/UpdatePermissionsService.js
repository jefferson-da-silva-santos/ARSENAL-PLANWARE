'use strict';

const repo = require('../AdminRepository');
const { validateSystems } = require('../AdminUtils');

async function execute({ userId, permissions }) {
  if (!userId) {
    const err = new Error('userId é obrigatório');
    err.status = 400;
    throw err;
  }

  const systemsError = validateSystems(permissions);
  if (systemsError) {
    const err = new Error(systemsError);
    err.status = 400;
    throw err;
  }

  const user = await repo.findUserById(userId);
  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.status = 404;
    throw err;
  }

  await repo.revokeAllPermissions(userId);

  const perms = permissions.map(system => ({ system, granted: true }));
  await repo.upsertPermissions(userId, perms);

  return { userId, permissions: perms };
}

module.exports = { execute };