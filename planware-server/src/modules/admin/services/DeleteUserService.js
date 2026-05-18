'use strict';

const repo = require('../AdminRepository');

async function execute({ userId, hard = false }) {
  if (!userId) {
    const err = new Error('userId é obrigatório');
    err.status = 400;
    throw err;
  }

  const user = await repo.findUserById(userId);
  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.status = 404;
    throw err;
  }

  if (user.role === 'SUPERADMIN') {
    const err = new Error('Não é permitido remover um superadmin');
    err.status = 403;
    throw err;
  }

  if (hard) {
    await repo.deleteUser(userId);
    return { deleted: true, userId };
  }

  const updated = await repo.updateUserActive(userId, false);
  return { deleted: false, deactivated: true, user: updated };
}

module.exports = { execute };