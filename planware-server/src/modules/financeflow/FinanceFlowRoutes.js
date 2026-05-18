'use strict';

const { Router } = require('express');
const controller = require('./FinanceFlowController');

const router = Router();

// Mês completo (categorias + transações + entradas)
router.get('/api/months/:year/:month', controller.getMonth);

// Categorias do mês
router.put('/api/categories/month/:monthId', controller.saveCategorisByMonthId);

// Transações
router.post('/api/transactions', controller.createTransaction);
router.patch('/api/transactions/:id', controller.updateTransaction);
router.delete('/api/transactions/:id', controller.deleteTransaction);

// Entradas
router.post('/api/incomes', controller.createIncome);
router.patch('/api/incomes/:id', controller.updateIncome);
router.delete('/api/incomes/:id', controller.deleteIncome);

// Resumo / dashboard
router.get('/api/summary/:year/:month', controller.getSummary);

module.exports = router;