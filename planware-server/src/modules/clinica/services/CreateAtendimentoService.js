'use strict';

const repo = require('../ClinicaRepository');
const { validateAtendimento } = require('../ClinicaUtils');

async function execute(tenantId, usuarioId, usuarioNome, data) {
  const error = validateAtendimento(data);
  if (error) throw Object.assign(new Error(error), { status: 400 });

  const atendimento = await repo.createAtendimento(tenantId, data);

  // Finaliza agendamento vinculado
  if (data.agendamento_id) {
    await repo.updateAgendamento(tenantId, data.agendamento_id, { status: 'FINALIZADO' });
  }

  // Alerta de retorno automático
  if (data.retorno_em) {
    await repo.createAlerta(tenantId, {
      tipo: 'RETORNO',
      titulo: 'Retorno agendado',
      mensagem: `Retorno do paciente previsto para ${data.retorno_em}`,
      pacienteId: data.paciente_id,
      usuarioId: data.profissional_id,
    });
  }

  await repo.registrarLog(tenantId, {
    usuarioId, usuarioNome,
    acao: 'CRIACAO',
    entidade: 'atendimentos',
    entidadeId: atendimento.id,
    detalhes: { paciente_id: data.paciente_id, tipo: data.tipo },
  });

  return atendimento;
}

module.exports = { execute };