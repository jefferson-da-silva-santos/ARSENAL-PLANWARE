'use strict';

const repo = require('../ClinicaRepository');

async function execute(tenantId, id, usuarioId, usuarioNome) {
  const existing = await repo.findPacienteById(tenantId, id);
  if (!existing) throw Object.assign(new Error('Paciente não encontrado'), { status: 404 });

  await repo.softDeletePaciente(tenantId, id);
  await repo.registrarLog(tenantId, { usuarioId, usuarioNome, acao: 'EXCLUSAO', entidade: 'pacientes', entidadeId: id });

  return { deleted: true };
}

module.exports = { execute };