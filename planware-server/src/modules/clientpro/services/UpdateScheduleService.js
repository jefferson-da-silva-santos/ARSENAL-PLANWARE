'use strict';

const repo = require('../ClientProRepository');
const { formatSchedule } = require('../ClientProUtils');

const VALID_STATUSES = ['PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO'];

async function execute(tenantId, id, data) {
  if (!data.titulo?.trim()) {
    throw Object.assign(new Error('Título é obrigatório'), { status: 400 });
  }
  if (!data.data_hora) {
    throw Object.assign(new Error('Data e hora são obrigatórios'), { status: 400 });
  }
  if (data.status && !VALID_STATUSES.includes(data.status.toUpperCase())) {
    throw Object.assign(
      new Error(`Status inválido. Válidos: ${VALID_STATUSES.join(', ')}`),
      { status: 400 }
    );
  }

  const result = await repo.updateSchedule(tenantId, id, data);
  if (result.count === 0) {
    throw Object.assign(new Error('Agendamento não encontrado'), { status: 404 });
  }

  // Rebusca com include do cliente para retornar nome
  const schedules = await repo.findAllSchedules(tenantId);
  const updated = schedules.find((s) => s.id === id);
  return formatSchedule(updated);
}

module.exports = { execute };