'use strict';

const repo = require('../FeedbackRepository');
const { formatFeedback } = require('../FeedbackUtils');

async function execute(tenantId, { type, status } = {}) {
  const feedbacks = await repo.findByTenant(tenantId, {
    type: type?.toUpperCase(),
    status: status?.toUpperCase(),
  });
  return feedbacks.map(formatFeedback);
}

module.exports = { execute };