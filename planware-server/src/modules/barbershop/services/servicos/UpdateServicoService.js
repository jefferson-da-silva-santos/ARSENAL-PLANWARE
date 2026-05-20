'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, id, data) {
  const servico = await repo.findServico(tenantId, id);
  if (!servico) throw utils.notFound('Serviço não encontrado');

  const payload = {};

  if (data.nome !== undefined) payload.nome = data.nome.trim();
  if (data.descricao !== undefined) payload.descricao = data.descricao;
  if (data.ativo !== undefined) payload.ativo = data.ativo;

  if (data.preco !== undefined) {
    utils.validatePositivo(data.preco, 'preco');
    payload.preco = parseFloat(data.preco);
  }

  if (data.duracaoMin !== undefined) {
    const duracao = parseInt(data.duracaoMin);
    if (isNaN(duracao) || duracao < 5 || duracao > 480) {
      throw utils.badRequest('duracaoMin deve ser entre 5 e 480 minutos');
    }
    payload.duracaoMin = duracao;
  }

  if (data.nivelMinimo !== undefined) {
    utils.validateNivel(data.nivelMinimo);
    payload.nivelMinimo = data.nivelMinimo;
  }

  if (data.comissaoPct !== undefined) {
    const c = parseFloat(data.comissaoPct);
    if (isNaN(c) || c < 0 || c > 100) {
      throw utils.badRequest('comissaoPct deve ser entre 0 e 100');
    }
    payload.comissaoPct = c;
  }

  await repo.updateServico(tenantId, id, payload);
  return repo.findServico(tenantId, id);
}

module.exports = { execute };