'use strict';

const repo = require('../ClientProRepository');
const { formatSchedule } = require('../ClientProUtils');

async function execute(tenantId, data) {
  if (!data.titulo?.trim()) {
    throw Object.assign(new Error('Título é obrigatório'), { status: 400 });
  }
  if (!data.data_hora) {
    throw Object.assign(new Error('Data e hora são obrigatórios'), { status: 400 });
  }

  // Se informou cliente, valida se pertence ao tenant
  if (data.cliente_id) {
    const client = await repo.findClientById(tenantId, data.cliente_id);
    if (!client) {
      throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });
    }
  }

  const schedule = await repo.createSchedule(tenantId, data);
  return formatSchedule(schedule);
}

module.exports = { execute };