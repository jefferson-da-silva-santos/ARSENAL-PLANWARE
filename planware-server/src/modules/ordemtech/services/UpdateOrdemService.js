'use strict';

const repo = require('../OrdemTechRepository');
const { validateStatus, normalizeStatus, formatOrdem } = require('../OrdemTechUtils');

async function execute(tenantId, id, body) {
  const { cliente_id, equipamento, problema, observacoes, valor, status } = body;

  const existing = await repo.findOrdemById(tenantId, id);
  if (!existing) throw Object.assign(new Error('Ordem não encontrada'), { status: 404 });

  if (status && !validateStatus(status)) {
    throw Object.assign(new Error('Status inválido. Use: em_andamento, pronto, cancelado'), { status: 400 });
  }

  const data = {};
  // FIX: cliente_id é UUID (string)
  if (cliente_id !== undefined) {
    const clienteIdStr = String(cliente_id);
    const cliente = await repo.findClienteById(tenantId, clienteIdStr);
    if (!cliente) throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });
    data.clienteId = clienteIdStr;
  }
  if (equipamento !== undefined) data.equipamento = equipamento.trim();
  if (problema    !== undefined) data.problema    = problema.trim();
  if (observacoes !== undefined) data.observacoes = observacoes.trim();
  if (valor       !== undefined) data.valor       = parseFloat(valor) || 0;
  if (status      !== undefined) data.status      = normalizeStatus(status);

  await repo.updateOrdem(tenantId, id, data);
  return formatOrdem(await repo.findOrdemById(tenantId, id));
}

module.exports = { execute };