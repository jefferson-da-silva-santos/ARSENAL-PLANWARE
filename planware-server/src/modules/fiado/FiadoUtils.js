'use strict';

// Validações simples para o módulo fiado
function validateCliente({ nome }) {
  if (!nome?.trim()) return 'Nome é obrigatório';
  return null;
}

function validateConta({ cliente_id, descricao, valor_total, num_parcelas, data_primeira }) {
  if (!cliente_id) return 'cliente_id é obrigatório';
  if (!descricao?.trim()) return 'Descrição é obrigatória';
  if (!valor_total || valor_total <= 0) return 'Valor total deve ser maior que zero';
  if (!data_primeira) return 'Data da primeira parcela é obrigatória';
  if (num_parcelas < 1 || num_parcelas > 120) return 'Número de parcelas deve ser entre 1 e 120';
  return null;
}

module.exports = { validateCliente, validateConta };