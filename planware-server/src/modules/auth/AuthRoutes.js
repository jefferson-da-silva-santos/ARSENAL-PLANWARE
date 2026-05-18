'use strict';

const { Router } = require('express');
const controller = require('./AuthController');
const auth = require('../../middleware/auth');

const router = Router();

// ── Rotas públicas ───────────────────────────────────────────

// POST /auth/login
// Body: { email, password }
router.post('/login', controller.login);

// POST /auth/refresh
// Body: { refreshToken }
router.post('/refresh', controller.refresh);

// ── Rotas protegidas ─────────────────────────────────────────

// GET /auth/me — retorna dados do usuário autenticado
router.get('/me', auth, controller.me);

// POST /auth/register — chamada internamente pelo admin
// Protegida: apenas superadmin deve chamar isso via AdminRoutes.
// Exposta aqui para flexibilidade, mas o AdminController
// é quem orquestra a criação de usuários com permissões.
router.post('/register', auth, controller.register);

module.exports = router;