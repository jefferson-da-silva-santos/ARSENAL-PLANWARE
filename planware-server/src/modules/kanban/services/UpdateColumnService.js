'use strict';

const repo = require('../KanbanRepository');

async function execute(tenantId, id, { title, color }) {
  if (!title?.trim()) throw Object.assign(new Error('Título é obrigatório'), { status: 400 });

  const column = await repo.findColumnById(tenantId, id);
  if (!column) throw Object.assign(new Error('Coluna não encontrada'), { status: 404 });

  await repo.updateColumn(tenantId, id, { title: title.trim(), color: color || column.color });
  return repo.findColumnById(tenantId, id);
}

module.exports = { execute };