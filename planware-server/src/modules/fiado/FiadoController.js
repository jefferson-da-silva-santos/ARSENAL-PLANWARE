'use strict';

const repo = require('./FiadoRepository');
const CreateClienteService = require('./services/CreateClienteService');
const UpdateClienteService = require('./services/UpdateClienteService');
const DeleteClienteService = require('./services/DeleteClienteService');
const CreateContaService = require('./services/CreateContaService');
const DeleteContaService = require('./services/DeleteContaService');
const PagarParcelaService = require('./services/PagarParcelaService');
const EstornarParcelaService = require('./services/EstornarParcelaService');
const GetDashboardService = require('./services/GetDashboardService');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'FIADO';

// ── Clientes ──────────────────────────────────────────────────

async function listClientes(req, res) {
  try {
    const search = req.query.q || req.query.search || '';
    const data = await repo.findAllClientes(req.user.tenantId, search);
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function getCliente(req, res) {
  try {
    const data = await repo.findClienteById(req.user.tenantId, req.params.id);
    if (!data) return res.status(404).json({ ok: false, error: 'Cliente não encontrado' });
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function createCliente(req, res) {
  try {
    const data = await CreateClienteService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function updateCliente(req, res) {
  try {
    const data = await UpdateClienteService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function deleteCliente(req, res) {
  try {
    const data = await DeleteClienteService.execute(req.user.tenantId, req.params.id);
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

// ── Contas ────────────────────────────────────────────────────

async function listContas(req, res) {
  try {
    const cliente = await repo.findClienteById(req.user.tenantId, req.params.id);
    if (!cliente) return res.status(404).json({ ok: false, error: 'Cliente não encontrado' });
    const data = await repo.findContasByCliente(req.params.id);
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function createConta(req, res) {
  try {
    const data = await CreateContaService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function deleteConta(req, res) {
  try {
    const data = await DeleteContaService.execute(req.params.id);
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

// ── Parcelas ──────────────────────────────────────────────────

async function listParcelas(req, res) {
  try {
    const data = await repo.findParcelasByContaId(req.params.id);
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function pagarParcela(req, res) {
  try {
    const data = await PagarParcelaService.execute(req.params.id, req.body);
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function estornarParcela(req, res) {
  try {
    const data = await EstornarParcelaService.execute(req.params.id);
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(req, res) {
  try {
    const data = await GetDashboardService.execute(req.user.tenantId);
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

module.exports = {
  listClientes, getCliente, createCliente, updateCliente, deleteCliente,
  listContas, createConta, deleteConta,
  listParcelas, pagarParcela, estornarParcela,
  getDashboard,
};