'use strict';

const repo = require('../ClinicaRepository');
const { validateAgendamento } = require('../ClinicaUtils');

async function execute(tenantId, usuarioId, usuarioNome, data) {
  const error = validateAgendamento(data);
  if (error) throw Object.assign(new Error(error), { status: 400 });

  const duracaoMin = data.duracao_min ?? 30;

  // Verifica conflito de horário
  const conflito = await repo.findConflito(tenantId, data.profissional_id, data.data_hora, duracaoMin);
  if (conflito) throw Object.assign(new Error('Conflito de horário: profissional já possui agendamento neste período'), { status: 409 });

  const agendamento = await repo.createAgendamento(tenantId, data);

  // Alerta automático
  await repo.createAlerta(tenantId, {
    tipo: 'CONSULTA',
    titulo: 'Novo agendamento',
    mensagem: `Consulta agendada para ${data.data_hora}`,
    pacienteId: data.paciente_id,
    agendamentoId: agendamento.id,
    usuarioId: data.profissional_id,
  });

  await repo.registrarLog(tenantId, {
    usuarioId, usuarioNome,
    acao: 'CRIACAO',
    entidade: 'agendamentos',
    entidadeId: agendamento.id,
    detalhes: { paciente_id: data.paciente_id, data_hora: data.data_hora },
  });

  return agendamento;
}

module.exports = { execute };