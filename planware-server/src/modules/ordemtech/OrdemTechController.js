'use strict';

const repo = require('./OrdemTechRepository');
const { formatOrdem } = require('./OrdemTechUtils');
const CreateClienteService = require('./services/CreateClienteService');
const UpdateClienteService = require('./services/UpdateClienteService');
const CreateOrdemService = require('./services/CreateOrdemService');
const UpdateOrdemService = require('./services/UpdateOrdemService');
const UpdateOrdemStatusService = require('./services/UpdateOrdemStatusService');
const DeleteOrdemService = require('./services/DeleteOrdemService');
const GetDashboardService = require('./services/GetDashboardService');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'ORDEMTECH';

async function listClientes(req, res) {
  try {
    const data = await repo.findAllClientes(req.user.tenantId, req.query.q);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createCliente(req, res) {
  try {
    const data = await CreateClienteService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updateCliente(req, res) {
  try {
    const data = await UpdateClienteService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function listOrdens(req, res) {
  try {
    const { q, status } = req.query;
    const ordens = await repo.findAllOrdens(req.user.tenantId, {
      search: q,
      status: status?.toUpperCase(),
    });
    return res.json({ success: true, data: ordens.map(formatOrdem) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function getOrdem(req, res) {
  try {
    const ordem = await repo.findOrdemById(req.user.tenantId, req.params.id);
    if (!ordem) return res.status(404).json({ success: false, error: 'Ordem não encontrada' });
    return res.json({ success: true, data: formatOrdem(ordem) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createOrdem(req, res) {
  try {
    const data = await CreateOrdemService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updateOrdem(req, res) {
  try {
    const data = await UpdateOrdemService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updateOrdemStatus(req, res) {
  try {
    const data = await UpdateOrdemStatusService.execute(req.user.tenantId, req.params.id, req.body.status);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function deleteOrdem(req, res) {
  try {
    const data = await DeleteOrdemService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function getDashboard(req, res) {
  try {
    const data = await GetDashboardService.execute(req.user.tenantId);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listClientes, createCliente, updateCliente,
  listOrdens, getOrdem, createOrdem, updateOrdem, updateOrdemStatus, deleteOrdem,
  getDashboard,
};