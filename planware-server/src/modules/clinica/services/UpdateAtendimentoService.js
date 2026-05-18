'use strict';

const repo = require('../ClinicaRepository');

async function execute(tenantId, id, usuarioId, usuarioNome, data) {
  const existing = await repo.findAtendimentoById(tenantId, id);
  if (!existing) throw Object.assign(new Error('Atendimento não encontrado'), { status: 404 });

  await repo.updateAtendimento(tenantId, id, data);
  await repo.registrarLog(tenantId, { usuarioId, usuarioNome, acao: 'EDICAO', entidade: 'atendimentos', entidadeId: id });

  const updated = await repo.findAtendimentoById(tenantId, id);
  return repo.formatAtendimento(updated);
}

module.exports = { execute };