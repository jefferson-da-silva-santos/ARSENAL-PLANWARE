'use strict';

const GetMonthService = require('./services/GetMonthService');
const SaveCategoriesService = require('./services/SaveCategoriesService');
const CreateTransactionService = require('./services/CreateTransactionService');
const UpdateTransactionService = require('./services/UpdateTransactionService');
const DeleteTransactionService = require('./services/DeleteTransactionService');
const CreateIncomeService = require('./services/CreateIncomeService');
const UpdateIncomeService = require('./services/UpdateIncomeService');
const DeleteIncomeService = require('./services/DeleteIncomeService');
const GetSummaryService = require('./services/GetSummaryService');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'FINANCEFLOW';

async function getMonth(req, res) {
  try {
    const data = await GetMonthService.execute(
      req.user.tenantId,
      parseInt(req.params.year),
      parseInt(req.params.month),
    );
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function saveCategorisByMonthId(req, res) {
  try {
    const data = await SaveCategoriesService.execute(
      req.user.tenantId,
      req.params.monthId,
      req.body.categories,
    );
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createTransaction(req, res) {
  try {
    const data = await CreateTransactionService.execute(req.user.tenantId, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updateTransaction(req, res) {
  try {
    const data = await UpdateTransactionService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function deleteTransaction(req, res) {
  try {
    const deleteAll = req.query.all === 'true';
    const data = await DeleteTransactionService.execute(req.params.id, deleteAll);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createIncome(req, res) {
  try {
    const data = await CreateIncomeService.execute(req.user.tenantId, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updateIncome(req, res) {
  try {
    const data = await UpdateIncomeService.execute(req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function deleteIncome(req, res) {
  try {
    const data = await DeleteIncomeService.execute(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function getSummary(req, res) {
  try {
    const data = await GetSummaryService.execute(
      req.user.tenantId,
      parseInt(req.params.year),
      parseInt(req.params.month),
    );
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getMonth, saveCategorisByMonthId,
  createTransaction, updateTransaction, deleteTransaction,
  createIncome, updateIncome, deleteIncome,
  getSummary,
};