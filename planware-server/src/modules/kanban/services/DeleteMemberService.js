'use strict';

const repo = require('../KanbanRepository');

async function execute(tenantId, id) {
  const member = await repo.findMemberById(tenantId, id);
  if (!member) throw Object.assign(new Error('Membro não encontrado'), { status: 404 });
  await repo.deleteMember(tenantId, id);
  return { deleted: true };
}

module.exports = { execute };