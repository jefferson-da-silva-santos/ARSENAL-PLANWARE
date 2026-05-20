'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, agendamentoId) {
  if (!agendamentoId) throw utils.badRequest('agendamentoId é obrigatório');

  const agendamento = await repo.findAgendamento(tenantId, agendamentoId);
  if (!agendamento) throw utils.notFound('Agendamento não encontrado');

  if (agendamento.status === 'CONCLUIDO') {
    throw utils.badRequest('Não é possível cancelar um agendamento já concluído');
  }
  if (agendamento.status === 'CANCELADO') {
    throw utils.badRequest('Este agendamento já está cancelado');
  }

  await repo.updateAgendamentoStatus(tenantId, agendamentoId, 'CANCELADO');
  return { id: agendamentoId, status: 'CANCELADO' };
}

module.exports = { execute };