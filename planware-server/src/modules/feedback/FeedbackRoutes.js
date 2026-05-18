'use strict';

const { Router } = require('express');
const controller = require('./FeedbackController');
const { requireRole } = require('../../middleware/requireRole');

const router = Router();

// ─────────────────────────────────────────────────────────────
//  ROTAS DO USUÁRIO COMUM
//  Qualquer usuário autenticado pode usar essas rotas.
//  Dados sempre isolados ao próprio tenant via req.user.tenantId
// ─────────────────────────────────────────────────────────────

// GET  /feedback          — lista feedbacks do próprio tenant (aceita ?type, ?status)
// POST /feedback          — abre novo ticket
// DELETE /feedback/:id    — deleta ticket próprio

router.get('/', controller.listMyFeedbacks);
router.post('/', controller.createFeedback);
router.delete('/:id', controller.deleteFeedback);

// ─────────────────────────────────────────────────────────────
//  ROTAS DO SUPERADMIN
//  Prefixo /feedback/admin — todas exigem papel SUPERADMIN
// ─────────────────────────────────────────────────────────────

// GET    /feedback/admin              — todos os feedbacks (aceita ?type, ?status, ?tenantId)
// PATCH  /feedback/admin/:id/status   — atualiza status do ticket
// POST   /feedback/admin/:id/reply    — responde um ticket
// DELETE /feedback/admin/:id          — deleta qualquer ticket

router.get('/admin', requireRole('SUPERADMIN'), controller.listAllFeedbacks);
router.patch('/admin/:id/status', requireRole('SUPERADMIN'), controller.updateStatus);
router.post('/admin/:id/reply', requireRole('SUPERADMIN'), controller.addReply);
router.delete('/admin/:id', requireRole('SUPERADMIN'), controller.adminDeleteFeedback);

module.exports = router;