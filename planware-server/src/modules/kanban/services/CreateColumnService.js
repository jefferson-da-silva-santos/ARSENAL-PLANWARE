'use strict';

const repo = require('../KanbanRepository');

async function execute(tenantId, { title, color }) {
  if (!title?.trim()) throw Object.assign(new Error('Título é obrigatório'), { status: 400 });

  const maxPos = await repo.getMaxColumnPosition(tenantId);
  return repo.createColumn(tenantId, {
    title: title.trim(),
    color: color || '#4A90D9',
    position: maxPos + 1,
  });
}

module.exports = { execute };