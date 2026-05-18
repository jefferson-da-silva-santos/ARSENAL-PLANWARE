'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../../../db/client');
const { signAccessToken, signRefreshToken } = require('../AuthUtils');

const SALT_ROUNDS = 12;

// Cria um novo usuário vinculado a um tenant existente.
// Apenas o superadmin pode criar usuários — essa rota é chamada
// internamente pelo AdminController. Para o seed do primeiro
// superadmin, use o script prisma/seed.js.
async function execute({ tenantId, name, email, password, role = 'USER' }) {
  if (!tenantId || !name || !email || !password) {
    const err = new Error('tenantId, name, email e password são obrigatórios');
    err.status = 400;
    throw err;
  }

  if (password.length < 8) {
    const err = new Error('A senha deve ter no mínimo 8 caracteres');
    err.status = 400;
    throw err;
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Verifica duplicidade
  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    const err = new Error('Este e-mail já está em uso');
    err.status = 409;
    throw err;
  }

  // Verifica se o tenant existe e está ativo
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant || !tenant.active) {
    const err = new Error('Tenant não encontrado ou inativo');
    err.status = 404;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      tenantId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
    },
  });

  const payload = {
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role,
    permissions: [],
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
      permissions: [],
    },
  };
}

module.exports = { execute };