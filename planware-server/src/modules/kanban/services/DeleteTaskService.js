'use strict';

const repo = require('../KanbanRepository');

async function execute(tenantId, id) {
  const task = await repo.findTaskById(tenantId, id);
  if (!task) throw Object.assign(new Error('Tarefa não encontrada'), { status: 404 });
  await repo.deleteTask(tenantId, id);
  return { deleted: true };
}

module.exports = { execute };