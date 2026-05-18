'use strict';

const repo = require('../ClientProRepository');
const { formatContact } = require('../ClientProUtils');

const VALID_LEAD_STATUSES = ['NOVO', 'EM_CONTATO', 'NEGOCIANDO', 'FECHADO', 'PERDIDO'];

async function execute(tenantId, data) {
  if (!data.nome?.trim()) {
    throw Object.assign(new Error('Nome é obrigatório'), { status: 400 });
  }

  if (data.status_lead && !VALID_LEAD_STATUSES.includes(data.status_lead.toUpperCase())) {
    throw Object.assign(
      new Error(`status_lead inválido. Válidos: ${VALID_LEAD_STATUSES.join(', ')}`),
      { status: 400 }
    );
  }

  const contact = await repo.createContact(tenantId, data);
  return formatContact(contact);
}

module.exports = { execute };