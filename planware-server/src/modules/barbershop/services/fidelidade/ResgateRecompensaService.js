'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Resgata uma recompensa do programa de fidelidade.
 *
 * Garante atomicidade conceitual:
 *  1. Verifica saldo suficiente
 *  2. Deduz pontos do cliente
 *  3. Registra o resgate
 *
 * Não usa transação Prisma pois o risco de inconsistência
 * neste domínio é aceitável (pontos de fidelidade não são financeiro).
 */
async function execute(tenantId, clienteId, recompensaId) {
  if (!clienteId) throw utils.badRequest('clienteId é obrigatório');
  if (!recompensaId) throw utils.badRequest('recompensaId é obrigatório');

  const [cliente, recompensa] = await Promise.all([
    repo.findCliente(tenantId, clienteId),
    repo.findRecompensa(tenantId, recompensaId),
  ]);

  if (!cliente) throw utils.notFound('Cliente não encontrado');
  if (!recompensa) throw utils.notFound('Recompensa não encontrada');

  if (!cliente.ativo) throw utils.badRequest('Cliente está inativo');
  if (!recompensa.ativa) throw utils.badRequest('Esta recompensa não está mais disponível');

  if (cliente.pontosFidelidade < recompensa.pontosNecessarios) {
    throw utils.badRequest(
      `Pontos insuficientes. Necessário: ${recompensa.pontosNecessarios}, disponível: ${cliente.pontosFidelidade}`
    );
  }

  await repo.deduzirPontosCliente(clienteId, recompensa.pontosNecessarios);

  const resgate = await repo.createResgate(
    clienteId,
    recompensaId,
    recompensa.pontosNecessarios,
  );

  return {
    resgate,
    recompensa: { id: recompensa.id, nome: recompensa.nome },
    cliente: { id: cliente.id, nome: cliente.nome },
    pontosUsados: recompensa.pontosNecessarios,
    saldoAnterior: cliente.pontosFidelidade,
    novoSaldo: cliente.pontosFidelidade - recompensa.pontosNecessarios,
  };
}

module.exports = { execute };