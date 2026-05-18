'use strict';

const repo = require('./ClientProRepository');
const { formatClient, formatSchedule, formatContact, formatReminder, formatAttendance } = require('./ClientProUtils');
const { capture } = require('../../lib/ErrorTracker');

const MODULE = 'CLIENTPRO';

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(req, res) {
  try {
    const raw = await repo.getDashboard(req.user.tenantId);
    const data = {
      ...raw,
      agendamentosProximos: raw.agendamentosProximos.map(formatSchedule),
      lembretesUrgentes: raw.lembretesUrgentes.map(formatReminder),
      atendimentosRecentes: raw.atendimentosRecentes.map(formatAttendance),
    };
    return res.json({ ok: true, data });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

// ── Clientes ──────────────────────────────────────────────────

async function listClients(req, res) {
  try {
    const clients = await repo.findAllClients(req.user.tenantId, req.query.q);
    return res.json({ ok: true, data: clients.map(formatClient) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function getClient(req, res) {
  try {
    const client = await repo.findClientById(req.user.tenantId, req.params.id);
    if (!client) return res.status(404).json({ ok: false, error: 'Cliente não encontrado' });
    return res.json({ ok: true, data: formatClient(client) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function createClient(req, res) {
  try {
    if (!req.body.nome) return res.status(400).json({ ok: false, error: 'Nome é obrigatório' });
    const client = await repo.createClient(req.user.tenantId, req.body);
    return res.status(201).json({ ok: true, data: formatClient(client) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function updateClient(req, res) {
  try {
    const result = await repo.updateClient(req.user.tenantId, req.params.id, req.body);
    if (result.count === 0) return res.status(404).json({ ok: false, error: 'Cliente não encontrado' });
    const updated = await repo.findClientById(req.user.tenantId, req.params.id);
    return res.json({ ok: true, data: formatClient(updated) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function deleteClient(req, res) {
  try {
    await repo.deleteClient(req.user.tenantId, req.params.id);
    return res.json({ ok: true, data: { id: req.params.id } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

// ── Atendimentos ──────────────────────────────────────────────

async function createAttendance(req, res) {
  try {
    const { descricao, data } = req.body;
    if (!descricao) return res.status(400).json({ ok: false, error: 'Descrição é obrigatória' });
    const attendance = await repo.createAttendance(req.params.id, { descricao, data });
    return res.status(201).json({ ok: true, data: attendance });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function deleteAttendance(req, res) {
  try {
    await repo.deleteAttendance(req.params.id);
    return res.json({ ok: true, data: { id: req.params.id } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

// ── Agendamentos ──────────────────────────────────────────────

async function listSchedules(req, res) {
  try {
    const { data_inicio, data_fim, status } = req.query;
    const schedules = await repo.findAllSchedules(req.user.tenantId, {
      dataInicio: data_inicio,
      dataFim: data_fim,
      status,
    });
    return res.json({ ok: true, data: schedules.map(formatSchedule) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function createSchedule(req, res) {
  try {
    const { titulo, data_hora } = req.body;
    if (!titulo) return res.status(400).json({ ok: false, error: 'Título é obrigatório' });
    if (!data_hora) return res.status(400).json({ ok: false, error: 'Data e hora são obrigatórios' });
    const schedule = await repo.createSchedule(req.user.tenantId, req.body);
    return res.status(201).json({ ok: true, data: formatSchedule(schedule) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function updateSchedule(req, res) {
  try {
    const updated = await repo.updateSchedule(req.user.tenantId, req.params.id, req.body);
    if (!updated) return res.status(404).json({ ok: false, error: 'Agendamento não encontrado' });
    return res.json({ ok: true, data: formatSchedule(updated) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function deleteSchedule(req, res) {
  try {
    await repo.deleteSchedule(req.user.tenantId, req.params.id);
    return res.json({ ok: true, data: { id: req.params.id } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

// ── Contatos CRM ──────────────────────────────────────────────

async function listContacts(req, res) {
  try {
    const { q, status_lead } = req.query;
    const contacts = await repo.findAllContacts(req.user.tenantId, { search: q, statusLead: status_lead });
    return res.json({ ok: true, data: contacts.map(formatContact) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function getContact(req, res) {
  try {
    const contact = await repo.findContactById(req.user.tenantId, req.params.id);
    if (!contact) return res.status(404).json({ ok: false, error: 'Contato não encontrado' });
    return res.json({ ok: true, data: formatContact(contact) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function createContact(req, res) {
  try {
    if (!req.body.nome) return res.status(400).json({ ok: false, error: 'Nome é obrigatório' });
    const contact = await repo.createContact(req.user.tenantId, req.body);
    return res.status(201).json({ ok: true, data: formatContact(contact) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function updateContact(req, res) {
  try {
    const result = await repo.updateContact(req.user.tenantId, req.params.id, req.body);
    if (result.count === 0) return res.status(404).json({ ok: false, error: 'Contato não encontrado' });
    const updated = await repo.findContactById(req.user.tenantId, req.params.id);
    return res.json({ ok: true, data: formatContact(updated) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function deleteContact(req, res) {
  try {
    await repo.deleteContact(req.user.tenantId, req.params.id);
    return res.json({ ok: true, data: { id: req.params.id } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

// ── Interações ────────────────────────────────────────────────

async function createInteraction(req, res) {
  try {
    const { descricao, tipo } = req.body;
    if (!descricao) return res.status(400).json({ ok: false, error: 'Descrição é obrigatória' });
    const interaction = await repo.createInteraction(req.params.id, { descricao, tipo });
    return res.status(201).json({ ok: true, data: interaction });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function deleteInteraction(req, res) {
  try {
    await repo.deleteInteraction(req.params.id);
    return res.json({ ok: true, data: { id: req.params.id } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

// ── Lembretes ─────────────────────────────────────────────────

async function listReminders(req, res) {
  try {
    const reminders = await repo.findAllReminders(req.user.tenantId, req.query.concluido);
    return res.json({ ok: true, data: reminders.map(formatReminder) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function listPendingReminders(req, res) {
  try {
    const reminders = await repo.findPendingReminders(req.user.tenantId);
    return res.json({ ok: true, data: reminders.map(formatReminder) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function createReminder(req, res) {
  try {
    const { titulo, data_hora } = req.body;
    if (!titulo) return res.status(400).json({ ok: false, error: 'Título é obrigatório' });
    if (!data_hora) return res.status(400).json({ ok: false, error: 'Data e hora são obrigatórios' });
    const reminder = await repo.createReminder(req.user.tenantId, req.body);
    return res.status(201).json({ ok: true, data: formatReminder(reminder) });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function completeReminder(req, res) {
  try {
    await repo.completeReminder(req.params.id);
    return res.json({ ok: true, data: { id: req.params.id, concluido: true } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

async function deleteReminder(req, res) {
  try {
    await repo.deleteReminder(req.params.id);
    return res.json({ ok: true, data: { id: req.params.id } });
  } catch (err) {
    await capture(err, req, { module: MODULE });
    return res.status(err.status || 500).json({ ok: false, error: err.message });
  }
}

module.exports = {
  getDashboard,
  listClients, getClient, createClient, updateClient, deleteClient,
  createAttendance, deleteAttendance,
  listSchedules, createSchedule, updateSchedule, deleteSchedule,
  listContacts, getContact, createContact, updateContact, deleteContact,
  createInteraction, deleteInteraction,
  listReminders, listPendingReminders, createReminder, completeReminder, deleteReminder,
};