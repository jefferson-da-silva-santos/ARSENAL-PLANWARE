'use strict';

const repo = require('./KanbanRepository');
const { formatTask, formatColumn } = require('./KanbanUtils');
const CreateMemberService = require('./services/CreateMemberService');
const UpdateMemberService = require('./services/UpdateMemberService');
const DeleteMemberService = require('./services/DeleteMemberService');
const CreateColumnService = require('./services/CreateColumnService');
const UpdateColumnService = require('./services/UpdateColumnService');
const DeleteColumnService = require('./services/DeleteColumnService');
const CreateTaskService = require('./services/CreateTaskService');
const UpdateTaskService = require('./services/UpdateTaskService');
const MoveTaskService = require('./services/MoveTaskService');
const DeleteTaskService = require('./services/DeleteTaskService');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'KANBAN';

// ── Members ───────────────────────────────────────────────────

async function listMembers(req, res) {
  try {
    await repo.seedDefaultColumns(req.user.tenantId);
    const data = await repo.findAllMembers(req.user.tenantId);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createMember(req, res) {
  try {
    const data = await CreateMemberService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updateMember(req, res) {
  try {
    const data = await UpdateMemberService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function deleteMember(req, res) {
  try {
    const data = await DeleteMemberService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── Columns ───────────────────────────────────────────────────

async function listColumns(req, res) {
  try {
    await repo.seedDefaultColumns(req.user.tenantId);
    const data = await repo.findAllColumns(req.user.tenantId);
    return res.json({ success: true, data: data.map(formatColumn) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createColumn(req, res) {
  try {
    const data = await CreateColumnService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data: formatColumn(data) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updateColumn(req, res) {
  try {
    const data = await UpdateColumnService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data: formatColumn(data) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function deleteColumn(req, res) {
  try {
    const data = await DeleteColumnService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

// ── Tasks ─────────────────────────────────────────────────────

async function listTasks(req, res) {
  try {
    const tasks = await repo.findAllTasks(req.user.tenantId);
    return res.json({ success: true, data: tasks.map(formatTask) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function createTask(req, res) {
  try {
    const task = await CreateTaskService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data: formatTask(task) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function updateTask(req, res) {
  try {
    const task = await UpdateTaskService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data: formatTask(task) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function moveTask(req, res) {
  try {
    const task = await MoveTaskService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data: formatTask(task) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function deleteTask(req, res) {
  try {
    const data = await DeleteTaskService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

async function getStats(req, res) {
  try {
    const data = await repo.getStats(req.user.tenantId);
    return res.json({ success: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ success: false, error: err.message });
  }
}

module.exports = {
  listMembers, createMember, updateMember, deleteMember,
  listColumns, createColumn, updateColumn, deleteColumn,
  listTasks, createTask, updateTask, moveTask, deleteTask,
  getStats,
};