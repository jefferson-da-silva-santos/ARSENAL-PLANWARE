'use strict';

const { Router } = require('express');
const controller = require('./OrdemTechController');

const router = Router();

router.get('/clientes', controller.listClientes);
router.post('/clientes', controller.createCliente);
router.put('/clientes/:id', controller.updateCliente);

router.get('/ordens', controller.listOrdens);
router.get('/ordens/:id', controller.getOrdem);
router.post('/ordens', controller.createOrdem);
router.put('/ordens/:id', controller.updateOrdem);
router.patch('/ordens/:id/status', controller.updateOrdemStatus);
router.delete('/ordens/:id', controller.deleteOrdem);

router.get('/dashboard', controller.getDashboard);

module.exports = router;