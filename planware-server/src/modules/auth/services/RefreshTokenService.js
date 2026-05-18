'use strict';

const prisma = require('../../../db/client');
const { verifyRefreshToken, signAccessToken, signRefreshToken } = require('../AuthUtils');

// Recebe um refreshToken válido e devolve um novo par accessToken + refreshToken.
// Estratégia de rotação: cada uso gera um novo refreshToken,
// invalidando o anterior implicitamente (stateless — sem blacklist por ora).
async function execute({ refreshToken }) {
  if (!refreshToken) {
    const err = new Error('refreshToken é obrigatório');
    err.status = 400;
    throw err;
  }

  // Valida assinatura e expiração
  const payload = verifyRefreshToken(refreshToken);

  // Recarrega usuário para garantir que ainda está ativo
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: {
      permissions: {
        where: { granted: true },
        select: { system: true },
      },
    },
  });

  if (!user || !user.active) {
    const err = new Error('Usuário não encontrado ou inativo');
    err.status = 401;
    throw err;
  }

  const permissions = user.permissions.map((p) => p.system);

  const accessPayload = {
    sub: user.id,
    tenantId: user.tenantId,
    role: user.role,
    permissions,
  };

  const newAccessToken = signAccessToken(accessPayload);
  const newRefreshToken = signRefreshToken({ sub: user.id });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

module.exports = { execute };