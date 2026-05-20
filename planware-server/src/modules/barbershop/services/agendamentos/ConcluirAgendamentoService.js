'use strict';

/**
 * ConcluirAgendamentoService.js
 *
 * Conclui um agendamento e dispara os efeitos colaterais:
 *  1. Atualiza status para CONCLUIDO
 *  2. Gera registro de comissão do barbeiro
 *  3. Incrementa visitas e pontos de fidelidade do cliente
 *  4. Deduz crédito de assinatura (se cliente for assinante e serviço coberto)
 *
 * Todos os efeitos são operações independentes — um erro em comissão
 * não deve impedir a conclusão. Por isso usamos try/catch por bloco.
 */

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, agendamentoId, { valorFinal } = {}) {
  if (!agendamentoId) throw utils.badRequest('agendamentoId é obrigatório');

  // ── Carrega o agendamento ────────────────────────────────
  const agendamento = await repo.findAgendamento(tenantId, agendamentoId);
  if (!agendamento) throw utils.notFound('Agendamento não encontrado');

  if (agendamento.status === 'CONCLUIDO') {
    throw utils.badRequest('Este agendamento já foi concluído');
  }
  if (agendamento.status === 'CANCELADO') {
    throw utils.badRequest('Não é possível concluir um agendamento cancelado');
  }

  // Valor final pode ser diferente do original (desconto, ajuste)
  const valorCobrado = valorFinal != null
    ? parseFloat(valorFinal)
    : agendamento.valorCobrado;

  if (isNaN(valorCobrado) || valorCobrado < 0) {
    throw utils.badRequest('valorFinal deve ser um número não-negativo');
  }

  // ── 1. Conclui o agendamento ──────────────────────────────
  await repo.updateAgendamentoStatus(tenantId, agendamentoId, 'CONCLUIDO');

  // Atualiza valor cobrado se diferente
  if (valorCobrado !== agendamento.valorCobrado) {
    await repo.updateAgendamento(tenantId, agendamentoId, { valorCobrado });
  }

  // ── 2. Gera comissão do barbeiro ──────────────────────────
  try {
    const barbeiro = agendamento.barbeiro;
    const servico = agendamento.servico;
    // Prioridade: comissão override do barbeiro → comissão do serviço → 50%
    const percentual =
      barbeiro.comissaoPct ??
      servico.comissaoPct ??
      50;

    const valorComissao = (valorCobrado * percentual) / 100;

    await repo.createComissao({
      tenantId: tenantId,
      barbeiroId: agendamento.barbeiroId,
      agendamentoId: agendamento.id,
      valorServico: valorCobrado,
      percentual,
      valorComissao: Math.round(valorComissao * 100) / 100, // arredonda centavos
      repassado: false,
    });
  } catch (err) {
    // Loga mas não bloqueia — conclusão já foi feita
    console.error('[ConcluirAgendamento] Falha ao gerar comissão:', err.message);
  }

  // ── 3. Atualiza cliente (visitas + pontos) ────────────────
  if (agendamento.clienteId) {
    try {
      const config = await repo.findConfig(tenantId);
      const pontos = config?.pontosCorte ?? 10;

      await Promise.all([
        repo.incrementarVisita(agendamento.clienteId),
        repo.adicionarPontosCliente(agendamento.clienteId, pontos),
      ]);
    } catch (err) {
      console.error('[ConcluirAgendamento] Falha ao atualizar pontos do cliente:', err.message);
    }
  }

  // ── 4. Deduz crédito de assinatura (se aplicável) ─────────
  if (agendamento.clienteId) {
    try {
      const assinatura = await repo.findAssinaturaAtivaCliente(tenantId, agendamento.clienteId);

      if (assinatura && assinatura.creditosRestantes > 0) {
        const servicoIncluso =
          assinatura.servicosIncluidos.length === 0 || // plano universal
          assinatura.servicosIncluidos.includes(agendamento.servicoId);

        if (servicoIncluso) {
          await repo.usarCreditoAssinatura(assinatura.id);

          // Se esgotou os créditos, marca como VENCIDA
          if (assinatura.creditosRestantes - 1 <= 0) {
            await repo.updateAssinaturaStatus(tenantId, assinatura.id, 'VENCIDA');
          }
        }
      }
    } catch (err) {
      console.error('[ConcluirAgendamento] Falha ao deduzir crédito de assinatura:', err.message);
    }
  }

  // ── Retorna agendamento atualizado ────────────────────────
  const atualizado = await repo.findAgendamento(tenantId, agendamentoId);
  return utils.formatAgendamento({ ...atualizado, valorCobrado });
}

module.exports = { execute };