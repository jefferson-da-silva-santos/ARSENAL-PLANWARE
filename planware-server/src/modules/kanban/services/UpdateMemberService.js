'use strict';

const repo = require('../KanbanRepository');

async function execute(tenantId, id, { name, color }) {
  if (!name?.trim()) throw Object.assign(new Error('Nome é obrigatório'), { status: 400 });

  const member = await repo.findMemberById(tenantId, id);
  if (!member) throw Object.assign(new Error('Membro não encontrado'), { status: 404 });

  await repo.updateMember(tenantId, id, { name: name.trim(), color: color || member.color });
  return repo.findMemberById(tenantId, id);
}

module.exports = { execute };