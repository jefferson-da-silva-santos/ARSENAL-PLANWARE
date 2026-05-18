'use strict';

const repo = require('../FeedbackRepository');
const { validateType, formatFeedback } = require('../FeedbackUtils');

async function execute({ tenantId, userId, type, title, description }) {
  if (!title?.trim()) {
    throw Object.assign(new Error('title é obrigatório'), { status: 400 });
  }
  if (!description?.trim()) {
    throw Object.assign(new Error('description é obrigatório'), { status: 400 });
  }

  const typeError = validateType(type);
  if (typeError) throw Object.assign(new Error(typeError), { status: 400 });

  const feedback = await repo.createFeedback({
    tenantId,
    userId,
    type: type.toUpperCase(),
    title: title.trim(),
    description: description.trim(),
  });

  return formatFeedback(feedback);
}

module.exports = { execute };