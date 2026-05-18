'use strict';

const { Router } = require('express');
const controller = require('../errors/ErrorsController');

const router = Router();

// Rotas estáticas ANTES das dinâmicas com :id (evita conflito de params)
router.get('/stats', controller.getStats);
router.delete('/clear', controller.clearResolved);

router.get('/', controller.listErrors);
router.get('/:id', controller.getError);
router.get('/:fingerprint/occurrences', controller.getOccurrences);

router.post('/:id/resolve', controller.resolveError);
router.post('/:id/unresolve', controller.unresolveError);

router.delete('/:id', controller.deleteError);

module.exports = router;