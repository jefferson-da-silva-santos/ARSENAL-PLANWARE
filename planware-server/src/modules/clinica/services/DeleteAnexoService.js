'use strict';

const path = require('path');
const fs = require('fs');
const repo = require('../ClinicaRepository');
const { UPLOADS_DIR } = require('./UploadAnexoService');

async function execute(id, usuarioId, usuarioNome, tenantId) {
  const anexo = await repo.findAnexoById(id);
  if (!anexo) throw Object.assign(new Error('Anexo não encontrado'), { status: 404 });

  // Remove o arquivo do disco se existir
  const filePath = path.join(UPLOADS_DIR, anexo.nomeArquivo);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await repo.deleteAnexo(id);

  await repo.registrarLog(tenantId, {
    usuarioId, usuarioNome,
    acao: 'EXCLUSAO',
    entidade: 'anexos',
    entidadeId: id,
  });

  return { deleted: true };
}

module.exports = { execute };