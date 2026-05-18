'use strict';

const repo = require('../KanbanRepository');
const { validatePriority, normalizePriority } = require('../KanbanUtils');

async function execute(tenantId, { title, description, column_id, member_id, priority }) {
  if (!title?.trim()) throw Object.assign(new Error('Título é obrigatório'), { status: 400 });
  if (!column_id) throw Object.assign(new Error('Coluna é obrigatória'), { status: 400 });

  if (priority && !validatePriority(priority)) {
    throw Object.assign(new Error('Priority inválida. Use: low, medium, high'), { status: 400 });
  }

  const column = await repo.findColumnById(tenantId, column_id);
  if (!column) throw Object.assign(new Error('Coluna não encontrada'), { status: 404 });

  if (member_id) {
    const member = await repo.findMemberById(tenantId, member_id);
    if (!member) throw Object.assign(new Error('Membro não encontrado'), { status: 404 });
  }

  const maxPos = await repo.getMaxTaskPosition(tenantId, column_id);

  return repo.createTask(tenantId, {
    columnId: column_id,
    memberId: member_id || null,
    title: title.trim(),
    description: description?.trim() || null,
    position: maxPos + 1,
    priority: normalizePriority(priority),
  });
}

module.exports = { execute };