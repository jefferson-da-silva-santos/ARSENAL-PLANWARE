'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, data) {
  if (!data.descricao?.trim()) throw utils.badRequest('descricao é obrigatória');
  utils.validatePositivo(data.valor, 'valor');

  let dataLancamento;
  if (data.data) {
    dataLancamento = new Date(data.data);
    if (isNaN(dataLancamento.getTime())) throw utils.badRequest('data inválida');
  }

  return repo.createDespesa(tenantId, {
    descricao: data.descricao.trim(),
    valor: parseFloat(data.valor),
    categoria: data.categoria || null,
    data: dataLancamento?.toISOString() || undefined,
    observacoes: data.observacoes || null,
  });
}

module.exports = { execute };