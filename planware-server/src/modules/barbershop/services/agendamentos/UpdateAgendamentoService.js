'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, agendamentoId, data) {
  if (!agendamentoId) throw utils.badRequest('agendamentoId é obrigatório');

  const agendamento = await repo.findAgendamento(tenantId, agendamentoId);
  if (!agendamento) throw utils.notFound('Agendamento não encontrado');

  if (['CONCLUIDO', 'CANCELADO'].includes(agendamento.status)) {
    throw utils.badRequest('Não é possível alterar um agendamento finalizado ou cancelado');
  }

  const payload = {};

  // Atualiza status se fornecido
  if (data.status) {
    utils.validateStatusAgend(data.status);
    payload.status = data.status;
  }

  // Reagendamento — valida conflito apenas se a data/hora mudar
  if (data.dataHora) {
    const novaDataHora = utils.validateDataHora(data.dataHora);
    if (novaDataHora < new Date()) {
      throw utils.badRequest('Não é possível reagendar para uma data/hora no passado');
    }

    const duracaoMin = data.duracaoMin ?? agendamento.duracaoMin;
    const barbeiroId = data.barbeiroId ?? agendamento.barbeiroId;
    const inicioNovo = novaDataHora.getTime();
    const fimNovo = inicioNovo + duracaoMin * 60 * 1000;

    const inicioDia = new Date(novaDataHora);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(novaDataHora);
    fimDia.setHours(23, 59, 59, 999);

    const existentes = await repo.findAgendamentosByBarbeiroNoPeriodo(barbeiroId, inicioDia, fimDia);

    const temConflito = existentes
      .filter(ag => ag.id !== agendamentoId) // ignora o próprio agendamento
      .some(ag => {
        const agInicio = new Date(ag.dataHora).getTime();
        const agFim = agInicio + ag.duracaoMin * 60 * 1000;
        return inicioNovo < agFim && fimNovo > agInicio;
      });

    if (temConflito) {
      throw utils.conflict('O barbeiro já possui um agendamento neste novo horário');
    }

    payload.dataHora = novaDataHora.toISOString();
    payload.duracaoMin = duracaoMin;
  }

  if (data.observacoes !== undefined) payload.observacoes = data.observacoes;
  if (data.barbeiroId) payload.barbeiroId = data.barbeiroId;

  await repo.updateAgendamento(tenantId, agendamentoId, payload);

  const atualizado = await repo.findAgendamento(tenantId, agendamentoId);
  return utils.formatAgendamento(atualizado);
}

module.exports = { execute };