'use strict';

const { Router } = require('express');
const controller = require('./AdminController');
const errorsRoutes = require('../errors/ErrorsRoutes'); // ← Error Tracking
const { requireRole } = require('../../middleware/requireRole');

const router = Router();

// Todas as rotas deste módulo exigem papel SUPERADMIN.
// O middleware auth.js já rodou antes (registrado no app.js),
// então req.user está disponível aqui.
router.use(requireRole('SUPERADMIN'));

// ─────────────────────────────────────────────────────────────
//  TENANTS
// ─────────────────────────────────────────────────────────────

// GET    /admin/tenants              — lista todos os tenants
// POST   /admin/tenants              — cria novo tenant
// GET    /admin/tenants/:id          — detalhe de um tenant
// PATCH  /admin/tenants/:id/toggle   — ativa/desativa tenant

router.get('/tenants', controller.listTenants);
router.post('/tenants', controller.createTenant);
router.get('/tenants/:id', controller.getTenant);
router.patch('/tenants/:id/toggle', controller.toggleTenant);

// ─────────────────────────────────────────────────────────────
//  USUÁRIOS
// ─────────────────────────────────────────────────────────────

// GET    /admin/users              — lista usuários (aceita ?tenantId=xxx)
// POST   /admin/users              — cria usuário em um tenant
// GET    /admin/users/:id          — detalhe de um usuário
// PATCH  /admin/users/:id/toggle   — ativa/desativa usuário
// PATCH  /admin/users/:id/password — reseta senha
// DELETE /admin/users/:id          — desativa (soft) ou remove (?hard=true)

router.get('/users', controller.listUsers);
router.post('/users', controller.createUser);
router.get('/users/:id', controller.getUser);
router.patch('/users/:id/toggle', controller.toggleUser);
router.patch('/users/:id/password', controller.resetPassword);
router.delete('/users/:id', controller.deleteUser);

// ─────────────────────────────────────────────────────────────
//  PERMISSÕES
// ─────────────────────────────────────────────────────────────

// GET  /admin/users/:id/permissions — lista permissões do usuário
// PUT  /admin/users/:id/permissions — substitui todas as permissões

router.get('/users/:id/permissions', controller.getPermissions);
router.put('/users/:id/permissions', controller.updatePermissions);

// ─────────────────────────────────────────────────────────────
//  ERROR TRACKING
// ─────────────────────────────────────────────────────────────

// GET    /admin/errors/stats                    — cards do dashboard
// GET    /admin/errors                          — lista com filtros + paginação
// GET    /admin/errors/:id                      — detalhe completo (stack, body)
// GET    /admin/errors/:fingerprint/occurrences — ocorrências do grupo
// POST   /admin/errors/:id/resolve              — marca como resolvido
// POST   /admin/errors/:id/unresolve            — reabre erro resolvido
// DELETE /admin/errors/clear                    — limpa resolvidos antigos
// DELETE /admin/errors/:id                      — remove erro ou grupo

router.use('/errors', errorsRoutes);

module.exports = router;