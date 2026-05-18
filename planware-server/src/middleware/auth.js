'use strict';

const jwt = require('jsonwebtoken');

// Verifica o token JWT e injeta req.user + req.tenantId em toda requisição autenticada.
// Rotas públicas (login, register) não passam por esse middleware.
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Token não fornecido' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // payload gerado no LoginService: { sub, tenantId, role, permissions }
    req.user = {
      id: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      permissions: payload.permissions ?? [],  // array de strings ex: ['STOCKPRO', 'FINVAULT']
    };

    next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Token expirado'
      : 'Token inválido';

    return res.status(401).json({ success: false, error: message });
  }
};