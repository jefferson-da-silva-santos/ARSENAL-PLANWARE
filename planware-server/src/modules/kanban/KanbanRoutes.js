'use strict';

const { Router } = require('express');
const controller = require('./KanbanController');

const router = Router();

// Members
router.get('/members', controller.listMembers);
router.post('/members', controller.createMember);
router.put('/members/:id', controller.updateMember);
router.delete('/members/:id', controller.deleteMember);

// Columns
router.get('/columns', controller.listColumns);
router.post('/columns', controller.createColumn);
router.put('/columns/:id', controller.updateColumn);
router.delete('/columns/:id', controller.deleteColumn);

// Tasks
router.get('/tasks', controller.listTasks);
router.post('/tasks', controller.createTask);
router.put('/tasks/:id', controller.updateTask);
router.patch('/tasks/:id/move', controller.moveTask);
router.delete('/tasks/:id', controller.deleteTask);

// Stats
router.get('/stats', controller.getStats);

module.exports = router;