'use strict';

const repo = require('../ErrorsRepository');

/**
 * Retorna os números para os stat cards do dashboard de erros:
 * total, não resolvidos, críticos (5xx), nas últimas 24h,
 * breakdown por módulo e top 5 erros mais frequentes.
 */
async function execute() {
  return repo.getStats();
}

module.exports = { execute };