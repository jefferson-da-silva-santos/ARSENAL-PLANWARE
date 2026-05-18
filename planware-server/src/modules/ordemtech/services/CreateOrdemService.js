'use strict';

const repo = require('../OrdemTechRepository');
const { gerarNumeroOS, formatOrdem } = require('../OrdemTechUtils');

async function execute(tenantId, { cliente_id, equipamento, problema, observacoes, valor }) {
  if (!cliente_id) throw Object.assign(new Error('Cliente é obrigatório'), { status: 400 });
  if (!equipamento?.trim()) throw Object.assign(new Error('Equipamento é obrigatório'), { status: 400 });
  if (!problema?.trim()) throw Object.assign(new Error('Descrição do problema é obrigatória'), { status: 400 });

  // FIX: garante que cliente_id é string (UUID), nunca número
  const clienteIdStr = String(cliente_id);

  const cliente = await repo.findClienteById(tenantId, clienteIdStr);
  if (!cliente) throw Object.assign(new Error('Cliente não encontrado'), { status: 404 });

  const valorNum = parseFloat(valor) || 0;
  if (valorNum < 0) throw Object.assign(new Error('Valor não pode ser negativo'), { status: 400 });

  const numero = await gerarNumeroOS(tenantId, repo);

  const ordem = await repo.createOrdem(tenantId, {
    clienteId:   clienteIdStr,
    numero,
    equipamento: equipamento.trim(),
    problema:    problema.trim(),
    observacoes: observacoes?.trim() || '',
    valor:       valorNum,
    status:      'EM_ANDAMENTO',
  });

  return formatOrdem(ordem);
}

module.exports = { execute };