'use strict';

const repo = require('../FeedbackRepository');
const { formatFeedback } = require('../FeedbackUtils');

async function execute({ type, status, tenantId } = {}) {
  const feedbacks = await repo.findAll({
    type: type?.toUpperCase(),
    status: status?.toUpperCase(),
    tenantId,
  });
  return feedbacks.map(formatFeedback);
}

module.exports = { execute };