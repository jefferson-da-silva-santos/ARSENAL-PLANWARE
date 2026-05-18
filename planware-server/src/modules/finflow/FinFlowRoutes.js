'use strict';

const { Router } = require('express');
const controller = require('./FinFlowController');

const router = Router();

// Meses
router.get('/api/months/:year/:month', controller.getMonth);
router.put('/api/months/:year/:month', controller.updateMonth);

// Transações por mês
router.get('/api/months/:year/:month/transactions', controller.getTransactions);

// Transações CRUD
router.post('/api/transactions', controller.createTransaction);
router.put('/api/transactions/:id', controller.updateTransaction);
router.delete('/api/transactions/:id', controller.deleteTransaction);
router.patch('/api/transactions/:id/toggle-paid', controller.togglePaid);

// Grupo de parcelas
router.delete('/api/transactions/group/:groupId', async (req, res) => {
  try {
    const prisma = require('../../db/client');
    const result = await prisma.flowTransaction.deleteMany({
      where: { installmentGroupId: req.params.groupId },
    });
    return res.json({ success: true, data: { deleted: result.count } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Upcoming
router.get('/api/upcoming', controller.getUpcoming);

// Resumo anual
router.get('/api/year/:year', controller.getYearSummary);

// Entradas por mês
router.get('/api/months/:year/:month/incomes', controller.getIncomes);

// Entradas CRUD
router.post('/api/incomes', controller.createIncome);
router.put('/api/incomes/:id', controller.updateIncome);
router.delete('/api/incomes/:id', controller.deleteIncome);
router.patch('/api/incomes/:id/toggle-received', controller.toggleReceived);

module.exports = router;