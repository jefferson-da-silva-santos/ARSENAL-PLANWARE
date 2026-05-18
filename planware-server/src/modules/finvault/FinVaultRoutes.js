'use strict';

const { Router } = require('express');
const controller = require('./FinVaultController');

const router = Router();

// ─────────────────────────────────────────────────────────────
//  TRANSAÇÕES
// ─────────────────────────────────────────────────────────────
router.post('/api/transactions',        controller.createTransaction);
router.get('/api/transactions',         controller.listTransactions);
router.delete('/api/transactions/:id',  controller.deleteTransaction);

// ─────────────────────────────────────────────────────────────
//  RESUMOS
// ─────────────────────────────────────────────────────────────
router.get('/api/summary/:month',  controller.getSummary);
router.get('/api/daily/:date',     controller.getDailyCash);

// ─────────────────────────────────────────────────────────────
//  GRÁFICOS
// ─────────────────────────────────────────────────────────────
router.get('/api/charts/category', controller.getCategoryChart);
router.get('/api/charts/monthly',  controller.getMonthlyChart);

// ─────────────────────────────────────────────────────────────
//  ALERTAS E RELATÓRIO
// ─────────────────────────────────────────────────────────────
router.get('/api/alerts',      controller.checkAlerts);
router.get('/api/report/pdf',  controller.getPdfReport);

module.exports = router;