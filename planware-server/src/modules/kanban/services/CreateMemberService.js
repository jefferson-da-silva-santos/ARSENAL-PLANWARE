// CreateMemberService.js
'use strict';

const repo = require('../KanbanRepository');
const { generateColor } = require('../KanbanUtils');

async function execute(tenantId, { name, color }) {
  if (!name?.trim()) throw Object.assign(new Error('Nome é obrigatório'), { status: 400 });

  const existing = await repo.findMemberByName(tenantId, name.trim());
  if (existing) throw Object.assign(new Error('Já existe um membro com esse nome'), { status: 409 });

  return repo.createMember(tenantId, {
    name: name.trim(),
    color: color || generateColor(name.trim()),
  });
}

module.exports = { execute };