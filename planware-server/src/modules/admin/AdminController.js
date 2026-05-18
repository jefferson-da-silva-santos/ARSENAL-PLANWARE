'use strict';

const repo = require('./AdminRepository');
const CreateTenantService = require('./services/CreateTenantService');
const CreateUserService = require('./services/CreateUserService');
const UpdatePermissionsService = require('./services/UpdatePermissionsService');
const DeleteUserService = require('./services/DeleteUserService');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'ADMIN';

// ─────────────────────────────────────────────────────────────
//  TENANTS
// ─────────────────────────────────────────────────────────────

async function listTenants(req, res) {
  try {
    const tenants = await repo.findAllTenants();
    return res.json({ success: true, data: tenants });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getTenant(req, res) {
  try {
    const tenant = await repo.findTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, error: 'Tenant não encontrado' });
    return res.json({ success: true, data: tenant });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function createTenant(req, res) {
  try {
    const tenant = await CreateTenantService.execute(req.body);
    return res.status(201).json({ success: true, data: tenant });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function toggleTenant(req, res) {
  try {
    const tenant = await repo.findTenantById(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, error: 'Tenant não encontrado' });

    const updated = await repo.updateTenantActive(req.params.id, !tenant.active);
    return res.json({ success: true, data: updated });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(500).json({ success: false, error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
//  USUÁRIOS
// ─────────────────────────────────────────────────────────────

async function listUsers(req, res) {
  try {
    const users = await repo.findAllUsers({ tenantId: req.query.tenantId });
    return res.json({ success: true, data: users });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getUser(req, res) {
  try {
    const user = await repo.findUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    return res.json({ success: true, data: user });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function createUser(req, res) {
  try {
    const user = await CreateUserService.execute(req.body);
    return res.status(201).json({ success: true, data: user });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function toggleUser(req, res) {
  try {
    const user = await repo.findUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'Usuário não encontrado' });

    const updated = await repo.updateUserActive(req.params.id, !user.active);
    return res.json({ success: true, data: updated });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'A nova senha deve ter no mínimo 8 caracteres',
      });
    }

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 12);
    const updated = await repo.updateUserPassword(req.params.id, passwordHash);

    return res.json({ success: true, data: updated });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function deleteUser(req, res) {
  try {
    const hard = req.query.hard === 'true';
    const result = await DeleteUserService.execute({ userId: req.params.id, hard });
    return res.json({ success: true, data: result });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
//  PERMISSÕES
// ─────────────────────────────────────────────────────────────

async function getPermissions(req, res) {
  try {
    const permissions = await repo.findPermissionsByUser(req.params.id);
    return res.json({ success: true, data: permissions });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function updatePermissions(req, res) {
  try {
    const result = await UpdatePermissionsService.execute({
      userId: req.params.id,
      permissions: req.body.permissions,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listTenants, getTenant, createTenant, toggleTenant,
  listUsers, getUser, createUser, toggleUser, resetPassword, deleteUser,
  getPermissions, updatePermissions,
};