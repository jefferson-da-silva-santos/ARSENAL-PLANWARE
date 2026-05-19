'use strict';

const { Router } = require('express');
const controller = require('./BillingController');

const router = Router();

// ─────────────────────────────────────────────────────────────
//  DASHBOARD
//  GET  /admin/billing/stats
//  POST /admin/billing/charges/mark-overdue
// ─────────────────────────────────────────────────────────────
router.get('/stats',                    controller.getStats);
router.post('/charges/mark-overdue',    controller.markOverdue);

// ─────────────────────────────────────────────────────────────
//  PLANOS
//  GET    /admin/billing/plans
//  POST   /admin/billing/plans
//  GET    /admin/billing/plans/:id
//  PATCH  /admin/billing/plans/:id
//  PATCH  /admin/billing/plans/:id/toggle
// ─────────────────────────────────────────────────────────────
router.get('/plans',                    controller.listPlans);
router.post('/plans',                   controller.createPlan);
router.get('/plans/:id',                controller.getPlan);
router.patch('/plans/:id',              controller.updatePlan);
router.patch('/plans/:id/toggle',       controller.togglePlan);

// ─────────────────────────────────────────────────────────────
//  ASSINATURAS POR TENANT
//  GET    /admin/billing/tenants/:tenantId/plan
//  PUT    /admin/billing/tenants/:tenantId/plan
//  DELETE /admin/billing/tenants/:tenantId/plan
//  GET    /admin/billing/tenants/:tenantId/financial
// ─────────────────────────────────────────────────────────────
router.get('/tenants/:tenantId/plan',       controller.getTenantPlan);
router.put('/tenants/:tenantId/plan',       controller.assignPlan);
router.delete('/tenants/:tenantId/plan',    controller.cancelTenantPlan);
router.get('/tenants/:tenantId/financial',  controller.getTenantFinancial);

// ─────────────────────────────────────────────────────────────
//  COBRANÇAS
//  GET    /admin/billing/charges
//  POST   /admin/billing/charges
//  GET    /admin/billing/charges/:id
//  PATCH  /admin/billing/charges/:id
//  POST   /admin/billing/charges/:id/cancel
//  DELETE /admin/billing/charges/:id
// ─────────────────────────────────────────────────────────────
router.get('/charges',                      controller.listCharges);
router.post('/charges',                     controller.createCharge);
router.get('/charges/:id',                  controller.getCharge);
router.patch('/charges/:id',                controller.updateCharge);
router.post('/charges/:id/cancel',          controller.cancelCharge);
router.delete('/charges/:id',               controller.deleteCharge);

// ─────────────────────────────────────────────────────────────
//  PAGAMENTOS
//  POST   /admin/billing/charges/:chargeId/payments
//  DELETE /admin/billing/payments/:id
// ─────────────────────────────────────────────────────────────
router.post('/charges/:chargeId/payments',  controller.registerPayment);
router.delete('/payments/:id',              controller.deletePayment);

module.exports = router;
