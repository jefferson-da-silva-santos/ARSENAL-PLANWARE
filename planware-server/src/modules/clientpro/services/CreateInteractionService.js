'use strict';

const repo = require('../ClientProRepository');

const VALID_TYPES = ['NOTA', 'LIGACAO', 'EMAIL', 'REUNIAO', 'WHATSAPP'];

async function execute(tenantId, contactId, { tipo, descricao }) {
  if (!descricao?.trim()) {
    throw Object.assign(new Error('Descrição é obrigatória'), { status: 400 });
  }

  if (tipo && !VALID_TYPES.includes(tipo.toUpperCase())) {
    throw Object.assign(
      new Error(`tipo inválido. Válidos: ${VALID_TYPES.join(', ')}`),
      { status: 400 }
    );
  }

  // Garante que o contato pertence ao tenant
  const contact = await repo.findContactById(tenantId, contactId);
  if (!contact) {
    throw Object.assign(new Error('Contato não encontrado'), { status: 404 });
  }

  return repo.createInteraction(contactId, { tipo, descricao });
}

module.exports = { execute };