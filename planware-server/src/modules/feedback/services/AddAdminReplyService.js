'use strict';

const repo = require('../FeedbackRepository');

async function execute(feedbackId, userId, message) {
  if (!message?.trim()) {
    throw Object.assign(new Error('message é obrigatório'), { status: 400 });
  }

  const feedback = await repo.findById(feedbackId);
  if (!feedback) {
    throw Object.assign(new Error('Feedback não encontrado'), { status: 404 });
  }

  // Ao responder, move automaticamente para EM_ANALISE se ainda estiver ABERTO
  if (feedback.status === 'ABERTO') {
    await repo.updateStatus(feedbackId, 'EM_ANALISE');
  }

  const reply = await repo.createReply({
    feedbackId,
    userId,
    message: message.trim(),
  });

  return reply;
}

module.exports = { execute };