'use strict';

const repo                  = require('./BillingRepository');
const CreatePlanService     = require('./services/CreatePlanService');
const UpdatePlanService     = require('./services/UpdatePlanService');
const AssignPlanService     = require('./services/AssignPlanService');
const CreateChargeService   = require('./services/CreateChargeService');
const RegisterPaymentService = require('./services/RegisterPaymentService');
const MarkOverdueService    = require('./services/MarkOverdueService');
const CancelChargeService   = require('./services/CancelChargeService');
const { capture }           = require('../../lib/ErrorTracker');

const MODULE = 'BILLING';

// ─────────────────────────────────────────────────────────────
//  PLANOS
// ─────────────────────────────────────────────────────────────

async function listPlans(req, res) {
  try {
    const activeOnly = req.query.active === 'true';
    const data = await repo.findAllPlans({ activeOnly });
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function getPlan(req, res) {
  try {
    const plan = await repo.findPlanById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plano não encontrado' });
    return res.json({ success: true, data: plan });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createPlan(req, res) {
  try {
    const data = await CreatePlanService.execute(req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updatePlan(req, res) {
  try {
    const data = await UpdatePlanService.execute(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function togglePlan(req, res) {
  try {
    const plan = await repo.findPlanById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plano não encontrado' });
    const data = await repo.togglePlanActive(req.params.id, !plan.active);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
//  ASSINATURAS
// ─────────────────────────────────────────────────────────────

async function getTenantPlan(req, res) {
  try {
    const data = await repo.findTenantPlan(req.params.tenantId);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function assignPlan(req, res) {
  try {
    const data = await AssignPlanService.execute(req.params.tenantId, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function cancelTenantPlan(req, res) {
  try {
    const data = await repo.cancelTenantPlan(req.params.tenantId);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
//  COBRANÇAS
// ─────────────────────────────────────────────────────────────

async function listCharges(req, res) {
  try {
    const { tenantId, status, type, from, to, page, perPage } = req.query;
    const data = await repo.findAllCharges({ tenantId, status, type, from, to, page, perPage });
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function getCharge(req, res) {
  try {
    const charge = await repo.findChargeById(req.params.id);
    if (!charge) return res.status(404).json({ success: false, error: 'Cobrança não encontrada' });
    return res.json({ success: true, data: charge });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createCharge(req, res) {
  try {
    const data = await CreateChargeService.execute(req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updateCharge(req, res) {
  try {
    const charge = await repo.findChargeById(req.params.id);
    if (!charge) return res.status(404).json({ success: false, error: 'Cobrança não encontrada' });
    const data = await repo.updateCharge(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function cancelCharge(req, res) {
  try {
    const data = await CancelChargeService.execute(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function deleteCharge(req, res) {
  try {
    const charge = await repo.findChargeById(req.params.id);
    if (!charge) return res.status(404).json({ success: false, error: 'Cobrança não encontrada' });
    if (charge.status === 'PAID')
      return res.status(400).json({ success: false, error: 'Não é possível excluir cobrança paga' });
    await repo.deleteCharge(req.params.id);
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function markOverdue(req, res) {
  try {
    const data = await MarkOverdueService.execute();
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
//  PAGAMENTOS
// ─────────────────────────────────────────────────────────────

async function registerPayment(req, res) {
  try {
    const data = await RegisterPaymentService.execute(req.params.chargeId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function deletePayment(req, res) {
  try {
    const deleted = await repo.deletePayment(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Pagamento não encontrado' });
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD & TENANT FINANCEIRO
// ─────────────────────────────────────────────────────────────

async function getStats(req, res) {
  try {
    const data = await repo.getStats();
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function getTenantFinancial(req, res) {
  try {
    const data = await repo.getTenantFinancial(req.params.tenantId);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

module.exports = {
  // planos
  listPlans, getPlan, createPlan, updatePlan, togglePlan,
  // assinaturas
  getTenantPlan, assignPlan, cancelTenantPlan,
  // cobranças
  listCharges, getCharge, createCharge, updateCharge, cancelCharge, deleteCharge, markOverdue,
  // pagamentos
  registerPayment, deletePayment,
  // stats
  getStats, getTenantFinancial,
};
