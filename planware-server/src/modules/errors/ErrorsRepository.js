'use strict';

const prisma = require('../../db/client');

// ─────────────────────────────────────────────────────────────
//  QUERIES
// ─────────────────────────────────────────────────────────────

/**
 * Monta o objeto WHERE a partir dos filtros recebidos.
 * Centralizado aqui para não repetir em findAll e count.
 */
function buildWhere({ module, tenantId, resolved, statusCode, from, to, q }) {
  const where = {};

  if (module)     where.module     = module.toUpperCase();
  if (tenantId)   where.tenantId   = tenantId;
  if (statusCode) where.statusCode = parseInt(statusCode);

  if (resolved !== undefined && resolved !== null && resolved !== '') {
    where.resolved = resolved === 'true' || resolved === true;
  }

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to)   where.createdAt.lte = new Date(to + 'T23:59:59');
  }

  if (q) {
    where.OR = [
      { message:    { contains: q, mode: 'insensitive' } },
      { route:      { contains: q, mode: 'insensitive' } },
      { userEmail:  { contains: q, mode: 'insensitive' } },
      { tenantName: { contains: q, mode: 'insensitive' } },
      { errorType:  { contains: q, mode: 'insensitive' } },
    ];
  }

  return where;
}

// ── Listagem com filtros + paginação ──────────────────────────

async function findAll(filters, { page = 1, perPage = 50 } = {}) {
  const where = buildWhere(filters);
  const take  = Math.min(parseInt(perPage) || 50, 200);
  const skip  = (Math.max(parseInt(page) || 1, 1) - 1) * take;

  const [total, errors] = await Promise.all([
    prisma.systemError.count({ where }),
    prisma.systemError.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      // Listagem não traz stack/body (pesados) — só o detalhe traz
      select: {
        id:          true,
        module:      true,
        route:       true,
        method:      true,
        statusCode:  true,
        errorType:   true,
        message:     true,
        tenantId:    true,
        tenantName:  true,
        userId:      true,
        userEmail:   true,
        ip:          true,
        resolved:    true,
        resolvedAt:  true,
        resolvedBy:  true,
        resolution:  true,
        fingerprint: true,
        createdAt:   true,
      },
    }),
  ]);

  return { errors, total, page: parseInt(page), perPage: take };
}

// ── Agrupado por fingerprint ──────────────────────────────────

async function findAllGrouped(filters) {
  const where = buildWhere(filters);

  // Busca mais registros para agrupar corretamente em memória
  const errors = await prisma.systemError.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1000,
    select: {
      id:          true,
      module:      true,
      route:       true,
      method:      true,
      statusCode:  true,
      errorType:   true,
      message:     true,
      tenantId:    true,
      tenantName:  true,
      userEmail:   true,
      resolved:    true,
      fingerprint: true,
      createdAt:   true,
    },
  });

  // Agrupa por fingerprint — mantém o mais recente como representante
  const groups = new Map();
  for (const err of errors) {
    const fp = err.fingerprint || err.id;
    if (!groups.has(fp)) {
      groups.set(fp, { ...err, count: 0, firstSeenAt: err.createdAt, latestAt: err.createdAt });
    }
    const g = groups.get(fp);
    g.count++;
    if (err.createdAt > g.latestAt)  g.latestAt  = err.createdAt;
    if (err.createdAt < g.firstSeenAt) g.firstSeenAt = err.createdAt;
  }

  return Object.values(Object.fromEntries(groups))
    .sort((a, b) => b.count - a.count);
}

// ── Detalhe completo (inclui stack e requestBody) ─────────────

async function findById(id) {
  return prisma.systemError.findUnique({ where: { id } });
}

// ── Todos de um fingerprint (para ver ocorrências) ────────────

async function findByFingerprint(fingerprint, { page = 1, perPage = 20 } = {}) {
  const take = Math.min(parseInt(perPage) || 20, 100);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

  const [total, errors] = await Promise.all([
    prisma.systemError.count({ where: { fingerprint } }),
    prisma.systemError.findMany({
      where:   { fingerprint },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    }),
  ]);

  return { errors, total, page: parseInt(page), perPage: take };
}

// ── Stats para os cards do dashboard ─────────────────────────

async function getStats() {
  const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const last7d  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000);

  const [total, unresolved, critical, last24hCount, byModule, topErrors] = await Promise.all([

    prisma.systemError.count(),

    prisma.systemError.count({ where: { resolved: false } }),

    prisma.systemError.count({
      where: { statusCode: { gte: 500 }, resolved: false },
    }),

    prisma.systemError.count({
      where: { createdAt: { gte: last24h } },
    }),

    // Erros não resolvidos agrupados por módulo
    prisma.systemError.groupBy({
      by:      ['module'],
      where:   { resolved: false },
      _count:  { module: true },
      orderBy: { _count: { module: 'desc' } },
    }),

    // Top 5 erros mais frequentes (não resolvidos, últimos 7 dias)
    prisma.systemError.groupBy({
      by:      ['fingerprint', 'module', 'route', 'method', 'errorType', 'message'],
      where:   { resolved: false, createdAt: { gte: last7d }, fingerprint: { not: null } },
      _count:  { fingerprint: true },
      orderBy: { _count: { fingerprint: 'desc' } },
      take: 5,
    }),
  ]);

  return {
    total,
    unresolved,
    critical,
    last24h: last24hCount,
    byModule: byModule.map(m => ({ module: m.module, count: m._count.module })),
    topErrors: topErrors.map(e => ({
      fingerprint: e.fingerprint,
      module:      e.module,
      route:       e.route,
      method:      e.method,
      errorType:   e.errorType,
      message:     e.message,
      count:       e._count.fingerprint,
    })),
  };
}

// ── Resolve erro(s) ───────────────────────────────────────────

async function resolveOne(id, { resolvedBy, resolution }) {
  return prisma.systemError.update({
    where: { id },
    data:  {
      resolved:   true,
      resolvedAt: new Date(),
      resolvedBy: resolvedBy || null,
      resolution: resolution || null,
    },
  });
}

async function resolveByFingerprint(fingerprint, { resolvedBy, resolution }) {
  return prisma.systemError.updateMany({
    where: { fingerprint, resolved: false },
    data:  {
      resolved:   true,
      resolvedAt: new Date(),
      resolvedBy: resolvedBy || null,
      resolution: resolution || null,
    },
  });
}

// ── Desfaz resolução ──────────────────────────────────────────

async function unresolveOne(id) {
  return prisma.systemError.update({
    where: { id },
    data:  { resolved: false, resolvedAt: null, resolvedBy: null, resolution: null },
  });
}

// ── Delete ────────────────────────────────────────────────────

async function deleteOne(id) {
  return prisma.systemError.delete({ where: { id } });
}

async function deleteByFingerprint(fingerprint) {
  return prisma.systemError.deleteMany({ where: { fingerprint } });
}

// ── Limpeza de erros resolvidos antigos ───────────────────────

async function clearResolved(olderThanDays = 30) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  return prisma.systemError.deleteMany({
    where: { resolved: true, resolvedAt: { lte: cutoff } },
  });
}

module.exports = {
  findAll,
  findAllGrouped,
  findById,
  findByFingerprint,
  getStats,
  resolveOne,
  resolveByFingerprint,
  unresolveOne,
  deleteOne,
  deleteByFingerprint,
  clearResolved,
};