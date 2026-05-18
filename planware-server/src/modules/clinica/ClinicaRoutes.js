'use strict';

const { Router } = require('express');
const path = require('path');
const controller = require('./ClinicaController');
const { uploadMiddleware, UPLOADS_DIR } = require('./services/UploadAnexoService');
const { requireRole } = require('../../middleware/requireRole');

const router = Router();

// ── Servir arquivos de upload estaticamente ───────────────────
// Acesso via GET /clinica/uploads/<nome-do-arquivo>
router.use('/uploads', require('express').static(UPLOADS_DIR));

// ── Dashboard ─────────────────────────────────────────────────
router.get('/api/dashboard', controller.getDashboard);

// ── Pacientes ─────────────────────────────────────────────────
// GET    /clinica/api/pacientes         — lista com paginação (aceita ?q, ?cpf, ?pagina, ?limite)
// GET    /clinica/api/pacientes/:id     — detalhe
// POST   /clinica/api/pacientes         — cadastrar
// PUT    /clinica/api/pacientes/:id     — editar
// DELETE /clinica/api/pacientes/:id     — soft delete (requer SUPERADMIN)

router.get('/api/pacientes', controller.listPacientes);
router.get('/api/pacientes/:id', controller.getPaciente);
router.post('/api/pacientes', controller.createPaciente);
router.put('/api/pacientes/:id', controller.updatePaciente);
router.delete('/api/pacientes/:id', requireRole('SUPERADMIN'), controller.deletePaciente);

// ── Agendamentos ──────────────────────────────────────────────
// GET    /clinica/api/agendamentos      — lista (aceita ?data, ?profissional_id, ?status, ?paciente_id)
// POST   /clinica/api/agendamentos      — criar
// PUT    /clinica/api/agendamentos/:id  — atualizar
// DELETE /clinica/api/agendamentos/:id  — cancelar (soft)

router.get('/api/agendamentos', controller.listAgendamentos);
router.post('/api/agendamentos', controller.createAgendamento);
router.put('/api/agendamentos/:id', controller.updateAgendamento);
router.delete('/api/agendamentos/:id', controller.cancelarAgendamento);

// ── Atendimentos ──────────────────────────────────────────────
// GET    /clinica/api/atendimentos      — lista com filtros
// GET    /clinica/api/atendimentos/:id  — detalhe com anexos
// POST   /clinica/api/atendimentos      — registrar
// PUT    /clinica/api/atendimentos/:id  — editar
// DELETE /clinica/api/atendimentos/:id  — cancelar (requer SUPERADMIN)

router.get('/api/atendimentos', controller.listAtendimentos);
router.get('/api/atendimentos/:id', controller.getAtendimento);
router.post('/api/atendimentos', controller.createAtendimento);
router.put('/api/atendimentos/:id', controller.updateAtendimento);
router.delete('/api/atendimentos/:id', requireRole('SUPERADMIN'), controller.cancelarAtendimento);

// ── Anexos ────────────────────────────────────────────────────
// POST   /clinica/api/atendimentos/:id/anexos — upload de arquivos (multipart/form-data)
// DELETE /clinica/api/anexos/:id              — remover arquivo

router.post('/api/atendimentos/:id/anexos', uploadMiddleware, controller.uploadAnexos);
router.delete('/api/anexos/:id', controller.deleteAnexo);

// ── Alertas ───────────────────────────────────────────────────
// GET /clinica/api/alertas              — alertas do usuário autenticado
// PUT /clinica/api/alertas/:id/lido     — marcar como lido
// PUT /clinica/api/alertas/lidos/todos  — marcar todos como lidos

router.get('/api/alertas', controller.listAlertas);
router.put('/api/alertas/lidos/todos', controller.marcarTodosLidos);  // estática ANTES da dinâmica
router.put('/api/alertas/:id/lido', controller.marcarAlertaLido);

// ── Logs ──────────────────────────────────────────────────────
// GET /clinica/api/logs — somente SUPERADMIN (aceita ?entidade, ?usuario_id, ?pagina, ?limite)

router.get('/api/logs', requireRole('SUPERADMIN'), controller.listLogs);

// ── Busca global ──────────────────────────────────────────────
// GET /clinica/api/busca?q=termo

router.get('/api/busca', controller.busca);

// ── Health ────────────────────────────────────────────────────
router.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', versao: '1.0.0', timestamp: new Date().toISOString() });
});

module.exports = router;