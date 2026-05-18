'use strict';

const CreateTransactionService = require('./services/CreateTransactionService');
const DeleteTransactionService = require('./services/DeleteTransactionService');
const GetSummaryService = require('./services/GetSummaryService');
const GetCategoryChartService = require('./services/GetCategoryChartService');
const GetMonthlyChartService = require('./services/GetMonthlyChartService');
const CheckAlertsService = require('./services/CheckAlertsService');
const GeneratePdfReportService = require('./services/GeneratePdfReportService');
const repo = require('./FinVaultRepository');
const { validateListQuery, formatTransaction } = require('./FinVaultUtils');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'FINVAULT';

async function createTransaction(req, res) {
  try {
    const tx = await CreateTransactionService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, id: tx.id });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function listTransactions(req, res) {
  try {
    const errors = validateListQuery(req.query);
    if (errors.length) return res.status(400).json({ error: 'Erro de validação', details: errors });
    const txs = await repo.findAllTransactions(req.user.tenantId, {
      type: req.query.type?.toUpperCase(),
      category: req.query.category,
      from: req.query.from,
      to: req.query.to,
      limit: req.query.limit ? Number(req.query.limit) : 200,
    });
    return res.json(txs.map(formatTransaction));
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function deleteTransaction(req, res) {
  try {
    await DeleteTransactionService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function getSummary(req, res) {
  try {
    const data = await GetSummaryService.execute(req.user.tenantId, req.params.month);
    return res.json(data);
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function getDailyCash(req, res) {
  try {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.params.date)) {
      return res.status(400).json({ error: 'date deve estar no formato YYYY-MM-DD' });
    }
    const data = await repo.getDailyCash(req.user.tenantId, req.params.date);
    return res.json(data);
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function getCategoryChart(req, res) {
  try {
    const type = req.query.type === 'income' ? 'income' : 'expense';
    const data = await GetCategoryChartService.execute(req.user.tenantId, type);
    return res.json(data);
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function getMonthlyChart(req, res) {
  try {
    const data = await GetMonthlyChartService.execute(req.user.tenantId);
    return res.json(data);
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function checkAlerts(req, res) {
  try {
    const data = await CheckAlertsService.execute(req.user.tenantId);
    return res.json(data);
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function getPdfReport(req, res) {
  try {
    await GeneratePdfReportService.execute(req.user.tenantId, res);
  } catch (err) {
    await capture(err, req, { module: MODULE });
    if (!res.headersSent) return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createTransaction, listTransactions, deleteTransaction,
  getSummary, getDailyCash,
  getCategoryChart, getMonthlyChart,
  checkAlerts, getPdfReport,
};