'use strict';

const repo = require('../ClinicaRepository');

async function execute(tenantId, id, usuarioId, usuarioNome, data) {
  const existing = await repo.findAgendamentoById(tenantId, id);
  if (!existing) throw Object.assign(new Error('Agendamento não encontrado'), { status: 404 });

  // Verifica conflito se mudando horário
  if (data.data_hora && data.profissional_id) {
    const conflito = await repo.findConflito(
      tenantId, data.profissional_id, data.data_hora, data.duracao_min ?? 30, id
    );
    if (conflito) throw Object.assign(new Error('Conflito de horário'), { status: 409 });
  }

  await repo.updateAgendamento(tenantId, id, data);
  await repo.registrarLog(tenantId, { usuarioId, usuarioNome, acao: 'EDICAO', entidade: 'agendamentos', entidadeId: id, detalhes: { status: data.status } });

  const updated = await repo.findAgendamentoById(tenantId, id);
  return repo.formatAgendamento(updated);
}

module.exports = { execute };