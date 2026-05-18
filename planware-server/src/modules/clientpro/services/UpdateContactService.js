'use strict';

const repo = require('../ClientProRepository');
const { formatContact } = require('../ClientProUtils');

const VALID_LEAD_STATUSES = ['NOVO', 'EM_CONTATO', 'NEGOCIANDO', 'FECHADO', 'PERDIDO'];

async function execute(tenantId, id, data) {
  if (!data.nome?.trim()) {
    throw Object.assign(new Error('Nome é obrigatório'), { status: 400 });
  }

  if (data.status_lead && !VALID_LEAD_STATUSES.includes(data.status_lead.toUpperCase())) {
    throw Object.assign(
      new Error(`status_lead inválido. Válidos: ${VALID_LEAD_STATUSES.join(', ')}`),
      { status: 400 }
    );
  }

  const result = await repo.updateContact(tenantId, id, data);
  if (result.count === 0) {
    throw Object.assign(new Error('Contato não encontrado'), { status: 404 });
  }

  const updated = await repo.findContactById(tenantId, id);
  return formatContact(updated);
}

module.exports = { execute };