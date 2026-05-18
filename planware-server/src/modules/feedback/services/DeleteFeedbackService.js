'use strict';

const repo = require('../FeedbackRepository');

async function execute(id, tenantId) {
  const feedback = await repo.findById(id);
  if (!feedback) throw Object.assign(new Error('Feedback não encontrado'), { status: 404 });

  // Usuário comum só pode deletar feedback do próprio tenant
  // Superadmin pode deletar qualquer um (tenantId não é passado)
  if (tenantId && feedback.tenantId !== tenantId) {
    throw Object.assign(new Error('Acesso negado'), { status: 403 });
  }

  await repo.deleteFeedback(id);
  return { deleted: true, id };
}

module.exports = { execute };