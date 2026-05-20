'use strict';

/**
 * GetDisponibilidadeService.js
 *
 * Responsabilidade única: calcular os horários disponíveis
 * para agendamento dado um barbeiro, data e serviço.
 *
 * Algoritmo:
 *  1. Valida os parâmetros de entrada
 *  2. Carrega a configuração da barbearia (horários, intervalo)
 *  3. Verifica se o dia da semana está no funcionamento
 *  4. Gera todos os slots do dia
 *  5. Busca agendamentos existentes do barbeiro no dia
 *  6. Busca bloqueios de agenda (férias, folga, pausa)
 *  7. Filtra os slots ocupados
 *  8. Remove slots no passado
 *  9. Retorna slots disponíveis formatados
 */

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

async function execute(tenantId, { barbeiroId, servicoId, data }) {
  // ── Validações de entrada ─────────────────────────────────
  if (!barbeiroId) throw utils.badRequest('barbeiroId é obrigatório');
  if (!servicoId) throw utils.badRequest('servicoId é obrigatório');
  if (!data) throw utils.badRequest('data é obrigatória (YYYY-MM-DD)');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    throw utils.badRequest('data deve estar no formato YYYY-MM-DD');
  }

  // Não permite buscar disponibilidade de datas passadas
  const dataRequisitada = new Date(data + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (dataRequisitada < hoje) {
    throw utils.badRequest('Não é possível verificar disponibilidade para datas passadas');
  }

  // ── Carrega entidades necessárias ─────────────────────────
  const [config, barbeiro, servico] = await Promise.all([
    repo.findConfig(tenantId),
    repo.findBarbeiro(tenantId, barbeiroId),
    repo.findServico(tenantId, servicoId),
  ]);

  if (!barbeiro) throw utils.notFound('Barbeiro não encontrado');
  if (!servico) throw utils.notFound('Serviço não encontrado');
  if (!barbeiro.ativo) throw utils.badRequest('Barbeiro está inativo');
  if (!servico.ativo) throw utils.badRequest('Serviço está inativo');

  // Usa configuração padrão se não houver config cadastrada
  const abertura = config?.horarioAbertura ?? '08:00';
  const fechamento = config?.horarioFechamento ?? '20:00';
  const intervalo = config?.intervaloSlot ?? 30;
  const diasFuncionamento = config?.diasFuncionamento ?? [1, 2, 3, 4, 5, 6];

  // ── Verifica dia de funcionamento ─────────────────────────
  const diaSemana = dataRequisitada.getDay(); // 0=Dom..6=Sáb
  if (!diasFuncionamento.includes(diaSemana)) {
    return {
      data,
      barbeiroId,
      servicoId,
      duracaoMin: servico.duracaoMin,
      abertura,
      fechamento,
      disponivel: false,
      motivo: 'Barbearia não funciona neste dia da semana',
      slots: [],
    };
  }

  // ── Gera slots do dia ────────────────────────────────────
  const todosSlots = utils.gerarSlotsDia(
    data,
    abertura,
    fechamento,
    intervalo,
    servico.duracaoMin,
  );

  if (todosSlots.length === 0) {
    return {
      data, barbeiroId, servicoId,
      duracaoMin: servico.duracaoMin,
      disponivel: false,
      motivo: 'Nenhum slot possível com a duração deste serviço no horário de funcionamento',
      slots: [],
    };
  }

  // ── Busca ocupações existentes ───────────────────────────
  const inicioDia = new Date(data + 'T00:00:00');
  const fimDia = new Date(data + 'T23:59:59');

  const [agendamentos, bloqueios] = await Promise.all([
    repo.findAgendamentosByBarbeiroNoPeriodo(barbeiroId, inicioDia, fimDia),
    repo.findBloqueios(barbeiroId, { de: data + 'T00:00:00', ate: data + 'T23:59:59' }),
  ]);

  // ── Filtra slots ocupados ────────────────────────────────
  let slotsDisponiveis = utils.filtrarSlotsOcupados(
    todosSlots,
    servico.duracaoMin,
    agendamentos,
    bloqueios,
  );

  // Remove slots que já passaram (para o dia de hoje)
  const agora = new Date();
  if (dataRequisitada.toDateString() === agora.toDateString()) {
    // Adiciona 15 min de margem para não mostrar slots que estão para começar agora
    const minimoFuturo = new Date(agora.getTime() + 15 * 60 * 1000);
    slotsDisponiveis = slotsDisponiveis.filter(s => s > minimoFuturo);
  }

  // ── Formata resposta ─────────────────────────────────────
  return {
    data,
    barbeiroId,
    barbeiro: { id: barbeiro.id, nome: barbeiro.nome },
    servicoId,
    servico: { id: servico.id, nome: servico.nome, duracaoMin: servico.duracaoMin },
    abertura,
    fechamento,
    disponivel: slotsDisponiveis.length > 0,
    totalSlots: todosSlots.length,
    slotsOcupados: todosSlots.length - slotsDisponiveis.length,
    slotsDisponiveis: slotsDisponiveis.length,
    slots: slotsDisponiveis.map(s => ({
      dataHora: s.toISOString(),
      horaFormatada: s.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    })),
  };
}

module.exports = { execute };