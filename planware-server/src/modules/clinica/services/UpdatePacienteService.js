'use strict';

const repo = require('../ClinicaRepository');
const { validatePaciente, limparCpf } = require('../ClinicaUtils');

async function execute(tenantId, id, usuarioId, usuarioNome, data) {
  const error = validatePaciente(data);
  if (error) throw Object.assign(new Error(error), { status: 400 });

  const existing = await repo.findPacienteById(tenantId, id);
  if (!existing) throw Object.assign(new Error('Paciente não encontrado'), { status: 404 });

  const cpfLimpo = limparCpf(data.cpf);
  await repo.updatePaciente(tenantId, id, { ...data, cpf: cpfLimpo });

  await repo.registrarLog(tenantId, { usuarioId, usuarioNome, acao: 'EDICAO', entidade: 'pacientes', entidadeId: id });

  const updated = await repo.findPacienteById(tenantId, id);
  return repo.formatPaciente(updated);
}

module.exports = { execute };