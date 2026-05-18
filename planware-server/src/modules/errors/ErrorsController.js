'use strict';

const ListErrorsService = require('./services/ListErrorsService');
const GetErrorService = require('./services/GetErrorService');
const GetErrorOccurrencesService = require('./services/GetErrorOccurrencesService');
const GetErrorStatsService = require('./services/GetErrorStatsService');
const ResolveErrorService = require('./services/ResolveErrorService');
const UnresolveErrorService = require('./services/UnresolveErrorService');
const DeleteErrorService = require('./services/DeleteErrorService');
const ClearResolvedService = require('./services/ClearResolvedService');

// ── GET /admin/errors/stats ───────────────────────────────────
async function getStats(req, res) {
  try {
    const data = await GetErrorStatsService.execute();
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── GET /admin/errors ─────────────────────────────────────────
// Query params: module, tenantId, resolved, statusCode, from, to, q,
//               page, perPage, grouped
async function listErrors(req, res) {
  try {
    const data = await ListErrorsService.execute(req.query);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── GET /admin/errors/:id ─────────────────────────────────────
async function getError(req, res) {
  try {
    const data = await GetErrorService.execute(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── GET /admin/errors/:fingerprint/occurrences ────────────────
async function getOccurrences(req, res) {
  try {
    const data = await GetErrorOccurrencesService.execute(
      req.params.fingerprint,
      { page: req.query.page, perPage: req.query.perPage }
    );
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── POST /admin/errors/:id/resolve ───────────────────────────
// Body: { resolution?: string, fingerprint?: string }
async function resolveError(req, res) {
  try {
    const resolvedBy = req.user?.email || 'superadmin';
    const data = await ResolveErrorService.execute(req.params.id, {
      ...req.body,
      resolvedBy,
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── POST /admin/errors/:id/unresolve ─────────────────────────
async function unresolveError(req, res) {
  try {
    const data = await UnresolveErrorService.execute(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── DELETE /admin/errors/clear ───────────────────────────────
// Query: ?days=30
async function clearResolved(req, res) {
  try {
    const data = await ClearResolvedService.execute(req.query.days);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── DELETE /admin/errors/:id ─────────────────────────────────
// Query: ?fingerprint=abc123 (opcional — apaga o grupo inteiro)
async function deleteError(req, res) {
  try {
    const data = await DeleteErrorService.execute(req.params.id, req.query.fingerprint);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getStats,
  listErrors,
  getError,
  getOccurrences,
  resolveError,
  unresolveError,
  clearResolved,
  deleteError,
};