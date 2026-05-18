'use strict';

const prisma = require('../../db/client');

// ── Clientes ──────────────────────────────────────────────────

async function findAllClients(tenantId, search = '') {
  return prisma.client.findMany({
    where: {
      tenantId,
      ...(search && {
        OR: [
          { nome:     { contains: search, mode: 'insensitive' } },
          { telefone: { contains: search, mode: 'insensitive' } },
          { email:    { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { nome: 'asc' },
  });
}

async function findClientById(tenantId, id) {
  return prisma.client.findFirst({
    where: { id, tenantId },
    include: { atendimentos: { orderBy: { data: 'desc' } } },
  });
}

async function createClient(tenantId, data) {
  return prisma.client.create({
    data: {
      tenantId,
      nome:        data.nome.trim(),
      telefone:    data.telefone    ?? null,
      email:       data.email       ?? null,
      endereco:    data.endereco    ?? null,
      observacoes: data.observacoes ?? null,
    },
  });
}

async function updateClient(tenantId, id, data) {
  return prisma.client.updateMany({
    where: { id, tenantId },
    data: {
      nome:        data.nome,
      telefone:    data.telefone    ?? null,
      email:       data.email       ?? null,
      endereco:    data.endereco    ?? null,
      observacoes: data.observacoes ?? null,
    },
  });
}

async function deleteClient(tenantId, id) {
  return prisma.client.deleteMany({ where: { id, tenantId } });
}

// ── Atendimentos ──────────────────────────────────────────────

async function createAttendance(clientId, { descricao, data }) {
  return prisma.attendance.create({
    data: {
      clientId,
      descricao: descricao.trim(),
      data:      data ? new Date(data) : new Date(),
    },
  });
}

async function deleteAttendance(id) {
  return prisma.attendance.delete({ where: { id } });
}

// ── Agendamentos ──────────────────────────────────────────────

async function findAllSchedules(tenantId, { dataInicio, dataFim, status } = {}) {
  return prisma.schedule.findMany({
    where: {
      tenantId,
      // FIX: só aplica filtro de data quando os valores existem e são datas válidas
      ...(dataInicio && { dataHora: { gte: new Date(dataInicio + 'T00:00:00') } }),
      ...(dataFim    && { dataHora: { lte: new Date(dataFim    + 'T23:59:59') } }),
      ...(status     && { status: status.toUpperCase() }),
    },
    include: { client: { select: { nome: true } } },
    orderBy: { dataHora: 'asc' },
  });
}

async function createSchedule(tenantId, data) {
  return prisma.schedule.create({
    data: {
      tenantId,
      clientId:   data.cliente_id  ?? null,
      titulo:     data.titulo.trim(),
      dataHora:   new Date(data.data_hora),
      duracaoMin: data.duracao_min  ?? 60,
      status:     data.status?.toUpperCase() ?? 'PENDENTE',
      notas:      data.notas        ?? null,
    },
    include: { client: { select: { nome: true } } },
  });
}

async function updateSchedule(tenantId, id, data) {
  // Faz o update
  await prisma.schedule.updateMany({
    where: { id, tenantId },
    data: {
      clientId:   data.cliente_id ?? null,
      titulo:     data.titulo,
      dataHora:   new Date(data.data_hora),
      duracaoMin: data.duracao_min ?? 60,
      status:     data.status?.toUpperCase() ?? 'PENDENTE',
      notas:      data.notas ?? null,
    },
  });

  // FIX: rebusca pelo id diretamente em vez de buscar todos e fazer find()
  return prisma.schedule.findFirst({
    where: { id, tenantId },
    include: { client: { select: { nome: true } } },
  });
}

async function deleteSchedule(tenantId, id) {
  return prisma.schedule.deleteMany({ where: { id, tenantId } });
}

// ── Contatos CRM ──────────────────────────────────────────────

async function findAllContacts(tenantId, { search, statusLead } = {}) {
  return prisma.contact.findMany({
    where: {
      tenantId,
      ...(search && {
        OR: [
          { nome:     { contains: search, mode: 'insensitive' } },
          { empresa:  { contains: search, mode: 'insensitive' } },
          { telefone: { contains: search, mode: 'insensitive' } },
          { email:    { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(statusLead && { statusLead: statusLead.toUpperCase() }),
    },
    orderBy: { nome: 'asc' },
  });
}

async function findContactById(tenantId, id) {
  return prisma.contact.findFirst({
    where: { id, tenantId },
    include: { interacoes: { orderBy: { data: 'desc' } } },
  });
}

async function createContact(tenantId, data) {
  return prisma.contact.create({
    data: {
      tenantId,
      nome:        data.nome.trim(),
      empresa:     data.empresa     ?? null,
      telefone:    data.telefone    ?? null,
      email:       data.email       ?? null,
      cargo:       data.cargo       ?? null,
      statusLead:  data.status_lead?.toUpperCase() ?? 'NOVO',
      observacoes: data.observacoes ?? null,
    },
  });
}

async function updateContact(tenantId, id, data) {
  return prisma.contact.updateMany({
    where: { id, tenantId },
    data: {
      nome:        data.nome,
      empresa:     data.empresa     ?? null,
      telefone:    data.telefone    ?? null,
      email:       data.email       ?? null,
      cargo:       data.cargo       ?? null,
      statusLead:  data.status_lead?.toUpperCase(),
      observacoes: data.observacoes ?? null,
    },
  });
}

async function deleteContact(tenantId, id) {
  return prisma.contact.deleteMany({ where: { id, tenantId } });
}

// ── Interações ────────────────────────────────────────────────

async function createInteraction(contactId, { tipo, descricao }) {
  return prisma.interaction.create({
    data: {
      contactId,
      tipo:      tipo?.toUpperCase() ?? 'NOTA',
      descricao: descricao.trim(),
    },
  });
}

async function deleteInteraction(id) {
  return prisma.interaction.delete({ where: { id } });
}

// ── Lembretes ─────────────────────────────────────────────────

async function findAllReminders(tenantId, concluido) {
  return prisma.reminder.findMany({
    where: {
      tenantId,
      // FIX: o frontend manda concluido=0 para "não concluídos"
      // undefined = sem filtro (mostra todos)
      // '0' ou false = só não concluídos
      // '1' ou true  = só concluídos
      ...(concluido !== undefined && concluido !== null && {
        concluido: concluido === '1' || concluido === true || concluido === 'true',
      }),
    },
    orderBy: { dataHora: 'asc' },
  });
}

async function findPendingReminders(tenantId) {
  const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);
  return prisma.reminder.findMany({
    where: {
      tenantId,
      concluido: false,
      dataHora:  { lte: oneHourLater },
    },
    orderBy: { dataHora: 'asc' },
  });
}

async function createReminder(tenantId, data) {
  return prisma.reminder.create({
    data: {
      tenantId,
      titulo:    data.titulo.trim(),
      descricao: data.descricao ?? null,
      dataHora:  new Date(data.data_hora),
      tipo:      data.tipo?.toUpperCase() ?? 'GERAL',
      refId:     data.ref_id ? String(data.ref_id) : null,
    },
  });
}

async function completeReminder(id) {
  return prisma.reminder.update({ where: { id }, data: { concluido: true } });
}

async function deleteReminder(id) {
  return prisma.reminder.delete({ where: { id } });
}

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(tenantId) {
  const now          = new Date();
  const startOfDay   = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay     = new Date(now); endOfDay.setHours(23, 59, 59, 999);
  const oneHourLater = new Date(Date.now() + 60 * 60 * 1000);

  const [
    totalClientes,
    totalContatos,
    agendamentosHoje,
    agendamentosProximos,
    lembretesUrgentes,
    atendimentosRecentes,
  ] = await Promise.all([
    prisma.client.count({ where: { tenantId } }),
    prisma.contact.count({ where: { tenantId } }),
    prisma.schedule.count({
      where: {
        tenantId,
        dataHora: { gte: startOfDay, lte: endOfDay },
        status:   { not: 'CANCELADO' },
      },
    }),
    prisma.schedule.findMany({
      where: {
        tenantId,
        dataHora: { gte: new Date() },
        status:   { not: 'CANCELADO' },
      },
      include:  { client: { select: { nome: true } } },
      orderBy:  { dataHora: 'asc' },
      take: 5,
    }),
    prisma.reminder.findMany({
      where: {
        tenantId,
        concluido: false,
        dataHora:  { lte: oneHourLater },
      },
      orderBy: { dataHora: 'asc' },
      take: 5,
    }),
    // FIX: campo correto é criadoEm (com acento), não createdAt
    prisma.attendance.findMany({
      where:   { client: { tenantId } },
      include: { client: { select: { nome: true } } },
      orderBy: { criadoEm: 'desc' },
      take: 5,
    }),
  ]);

  return {
    totalClientes,
    totalContatos,
    agendamentosHoje,
    agendamentosProximos,
    lembretesUrgentes,
    atendimentosRecentes,
  };
}

module.exports = {
  findAllClients, findClientById, createClient, updateClient, deleteClient,
  createAttendance, deleteAttendance,
  findAllSchedules, createSchedule, updateSchedule, deleteSchedule,
  findAllContacts, findContactById, createContact, updateContact, deleteContact,
  createInteraction, deleteInteraction,
  findAllReminders, findPendingReminders, createReminder, completeReminder, deleteReminder,
  getDashboard,
};