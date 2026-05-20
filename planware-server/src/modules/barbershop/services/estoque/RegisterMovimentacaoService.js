'use strict';

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Registra uma movimentação de estoque (entrada, saída ou ajuste).
 *
 * - ENTRADA: incrementa quantidadeAtual
 * - SAIDA:   decrementa quantidadeAtual — verifica saldo antes
 * - AJUSTE:  define a quantidade exata (para inventário)
 */
async function execute(tenantId, produtoId, data) {
  if (!produtoId) throw utils.badRequest('produtoId é obrigatório');
  if (!data.tipo) throw utils.badRequest('tipo é obrigatório');
  if (!data.quantidade) throw utils.badRequest('quantidade é obrigatória');

  utils.validateTipoMovEstoque(data.tipo);

  const qtd = parseInt(data.quantidade);
  if (isNaN(qtd) || qtd <= 0) {
    throw utils.badRequest('quantidade deve ser um inteiro positivo');
  }

  const produto = await repo.findProduto(tenantId, produtoId);
  if (!produto) throw utils.notFound('Produto não encontrado');
  if (!produto.ativo) throw utils.badRequest('Produto está inativo');

  if (data.tipo === 'SAIDA' && produto.quantidadeAtual < qtd) {
    throw utils.badRequest(
      `Estoque insuficiente. Disponível: ${produto.quantidadeAtual}, solicitado: ${qtd}`
    );
  }

  // Para AJUSTE, a lógica no repository usa increment/decrement
  // mas queremos definir o valor absoluto — trata como diferença
  let quantidadeFinal = qtd;
  let tipoFinal = data.tipo;

  if (data.tipo === 'AJUSTE') {
    // Calcula a diferença para usar o mesmo mecanismo de increment/decrement
    const diferenca = qtd - produto.quantidadeAtual;
    if (diferenca === 0) {
      return { mensagem: 'Estoque já está no valor informado', produto };
    }
    tipoFinal = diferenca > 0 ? 'ENTRADA' : 'SAIDA';
    quantidadeFinal = Math.abs(diferenca);
  }

  const [movimentacao] = await repo.registrarMovEstoque(
    produtoId,
    tipoFinal,
    quantidadeFinal,
    data.motivo || null,
  );

  return {
    movimentacao,
    novaQuantidade: data.tipo === 'AJUSTE'
      ? qtd
      : data.tipo === 'ENTRADA'
        ? produto.quantidadeAtual + quantidadeFinal
        : produto.quantidadeAtual - quantidadeFinal,
  };
}

module.exports = { execute };