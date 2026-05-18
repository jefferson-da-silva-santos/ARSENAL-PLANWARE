'use strict';

// ── requireRole('SUPERADMIN') ────────────────────────────────
// Bloqueia qualquer usuário que não tenha o papel especificado.
// Uso: router.use(requireRole('SUPERADMIN'))
function requireRole(role) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    if (req.user.role !== role) {
      return res.status(403).json({ success: false, error: 'Acesso negado' });
    }

    next();
  };
}

// ── requireSystem('STOCKPRO') ────────────────────────────────
// Garante que o usuário tem permissão para o sistema específico.
// Superadmin sempre passa — só usuários comuns são verificados.
// Uso: router.use(requireSystem('STOCKPRO'))
function requireSystem(system) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Não autenticado' });
    }

    // Superadmin tem acesso irrestrito
    if (req.user.role === 'SUPERADMIN') {
      return next();
    }

    if (!req.user.permissions.includes(system)) {
      return res.status(403).json({
        success: false,
        error: `Seu usuário não tem acesso ao sistema ${system}`,
      });
    }

    next();
  };
}

module.exports = { requireRole, requireSystem };