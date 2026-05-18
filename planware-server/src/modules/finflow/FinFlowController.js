'use strict';

const GetMonthService = require('./services/GetMonthService');
const UpdateMonthService = require('./services/UpdateMonthService');
const CreateTransactionService = require('./services/CreateTransactionService');
const UpdateTransactionService = require('./services/UpdateTransactionService');
const DeleteTransactionService = require('./services/DeleteTransactionService');
const TogglePaidService = require('./services/TogglePaidService');
const CreateIncomeService = require('./services/CreateIncomeService');
const UpdateIncomeService = require('./services/UpdateIncomeService');
const DeleteIncomeService = require('./services/DeleteIncomeService');
const GetYearSummaryService = require('./services/GetYearSummaryService');
const repo = require('./FinFlowRepository');
const { formatTransaction, formatIncome } = require('./FinFlowUtils');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'FINFLOW';

// ── Meses ─────────────────────────────────────────────────────

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

async function updateMonth(req, res) {
  try {
    const data = await UpdateMonthService.execute(
      req.user.tenantId,
      parseInt(req.params.year),
      parseInt(req.params.month),
      req.body,
    );
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── Transações ────────────────────────────────────────────────

async function getTransactions(req, res) {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const row = await repo.findOrCreateMonth(req.user.tenantId, year, month);
    const txs = await repo.findTransactionsByMonth(row.id);
    return res.json({ success: true, data: txs.map(formatTransaction) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createTransaction(req, res) {
  try {
    const data = await CreateTransactionService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
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

async function togglePaid(req, res) {
  try {
    const data = await TogglePaidService.execute(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function getUpcoming(req, res) {
  try {
    const txs = await repo.findUpcoming(req.user.tenantId);
    return res.json({ success: true, data: txs.map(formatTransaction) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── Entradas ──────────────────────────────────────────────────

async function getIncomes(req, res) {
  try {
    const year = parseInt(req.params.year);
    const month = parseInt(req.params.month);
    const row = await repo.findOrCreateMonth(req.user.tenantId, year, month);
    const data = await repo.findIncomesByMonth(row.id);
    return res.json({ success: true, data: data.map(formatIncome) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createIncome(req, res) {
  try {
    const data = await CreateIncomeService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
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

async function toggleReceived(req, res) {
  try {
    const entry = await repo.findIncomeById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, error: 'Entrada não encontrada' });
    const updated = await repo.toggleReceived(req.params.id, !entry.received);
    return res.json({ success: true, data: { id: updated.id, received: updated.received } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── Resumo anual ──────────────────────────────────────────────

async function getYearSummary(req, res) {
  try {
    const data = await GetYearSummaryService.execute(req.user.tenantId, parseInt(req.params.year));
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getMonth, updateMonth,
  getTransactions, createTransaction, updateTransaction, deleteTransaction, togglePaid, getUpcoming,
  getIncomes, createIncome, updateIncome, deleteIncome, toggleReceived,
  getYearSummary,
};