'use strict';

const repo = require('../ClinicaRepository');
const { validatePaciente, limparCpf } = require('../ClinicaUtils');

async function execute(tenantId, usuarioId, usuarioNome, data) {
  const error = validatePaciente(data);
  if (error) throw Object.assign(new Error(error), { status: 400 });

  const cpfLimpo = limparCpf(data.cpf);

  const existing = await repo.findPacienteByCpf(tenantId, cpfLimpo);
  if (existing) throw Object.assign(new Error('CPF já cadastrado'), { status: 409 });

  const paciente = await repo.createPaciente(tenantId, { ...data, cpf: cpfLimpo });

  await repo.registrarLog(tenantId, {
    usuarioId, usuarioNome,
    acao: 'CRIACAO',
    entidade: 'pacientes',
    entidadeId: paciente.id,
    detalhes: { nome: paciente.nome, cpf: cpfLimpo },
  });

  return repo.formatPaciente(paciente);
}

module.exports = { execute };