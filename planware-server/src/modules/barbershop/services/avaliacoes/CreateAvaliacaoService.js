'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Registra a avaliação de um atendimento.
 *
 * Regras:
 *  - Agendamento deve estar CONCLUIDO
 *  - Só pode ser avaliado uma vez
 *  - notaGeral é obrigatória (1-5)
 *  - Demais notas são opcionais
 */
async function execute(tenantId, data) {
  const { agendamentoId, notaGeral, notaCorte, notaAtendimento, notaPontualidade, comentario } = data;

  if (!agendamentoId) throw utils.badRequest('agendamentoId é obrigatório');

  utils.validateNota(notaGeral, 'notaGeral');
  if (!notaGeral) throw utils.badRequest('notaGeral é obrigatória');

  utils.validateNota(notaCorte, 'notaCorte');
  utils.validateNota(notaAtendimento, 'notaAtendimento');
  utils.validateNota(notaPontualidade, 'notaPontualidade');

  const agendamento = await repo.findAgendamento(tenantId, agendamentoId);
  if (!agendamento) throw utils.notFound('Agendamento não encontrado');

  if (agendamento.status !== 'CONCLUIDO') {
    throw utils.badRequest('Só é possível avaliar agendamentos com status CONCLUIDO');
  }

  const existente = await repo.findAvaliacaoPorAgendamento(agendamentoId);
  if (existente) throw utils.conflict('Este agendamento já possui uma avaliação');

  return repo.createAvaliacao({
    tenantId,
    agendamentoId,
    barbeiroId: agendamento.barbeiroId,
    clienteId: agendamento.clienteId ?? null,
    notaGeral: parseInt(notaGeral),
    notaCorte: notaCorte ? parseInt(notaCorte) : null,
    notaAtendimento: notaAtendimento ? parseInt(notaAtendimento) : null,
    notaPontualidade: notaPontualidade ? parseInt(notaPontualidade) : null,
    comentario: comentario?.trim() || null,
  });
}

module.exports = { execute };