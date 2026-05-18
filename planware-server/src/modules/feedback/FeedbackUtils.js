'use strict';

const VALID_TYPES = ['BUG', 'FEATURE', 'REQUISITO', 'OUTRO'];

const VALID_STATUSES = ['ABERTO', 'EM_ANALISE', 'RESOLVIDO', 'RECUSADO'];

function validateType(type) {
  if (!type || !VALID_TYPES.includes(type.toUpperCase())) {
    return `type inválido. Válidos: ${VALID_TYPES.join(', ')}`;
  }
  return null;
}

function validateStatus(status) {
  if (!status || !VALID_STATUSES.includes(status.toUpperCase())) {
    return `status inválido. Válidos: ${VALID_STATUSES.join(', ')}`;
  }
  return null;
}

function formatFeedback(fb) {
  if (!fb) return null;
  return {
    id: fb.id,
    type: fb.type,
    title: fb.title,
    description: fb.description,
    status: fb.status,
    tenantId: fb.tenantId,
    tenant: fb.tenant ?? undefined,
    user: fb.user ?? undefined,
    replies: fb.replies ?? undefined,
    createdAt: fb.createdAt,
    updatedAt: fb.updatedAt,
  };
}

module.exports = { VALID_TYPES, VALID_STATUSES, validateType, validateStatus, formatFeedback };