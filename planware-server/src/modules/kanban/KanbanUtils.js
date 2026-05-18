'use strict';

const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];

const MEMBER_COLORS = [
  '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#42A5F5',
  '#26C6DA', '#26A69A', '#66BB6A', '#D4E157', '#FFCA28',
  '#FFA726', '#FF7043',
];

function generateColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

function validatePriority(priority) {
  return VALID_PRIORITIES.includes(priority?.toUpperCase());
}

function normalizePriority(priority) {
  return priority?.toUpperCase() ?? 'MEDIUM';
}

function formatTask(task) {
  if (!task) return null;
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    column_id: task.columnId,
    member_id: task.memberId,
    position: task.position,
    priority: task.priority?.toLowerCase(),
    member_name: task.member?.name ?? null,
    member_color: task.member?.color ?? null,
    column_title: task.column?.title ?? null,
    column_color: task.column?.color ?? null,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  };
}

function formatColumn(col) {
  if (!col) return null;
  return {
    id: col.id,
    title: col.title,
    position: col.position,
    color: col.color,
    created_at: col.createdAt,
  };
}

module.exports = { generateColor, validatePriority, normalizePriority, formatTask, formatColumn };