'use strict';

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const repo = require('../ClinicaRepository');
const { ALLOWED_MIME_TYPES } = require('../ClinicaUtils');

// Diretório de uploads — ao lado do projeto
const UPLOADS_DIR = process.env.CLINICA_UPLOADS_DIR
  || path.join(process.cwd(), 'clinica_uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configuração do multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const nome = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, nome);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    cb(null, ALLOWED_MIME_TYPES.includes(file.mimetype));
  },
});

// Middleware multer exportado para uso nas rotas
const uploadMiddleware = upload.array('arquivos', 10);

// Service que processa os arquivos após o multer
async function execute(atendimentoId, files, descricao, usuarioId, usuarioNome, tenantId) {
  if (!files || files.length === 0) {
    throw Object.assign(new Error('Nenhum arquivo enviado'), { status: 400 });
  }

  const inseridos = [];

  for (const file of files) {
    const anexo = await repo.createAnexo({
      atendimentoId,
      nomeOriginal: file.originalname,
      nomeArquivo: file.filename,
      tipoMime: file.mimetype,
      tamanhoBytes: file.size,
      descricao: descricao || null,
    });
    inseridos.push({
      id: anexo.id,
      nome: file.originalname,
      arquivo: file.filename,
    });
  }

  await repo.registrarLog(tenantId, {
    usuarioId, usuarioNome,
    acao: 'UPLOAD',
    entidade: 'anexos',
    entidadeId: atendimentoId,
    detalhes: { arquivos: inseridos.length },
  });

  return inseridos;
}

module.exports = { execute, uploadMiddleware, UPLOADS_DIR };