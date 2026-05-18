'use strict';

const { Router } = require('express');
const controller = require('./FiadoController');

const router = Router();

// Clientes — rota de busca ANTES da dinâmica /:id
router.get('/clientes/busca', controller.listClientes);
router.get('/clientes', controller.listClientes);
router.get('/clientes/:id', controller.getCliente);
router.post('/clientes', controller.createCliente);
router.put('/clientes/:id', controller.updateCliente);
router.delete('/clientes/:id', controller.deleteCliente);

// Contas por cliente
router.get('/clientes/:id/contas', controller.listContas);

// Contas
router.post('/contas', controller.createConta);
router.delete('/contas/:id', controller.deleteConta);

// Parcelas por conta
router.get('/contas/:id/parcelas', controller.listParcelas);

// Parcelas — ações
router.patch('/parcelas/:id/pagar', controller.pagarParcela);
router.patch('/parcelas/:id/estornar', controller.estornarParcela);

// Dashboard
router.get('/dashboard', controller.getDashboard);

module.exports = router;