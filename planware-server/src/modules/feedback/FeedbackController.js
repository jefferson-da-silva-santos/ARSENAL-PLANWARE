'use strict';

const CreateFeedbackService = require('./services/CreateFeedbackService');
const UpdateFeedbackStatusService = require('./services/UpdateFeedbackStatusService');
const DeleteFeedbackService = require('./services/DeleteFeedbackService');
const GetFeedbacksByTenantService = require('./services/GetFeedbacksByTenantService');
const GetAllFeedbacksService = require('./services/GetAllFeedbacksService');
const AddAdminReplyService = require('./services/AddAdminReplyService');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'FEEDBACK';

// ── Usuário comum ─────────────────────────────────────────────

async function listMyFeedbacks(req, res) {
  try {
    const { type, status } = req.query;
    const data = await GetFeedbacksByTenantService.execute(req.user.tenantId, { type, status });
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createFeedback(req, res) {
  try {
    const data = await CreateFeedbackService.execute({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function deleteFeedback(req, res) {
  try {
    const data = await DeleteFeedbackService.execute(req.params.id, req.user.tenantId);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── Superadmin ────────────────────────────────────────────────

async function listAllFeedbacks(req, res) {
  try {
    const { type, status, tenantId } = req.query;
    const data = await GetAllFeedbacksService.execute({ type, status, tenantId });
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const data = await UpdateFeedbackStatusService.execute(req.params.id, req.body.status);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function adminDeleteFeedback(req, res) {
  try {
    const data = await DeleteFeedbackService.execute(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function addReply(req, res) {
  try {
    const data = await AddAdminReplyService.execute(
      req.params.id,
      req.user.id,
      req.body.message,
    );
    return res.status(201).json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listMyFeedbacks, createFeedback, deleteFeedback,
  listAllFeedbacks, updateStatus, adminDeleteFeedback, addReply,
};