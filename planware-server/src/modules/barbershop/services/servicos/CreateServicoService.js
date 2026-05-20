'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Cria um novo serviço para a barbearia.
 * Valida nome, preço, duração e nível mínimo do barbeiro.
 */
async function execute(tenantId, data) {
  if (!data.nome?.trim()) throw utils.badRequest('nome é obrigatório');
  if (data.preco == null) throw utils.badRequest('preco é obrigatório');
  if (data.duracaoMin == null) throw utils.badRequest('duracaoMin é obrigatório');

  utils.validatePositivo(data.preco, 'preco');

  const duracao = parseInt(data.duracaoMin);
  if (isNaN(duracao) || duracao < 5 || duracao > 480) {
    throw utils.badRequest('duracaoMin deve ser entre 5 e 480 minutos');
  }

  if (data.nivelMinimo) utils.validateNivel(data.nivelMinimo);

  if (data.comissaoPct != null) {
    const c = parseFloat(data.comissaoPct);
    if (isNaN(c) || c < 0 || c > 100) {
      throw utils.badRequest('comissaoPct deve ser entre 0 e 100');
    }
  }

  return repo.createServico(tenantId, {
    nome: data.nome.trim(),
    descricao: data.descricao || null,
    preco: parseFloat(data.preco),
    duracaoMin: duracao,
    comissaoPct: data.comissaoPct != null ? parseFloat(data.comissaoPct) : 50,
    nivelMinimo: data.nivelMinimo || 'JUNIOR',
  });
}

module.exports = { execute };