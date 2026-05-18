'use strict';

const crypto = require('crypto');
const prisma = require('../db/client');

// ── Campos sensíveis removidos do requestBody antes de salvar ──
const SENSITIVE_KEYS = [
  'password', 'senha', 'passwordHash', 'token', 'accessToken',
  'refreshToken', 'secret', 'authorization', 'credit_card',
  'cvv', 'pin',
];

// ── Módulos reconhecidos (mapeados por prefixo de rota) ────────
const ROUTE_MODULE_MAP = [
  ['/clientpro', 'CLIENTPRO'],
  ['/stockpro', 'STOCKPRO'],
  ['/finvault', 'FINVAULT'],
  ['/finflow', 'FINFLOW'],
  ['/financeflow', 'FINANCEFLOW'],
  ['/kanban', 'KANBAN'],
  ['/clinica', 'CLINICA'],
  ['/ordemtech', 'ORDEMTECH'],
  ['/fiado', 'FIADO'],
  ['/admin', 'ADMIN'],
  ['/auth', 'AUTH'],
];

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Remove campos sensíveis de um objeto de forma recursiva.
 */
function sanitize(obj, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 4) return obj;
  if (Array.isArray(obj)) return obj.map(i => sanitize(i, depth + 1));

  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    if (SENSITIVE_KEYS.some(s => lower.includes(s))) {
      clean[k] = '[REDACTED]';
    } else {
      clean[k] = sanitize(v, depth + 1);
    }
  }
  return clean;
}

/**
 * Serializa o body da request para string JSON (max 4 KB).
 * Retorna null se vazio ou não serializável.
 */
function serializeBody(body) {
  if (!body || Object.keys(body).length === 0) return null;
  try {
    const clean = sanitize(body);
    const str = JSON.stringify(clean);
    return str.length > 4096 ? str.slice(0, 4096) + '…[truncado]' : str;
  } catch {
    return null;
  }
}

/**
 * Serializa query params para string (max 1 KB).
 */
function serializeQuery(query) {
  if (!query || Object.keys(query).length === 0) return null;
  try {
    const str = new URLSearchParams(query).toString();
    return str.length > 1024 ? str.slice(0, 1024) + '…' : str;
  } catch {
    return null;
  }
}

/**
 * Resolve o módulo a partir da rota da request.
 * Fallback para o parâmetro `module` passado manualmente.
 */
function resolveModule(path, fallback = 'UNKNOWN') {
  if (!path) return fallback;
  for (const [prefix, mod] of ROUTE_MODULE_MAP) {
    if (path.startsWith(prefix)) return mod;
  }
  return fallback;
}

/**
 * Determina o tipo do erro a partir do nome/código da classe.
 * Garante nomes legíveis para erros do Prisma.
 */
function resolveErrorType(err) {
  if (!err) return 'UnknownError';

  // Erros do Prisma — têm código no formato P2xxx
  if (err.code) {
    const map = {
      P2000: 'PrismaValueTooLong',
      P2001: 'PrismaRecordNotFound',
      P2002: 'PrismaUniqueConstraint',
      P2003: 'PrismaForeignKeyConstraint',
      P2025: 'PrismaRecordNotFound',
    };
    if (map[err.code]) return map[err.code];
    if (err.code.startsWith('P')) return `PrismaError_${err.code}`;
  }

  // Erros tipados criados pelas factories abaixo
  if (err.errorType) return err.errorType;

  // Nome da classe nativa
  return err.name || 'Error';
}

/**
 * Gera um fingerprint para agrupar ocorrências do mesmo erro.
 * hash(module + method + route_sem_ids + errorType + message[:120])
 */
function buildFingerprint(module, method, route, errorType, message) {
  // Remove UUIDs e IDs numéricos da rota para agrupar corretamente
  // ex: /clientes/abc-123-def → /clientes/:id
  const normalizedRoute = (route || '')
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':uuid')
    .replace(/\/\d+/g, '/:id');

  const raw = `${module}|${method}|${normalizedRoute}|${errorType}|${(message || '').slice(0, 120)}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

/**
 * Captura o IP real considerando proxies (Nginx, Cloudflare, etc.)
 */
function resolveIp(req) {
  return (
    req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers?.['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.ip ||
    null
  );
}

// ─────────────────────────────────────────────────────────────
//  FUNÇÃO PRINCIPAL — capture()
// ─────────────────────────────────────────────────────────────

/**
 * Registra um erro no banco de dados.
 *
 * @param {Error}  err     - O erro capturado no catch
 * @param {object} req     - O objeto request do Express (pode ser null em erros de background)
 * @param {object} options - { module?: string }
 */
async function capture(err, req, options = {}) {
  // Nunca lança — o tracker não pode quebrar a aplicação
  try {
    const statusCode = err?.status || err?.statusCode || 500;
    const route = req?.path || req?.url || 'unknown';
    const method = req?.method || 'UNKNOWN';
    const module = resolveModule(route, options.module || 'UNKNOWN');
    const errorType = resolveErrorType(err);
    const message = err?.message || 'Erro desconhecido';

    // Stack trace apenas para erros 5xx — 4xx são esperados
    const stack = statusCode >= 500
      ? (err?.stack || null)
      : null;

    // Contexto do usuário autenticado (injetado pelo middleware auth.js)
    const userId = req?.user?.id || null;
    const userEmail = req?.user?.email || null;
    const tenantId = req?.user?.tenantId || null;

    // Nome do tenant (desnormalizado para evitar JOIN)
    let tenantName = null;
    if (tenantId) {
      try {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { name: true },
        });
        tenantName = tenant?.name || null;
      } catch {
        // Silencia — não é crítico
      }
    }

    const fingerprint = buildFingerprint(module, method, route, errorType, message);

    await prisma.systemError.create({
      data: {
        tenantId,
        tenantName,
        userId,
        userEmail,
        module,
        route,
        method,
        statusCode,
        errorType,
        message: message.slice(0, 2000), // garante limite razoável
        stack: stack ? stack.slice(0, 8000) : null,
        requestBody: serializeBody(req?.body),
        queryParams: serializeQuery(req?.query),
        ip: resolveIp(req),
        userAgent: req?.headers?.['user-agent']?.slice(0, 300) || null,
        fingerprint,
        resolved: false,
      },
    });

  } catch (trackingError) {
    // Se o banco falhar ao salvar o erro, apenas loga — não propaga
    console.error('[errorTracker] Falha ao registrar erro:', trackingError?.message);
    console.error('[errorTracker] Erro original:', err?.message);
  }
}

// ─────────────────────────────────────────────────────────────
//  FACTORIES — erros tipados com status HTTP
//
//  Uso: throw notFound('Cliente não encontrado')
//       throw validation('Nome é obrigatório')
// ─────────────────────────────────────────────────────────────

function createError(message, status, errorType) {
  const err = new Error(message);
  err.status = status;
  err.errorType = errorType;
  return err;
}

const notFound = msg => createError(msg || 'Recurso não encontrado', 404, 'NotFoundError');
const validation = msg => createError(msg || 'Dados inválidos', 400, 'ValidationError');
const forbidden = msg => createError(msg || 'Acesso negado', 403, 'ForbiddenError');
const conflict = msg => createError(msg || 'Conflito de dados', 409, 'ConflictError');
const badRequest = msg => createError(msg || 'Requisição inválida', 400, 'BadRequestError');
const internal = msg => createError(msg || 'Erro interno do servidor', 500, 'InternalError');
const unauth = msg => createError(msg || 'Não autenticado', 401, 'UnauthorizedError');

// ─────────────────────────────────────────────────────────────
//  MIDDLEWARE GLOBAL — captura erros não tratados no Express
//
//  Adicionar no app.js APÓS todas as rotas:
//  app.use(errorTracker.globalMiddleware)
// ─────────────────────────────────────────────────────────────

async function globalMiddleware(err, req, res, next) {
  // Registra o erro
  await capture(err, req, {});

  // Responde ao cliente
  const status = err?.status || err?.statusCode || 500;
  const message = status < 500 ? err.message : 'Erro interno do servidor';

  if (!res.headersSent) {
    res.status(status).json({ ok: false, error: message });
  }
}

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  capture,
  globalMiddleware,
  // Factories
  notFound,
  validation,
  forbidden,
  conflict,
  badRequest,
  internal,
  unauth,
};