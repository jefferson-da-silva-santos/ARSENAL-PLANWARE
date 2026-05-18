'use strict';

const repo = require('../KanbanRepository');

async function execute(tenantId, id, { column_id, position }) {
  if (!column_id) throw Object.assign(new Error('column_id é obrigatório'), { status: 400 });

  const task = await repo.findTaskById(tenantId, id);
  if (!task) throw Object.assign(new Error('Tarefa não encontrada'), { status: 404 });

  const column = await repo.findColumnById(tenantId, column_id);
  if (!column) throw Object.assign(new Error('Coluna não encontrada'), { status: 404 });

  let newPos = position;
  if (newPos === undefined) {
    const maxPos = await repo.getMaxTaskPosition(tenantId, column_id);
    newPos = maxPos + 1;
  }

  await repo.updateTask(tenantId, id, { columnId: column_id, position: newPos });
  return repo.findTaskById(tenantId, id);
}

module.exports = { execute };