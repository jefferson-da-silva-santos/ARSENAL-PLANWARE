'use strict';

const repo = require('../KanbanRepository');
const { validatePriority, normalizePriority } = require('../KanbanUtils');

async function execute(tenantId, id, body) {
  const { title, description, column_id, member_id, priority } = body;

  if (!title?.trim()) throw Object.assign(new Error('Título é obrigatório'), { status: 400 });

  const task = await repo.findTaskById(tenantId, id);
  if (!task) throw Object.assign(new Error('Tarefa não encontrada'), { status: 404 });

  if (column_id) {
    const column = await repo.findColumnById(tenantId, column_id);
    if (!column) throw Object.assign(new Error('Coluna não encontrada'), { status: 404 });
  }

  if (priority && !validatePriority(priority)) {
    throw Object.assign(new Error('Priority inválida. Use: low, medium, high'), { status: 400 });
  }

  await repo.updateTask(tenantId, id, {
    title: title.trim(),
    description: description?.trim() || null,
    columnId: column_id || task.columnId,
    memberId: member_id !== undefined ? (member_id || null) : task.memberId,
    priority: priority ? normalizePriority(priority) : task.priority,
  });

  return repo.findTaskById(tenantId, id);
}

module.exports = { execute };