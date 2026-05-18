'use strict';

const { Router } = require('express');
const controller = require('./StockProController');

const router = Router();

// ─────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────
router.get('/api/dashboard', controller.getDashboard);

// ─────────────────────────────────────────────────────────────
//  ALERTAS — estoque baixo (frontend chama /alerts no useEffect)
// ─────────────────────────────────────────────────────────────
router.get('/api/alerts', controller.getAlerts);

// ─────────────────────────────────────────────────────────────
//  RELATÓRIO PDF
// ─────────────────────────────────────────────────────────────
router.get('/api/report/pdf', controller.reportPdf);

// ─────────────────────────────────────────────────────────────
//  PRODUTOS
// ─────────────────────────────────────────────────────────────
router.get('/api/products',        controller.listProducts);
router.get('/api/products/:id',    controller.getProduct);
router.post('/api/products',       controller.createProduct);
router.put('/api/products/:id',    controller.updateProduct);
router.delete('/api/products/:id', controller.deleteProduct);

// ─────────────────────────────────────────────────────────────
//  MOVIMENTAÇÕES
//  ATENÇÃO: rota geral /movements ANTES da específica /movements/:id
// ─────────────────────────────────────────────────────────────
router.get('/api/movements',     controller.listMovements);
router.get('/api/movements/:id', controller.listMovementsByProduct);
router.post('/api/movements',    controller.registerMovement);

module.exports = router;