'use strict';
const repo = require('../FiadoRepository');
const { validateConta } = require('../FiadoUtils');

async function execute(tenantId, body) {
  const error = validateConta(body);
  if (error) throw Object.assign(new Error(error), { status: 400 });

  const { cliente_id, descricao, valor_total, num_parcelas = 1, data_primeira, observacao } = body;

  const cliente = await repo.findClienteById(tenantId, cliente_id);
  if (!cliente) throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });

  return repo.createContaWithParcelas(tenantId, cliente_id, {
    descricao: descricao.trim(),
    valorTotal: parseFloat(valor_total),
    numParcelas: parseInt(num_parcelas),
    dataPrimeira: data_primeira,
    observacao: observacao?.trim() || null,
  });
}

module.exports = { execute };