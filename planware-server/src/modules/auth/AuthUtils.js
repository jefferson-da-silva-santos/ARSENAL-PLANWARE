'use strict';

const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não definido nas variáveis de ambiente');
  return secret;
}

// ── Access Token ─────────────────────────────────────────────
// Curta duração — carrega identidade e permissões do usuário
function signAccessToken(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getSecret());
}

// ── Refresh Token ────────────────────────────────────────────
// Longa duração — carrega apenas o sub (id do usuário)
function signRefreshToken(payload) {
  return jwt.sign(payload, getSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch (err) {
    const error = new Error(
      err.name === 'TokenExpiredError' ? 'Refresh token expirado' : 'Refresh token inválido'
    );
    error.status = 401;
    throw error;
  }
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};