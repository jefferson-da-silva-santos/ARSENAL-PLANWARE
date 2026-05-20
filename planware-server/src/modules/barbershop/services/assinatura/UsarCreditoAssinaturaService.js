'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Deduz um crédito da assinatura ativa de um cliente.
 * Chamado manualmente pelo operador ou automaticamente pelo ConcluirAgendamento.
 *
 * Verifica:
 *  - Assinatura existe e está ATIVA
 *  - Possui créditos restantes
 *  - O serviço está incluído no plano (se a lista não for vazia)
 */
async function execute(tenantId, assinaturaId, { servicoId } = {}) {
  const assinatura = await repo.findAssinatura(tenantId, assinaturaId);
  if (!assinatura) throw utils.notFound('Assinatura não encontrada');

  if (assinatura.status !== 'ATIVA') {
    throw utils.badRequest(`Assinatura está ${assinatura.status.toLowerCase()}. Só é possível usar créditos de assinaturas ativas.`);
  }

  if (assinatura.creditosRestantes <= 0) {
    throw utils.badRequest('Assinatura sem créditos restantes');
  }

  // Verifica se o serviço está coberto (lista vazia = todos cobertos)
  if (servicoId && assinatura.servicosIncluidos.length > 0) {
    if (!assinatura.servicosIncluidos.includes(servicoId)) {
      throw utils.badRequest('Este serviço não está incluído no plano de assinatura');
    }
  }

  const atualizada = await repo.usarCreditoAssinatura(assinaturaId);

  // Se chegou a zero, marca como VENCIDA
  if (atualizada.creditosRestantes <= 0) {
    await repo.updateAssinaturaStatus(tenantId, assinaturaId, 'VENCIDA');
    atualizada.status = 'VENCIDA';
  }

  return {
    id: assinaturaId,
    creditosRestantes: atualizada.creditosRestantes,
    status: atualizada.status,
  };
}

module.exports = { execute };