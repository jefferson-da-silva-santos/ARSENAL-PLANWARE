'use strict';

const CreateProductService = require('./services/CreateProductService');
const UpdateProductService = require('./services/UpdateProductService');
const DeleteProductService = require('./services/DeleteProductService');
const RegisterMovementService = require('./services/RegisterMovementService');
const GetDashboardService = require('./services/GetDashboardService');
const repo = require('./StockProRepository');
const { formatProduct, formatMovement } = require('./StockProUtils');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'STOCKPRO';

// ── Produtos ──────────────────────────────────────────────────

async function listProducts(req, res) {
  try {
    const products = await repo.findAllProducts(req.user.tenantId, req.query.search);
    return res.json(products.map(formatProduct));
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function getProduct(req, res) {
  try {
    const product = await repo.findProductById(req.user.tenantId, req.params.id);
    if (!product) return res.status(404).json({ error: 'Não encontrado' });
    return res.json(formatProduct(product));
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function createProduct(req, res) {
  try {
    const product = await CreateProductService.execute(req.user.tenantId, req.body);
    return res.status(201).json(product);
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await UpdateProductService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json(product);
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function deleteProduct(req, res) {
  try {
    await DeleteProductService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ── Movimentações ─────────────────────────────────────────────

async function listMovements(req, res) {
  try {
    const movements = await repo.findAllMovements(req.user.tenantId);
    return res.json(movements.map(formatMovement));
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function listMovementsByProduct(req, res) {
  try {
    const movements = await repo.findMovementsByProduct(req.user.tenantId, req.params.id);
    return res.json(movements.map(formatMovement));
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

async function registerMovement(req, res) {
  try {
    await RegisterMovementService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(req, res) {
  try {
    const raw = await GetDashboardService.execute(req.user.tenantId);
    return res.json({
      ...raw,
      recentMovements: raw.recentMovements.map(formatMovement),
    });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ── Alertas ───────────────────────────────────────────────────

async function getAlerts(req, res) {
  try {
    const products = await repo.getLowStockProducts(req.user.tenantId);
    return res.json(products);
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ── PDF ───────────────────────────────────────────────────────

async function reportPdf(req, res) {
  try {
    const products = await repo.findAllProducts(req.user.tenantId);
    return res.json(products.map(formatProduct));
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  listProducts, getProduct, createProduct, updateProduct, deleteProduct,
  listMovements, listMovementsByProduct, registerMovement,
  getDashboard, getAlerts, reportPdf,
};