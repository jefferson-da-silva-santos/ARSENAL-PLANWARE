'use strict';

const { Router } = require('express');
const controller = require('./ClientProController');

const router = Router();

// ─── Dashboard ────────────────────────────────────────────────
router.get('/api/dashboard', controller.getDashboard);

// ─── Clientes ─────────────────────────────────────────────────
router.get('/api/clientes',        controller.listClients);
router.post('/api/clientes',       controller.createClient);
router.get('/api/clientes/:id',    controller.getClient);
router.put('/api/clientes/:id',    controller.updateClient);
router.delete('/api/clientes/:id', controller.deleteClient);

// ─── Atendimentos ─────────────────────────────────────────────
router.post('/api/clientes/:id/atendimentos', controller.createAttendance);
router.delete('/api/atendimentos/:id',        controller.deleteAttendance);

// ─── Agendamentos ─────────────────────────────────────────────
router.get('/api/agendamentos',        controller.listSchedules);
router.post('/api/agendamentos',       controller.createSchedule);
router.put('/api/agendamentos/:id',    controller.updateSchedule);
router.delete('/api/agendamentos/:id', controller.deleteSchedule);

// ─── Contatos CRM ─────────────────────────────────────────────
router.get('/api/contatos',        controller.listContacts);
router.post('/api/contatos',       controller.createContact);
router.get('/api/contatos/:id',    controller.getContact);
router.put('/api/contatos/:id',    controller.updateContact);
router.delete('/api/contatos/:id', controller.deleteContact);

// ─── Interações CRM ───────────────────────────────────────────
router.post('/api/contatos/:id/interacoes', controller.createInteraction);
router.delete('/api/interacoes/:id',        controller.deleteInteraction);

// ─── Lembretes ────────────────────────────────────────────────
// ATENÇÃO: rota estática /pendentes ANTES da dinâmica /:id
router.get('/api/lembretes/pendentes',        controller.listPendingReminders);
router.get('/api/lembretes',                  controller.listReminders);
router.post('/api/lembretes',                 controller.createReminder);
router.patch('/api/lembretes/:id/concluir',   controller.completeReminder);
router.delete('/api/lembretes/:id',           controller.deleteReminder);

module.exports = router;