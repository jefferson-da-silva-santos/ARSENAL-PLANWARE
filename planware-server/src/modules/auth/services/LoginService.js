'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../../../db/client');
const { signAccessToken, signRefreshToken } = require('../AuthUtils');

// Autentica o usuário com email + senha.
// Retorna accessToken, refreshToken e dados básicos do usuário.
async function execute({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email e senha são obrigatórios');
    err.status = 400;
    throw err;
  }

  // Busca usuário ativo com suas permissões
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: {
      permissions: {
        where: { granted: true },
        select: { system: true },
      },
    },
  });

  if (!user || !user.active) {
    const err = new Error('Credenciais inválidas');
    err.status = 401;
    throw err;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatch) {
    const err = new Error('Credenciais inválidas');
    err.status = 401;
    throw err;
  }

  const permissions = user.permissions.map((p) => p.system);

  const payload = {
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role,
    permissions,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user.id });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      permissions,
    },
  };
}

module.exports = { execute };