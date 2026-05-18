'use strict';

const repo = require('../KanbanRepository');

async function execute(tenantId, id) {
  const count = await repo.countColumns(tenantId);
  if (count <= 1) throw Object.assign(new Error('É necessário manter ao menos uma coluna'), { status: 400 });

  const column = await repo.findColumnById(tenantId, id);
  if (!column) throw Object.assign(new Error('Coluna não encontrada'), { status: 404 });

  await repo.deleteColumn(tenantId, id);
  return { deleted: true };
}

module.exports = { execute };