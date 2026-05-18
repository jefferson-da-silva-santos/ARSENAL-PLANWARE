'use strict';

const VALID_STATUSES = ['EM_ANDAMENTO', 'PRONTO', 'CANCELADO'];

function validateStatus(status) {
  return VALID_STATUSES.includes(status?.toUpperCase());
}

function normalizeStatus(status) {
  return status?.toUpperCase();
}

async function gerarNumeroOS(tenantId, repo) {
  const count = await repo.countOrdens(tenantId);
  const numero = String(count + 1).padStart(5, '0');
  return `OS-${numero}`;
}

function formatOrdem(ordem) {
  if (!ordem) return null;
  return {
    id: ordem.id,
    numero: ordem.numero,
    cliente_id: ordem.clienteId,
    cliente_nome: ordem.cliente?.nome ?? null,
    cliente_telefone: ordem.cliente?.telefone ?? null,
    equipamento: ordem.equipamento,
    problema: ordem.problema,
    observacoes: ordem.observacoes,
    valor: ordem.valor,
    status: ordem.status?.toLowerCase(),
    criado_em: ordem.criadoEm,
    atualizado_em: ordem.atualizadoEm,
  };
}

module.exports = { VALID_STATUSES, validateStatus, normalizeStatus, gerarNumeroOS, formatOrdem };