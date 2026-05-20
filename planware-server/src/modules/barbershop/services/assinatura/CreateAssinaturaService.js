'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Cria uma assinatura recorrente para um cliente.
 *
 * Regras:
 *  - Cliente não pode ter mais de uma assinatura ATIVA simultaneamente
 *  - creditosTotal e valorMensal devem ser positivos
 *  - renovaEm deve ser uma data futura
 *  - servicosIncluidos é opcional (vazio = todos os serviços)
 */
async function execute(tenantId, data) {
  if (!data.clienteId) throw utils.badRequest('clienteId é obrigatório');
  if (!data.nome?.trim()) throw utils.badRequest('nome do plano é obrigatório');
  if (!data.renovaEm) throw utils.badRequest('renovaEm é obrigatório');

  utils.validatePositivo(data.creditosTotal, 'creditosTotal');
  utils.validatePositivo(data.valorMensal, 'valorMensal');

  const renovaEm = new Date(data.renovaEm);
  if (isNaN(renovaEm.getTime())) throw utils.badRequest('renovaEm inválido');
  if (renovaEm <= new Date()) throw utils.badRequest('renovaEm deve ser uma data futura');

  const cliente = await repo.findCliente(tenantId, data.clienteId);
  if (!cliente) throw utils.notFound('Cliente não encontrado');
  if (!cliente.ativo) throw utils.badRequest('Cliente está inativo');

  const assinaturaAtiva = await repo.findAssinaturaAtivaCliente(tenantId, data.clienteId);
  if (assinaturaAtiva) {
    throw utils.conflict(
      `Cliente já possui a assinatura "${assinaturaAtiva.nome}" ativa. ` +
      'Cancele-a antes de criar uma nova.'
    );
  }

  return repo.createAssinatura(tenantId, {
    clienteId: data.clienteId,
    nome: data.nome.trim(),
    creditosTotal: parseInt(data.creditosTotal),
    valorMensal: parseFloat(data.valorMensal),
    servicosIncluidos: Array.isArray(data.servicosIncluidos) ? data.servicosIncluidos : [],
    renovaEm: renovaEm.toISOString(),
    observacoes: data.observacoes || null,
  });
}

module.exports = { execute };