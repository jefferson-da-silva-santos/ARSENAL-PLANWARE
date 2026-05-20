'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, id) {
  const assinatura = await repo.findAssinatura(tenantId, id);
  if (!assinatura) throw utils.notFound('Assinatura não encontrada');

  if (assinatura.status === 'CANCELADA') {
    throw utils.badRequest('Assinatura já está cancelada');
  }

  await repo.updateAssinaturaStatus(tenantId, id, 'CANCELADA');

  return {
    id,
    status: 'CANCELADA',
    canceladoEm: new Date().toISOString(),
    cliente: { id: assinatura.clienteId, nome: assinatura.cliente?.nome },
  };
}

module.exports = { execute };