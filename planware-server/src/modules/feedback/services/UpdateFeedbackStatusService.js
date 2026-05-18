'use strict';

const repo = require('../FeedbackRepository');
const { validateStatus, formatFeedback } = require('../FeedbackUtils');

async function execute(id, status) {
  const statusError = validateStatus(status);
  if (statusError) throw Object.assign(new Error(statusError), { status: 400 });

  const feedback = await repo.findById(id);
  if (!feedback) throw Object.assign(new Error('Feedback não encontrado'), { status: 404 });

  const updated = await repo.updateStatus(id, status.toUpperCase());
  return formatFeedback({ ...feedback, ...updated });
}

module.exports = { execute };