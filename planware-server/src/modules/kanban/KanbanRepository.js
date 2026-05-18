'use strict';

const prisma = require('../../db/client');

// ── Members ───────────────────────────────────────────────────

async function findAllMembers(tenantId) {
  return prisma.kanbanMember.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

async function findMemberById(tenantId, id) {
  return prisma.kanbanMember.findFirst({ where: { id, tenantId } });
}

async function findMemberByName(tenantId, name) {
  return prisma.kanbanMember.findUnique({
    where: { tenantId_name: { tenantId, name } },
  });
}

async function createMember(tenantId, { name, color }) {
  return prisma.kanbanMember.create({ data: { tenantId, name, color } });
}

async function updateMember(tenantId, id, { name, color }) {
  return prisma.kanbanMember.updateMany({
    where: { id, tenantId },
    data: { name, color },
  });
}

async function deleteMember(tenantId, id) {
  // Desvincula tarefas antes de deletar
  await prisma.kanbanTask.updateMany({
    where: { memberId: id, tenantId },
    data: { memberId: null },
  });
  return prisma.kanbanMember.deleteMany({ where: { id, tenantId } });
}

// ── Columns ───────────────────────────────────────────────────

async function findAllColumns(tenantId) {
  return prisma.kanbanColumn.findMany({
    where: { tenantId },
    orderBy: { position: 'asc' },
  });
}

async function findColumnById(tenantId, id) {
  return prisma.kanbanColumn.findFirst({ where: { id, tenantId } });
}

async function countColumns(tenantId) {
  return prisma.kanbanColumn.count({ where: { tenantId } });
}

async function getMaxColumnPosition(tenantId) {
  const result = await prisma.kanbanColumn.aggregate({
    where: { tenantId },
    _max: { position: true },
  });
  return result._max.position ?? -1;
}

async function createColumn(tenantId, { title, color, position }) {
  return prisma.kanbanColumn.create({ data: { tenantId, title, color, position } });
}

async function updateColumn(tenantId, id, { title, color }) {
  return prisma.kanbanColumn.updateMany({
    where: { id, tenantId },
    data: { title, color },
  });
}

async function deleteColumn(tenantId, id) {
  return prisma.kanbanColumn.deleteMany({ where: { id, tenantId } });
}

// ── Tasks ─────────────────────────────────────────────────────

async function findAllTasks(tenantId) {
  return prisma.kanbanTask.findMany({
    where: { tenantId },
    orderBy: [{ columnId: 'asc' }, { position: 'asc' }],
    include: {
      member: { select: { name: true, color: true } },
      column: { select: { title: true, color: true } },
    },
  });
}

async function findTaskById(tenantId, id) {
  return prisma.kanbanTask.findFirst({
    where: { id, tenantId },
    include: {
      member: { select: { name: true, color: true } },
      column: { select: { title: true, color: true } },
    },
  });
}

async function getMaxTaskPosition(tenantId, columnId) {
  const result = await prisma.kanbanTask.aggregate({
    where: { tenantId, columnId },
    _max: { position: true },
  });
  return result._max.position ?? -1;
}

async function createTask(tenantId, data) {
  return prisma.kanbanTask.create({
    data: { tenantId, ...data },
    include: {
      member: { select: { name: true, color: true } },
      column: { select: { title: true, color: true } },
    },
  });
}

async function updateTask(tenantId, id, data) {
  return prisma.kanbanTask.updateMany({ where: { id, tenantId }, data });
}

async function deleteTask(tenantId, id) {
  return prisma.kanbanTask.deleteMany({ where: { id, tenantId } });
}

// ── Stats ─────────────────────────────────────────────────────

async function getStats(tenantId) {
  const [totalTasks, byColumn, byPriority, byMember] = await Promise.all([
    prisma.kanbanTask.count({ where: { tenantId } }),

    prisma.kanbanColumn.findMany({
      where: { tenantId },
      orderBy: { position: 'asc' },
      include: { _count: { select: { tasks: true } } },
    }),

    prisma.kanbanTask.groupBy({
      by: ['priority'],
      where: { tenantId },
      _count: true,
    }),

    prisma.kanbanMember.findMany({
      where: { tenantId },
      include: { _count: { select: { tasks: true } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    totalTasks,
    byColumn: byColumn.map((c) => ({ title: c.title, count: c._count.tasks })),
    byPriority: byPriority.map((p) => ({ priority: p.priority.toLowerCase(), count: p._count })),
    byMember: byMember.map((m) => ({ name: m.name, color: m.color, count: m._count.tasks })),
  };
}

// ── Seed colunas padrão ───────────────────────────────────────

async function seedDefaultColumns(tenantId) {
  const count = await countColumns(tenantId);
  if (count > 0) return;

  await prisma.kanbanColumn.createMany({
    data: [
      { tenantId, title: 'A Fazer', position: 0, color: '#64B5F6' },
      { tenantId, title: 'Em Andamento', position: 1, color: '#FFB74D' },
      { tenantId, title: 'Concluído', position: 2, color: '#81C784' },
    ],
  });
}

module.exports = {
  findAllMembers, findMemberById, findMemberByName, createMember, updateMember, deleteMember,
  findAllColumns, findColumnById, countColumns, getMaxColumnPosition, createColumn, updateColumn, deleteColumn,
  findAllTasks, findTaskById, getMaxTaskPosition, createTask, updateTask, deleteTask,
  getStats, seedDefaultColumns,
};