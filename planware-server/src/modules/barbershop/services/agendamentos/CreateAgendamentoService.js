'use strict';

/**
 * CreateAgendamentoService.js
 *
 * Cria um novo agendamento garantindo:
 *  - barbeiro e serviço existem e estão ativos
 *  - cliente existe (se informado)
 *  - a data/hora não está no passado
 *  - não há conflito de horário para o barbeiro
 *  - o barbeiro tem nível suficiente para o serviço
 *  - não há bloqueio de agenda no período
 */

const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

// Ordem de progressão de nível — usada para verificar elegibilidade
const NIVEL_ORDER = { JUNIOR: 0, PLENO: 1, SENIOR: 2, MASTER: 3 };

async function execute(tenantId, data) {
  const {
    barbeiroId,
    servicoId,
    dataHora,
    clienteId,
    nomeCliente,
    telefoneCliente,
    origem = 'PRESENCIAL',
    observacoes,
  } = data;

  // ── Validações de campos obrigatórios ────────────────────
  if (!barbeiroId) throw utils.badRequest('barbeiroId é obrigatório');
  if (!servicoId) throw utils.badRequest('servicoId é obrigatório');

  const dataHoraParsed = utils.validateDataHora(dataHora);
  if (dataHoraParsed < new Date()) {
    throw utils.badRequest('Não é possível agendar para uma data/hora no passado');
  }

  if (origem) utils.validateOrigem(origem);

  // Precisa de pelo menos um identificador do cliente
  if (!clienteId && !nomeCliente) {
    throw utils.badRequest('Informe clienteId ou nomeCliente para o agendamento');
  }

  // ── Carrega entidades ────────────────────────────────────
  const [barbeiro, servico] = await Promise.all([
    repo.findBarbeiro(tenantId, barbeiroId),
    repo.findServico(tenantId, servicoId),
  ]);

  if (!barbeiro) throw utils.notFound('Barbeiro não encontrado');
  if (!servico) throw utils.notFound('Serviço não encontrado');
  if (!barbeiro.ativo) throw utils.badRequest('Barbeiro está inativo');
  if (!servico.ativo) throw utils.badRequest('Serviço está inativo');

  // ── Verifica nível do barbeiro ───────────────────────────
  const nivelBarbeiro = NIVEL_ORDER[barbeiro.nivel] ?? 0;
  const nivelMinimo = NIVEL_ORDER[servico.nivelMinimo] ?? 0;
  if (nivelBarbeiro < nivelMinimo) {
    throw utils.forbidden(
      `Este serviço requer nível ${servico.nivelMinimo}. Barbeiro é ${barbeiro.nivel}`
    );
  }

  // ── Verifica cliente (se informado) ──────────────────────
  if (clienteId) {
    const cliente = await repo.findCliente(tenantId, clienteId);
    if (!cliente) throw utils.notFound('Cliente não encontrado');
    if (!cliente.ativo) throw utils.badRequest('Cliente está inativo');
  }

  // ── Verifica conflito de agendamento ─────────────────────
  const inicioNovo = dataHoraParsed.getTime();
  const fimNovo = inicioNovo + servico.duracaoMin * 60 * 1000;

  // Busca agendamentos do barbeiro no mesmo dia
  const inicioDia = new Date(dataHoraParsed);
  inicioDia.setHours(0, 0, 0, 0);
  const fimDia = new Date(dataHoraParsed);
  fimDia.setHours(23, 59, 59, 999);

  const agendamentosExistentes = await repo.findAgendamentosByBarbeiroNoPeriodo(
    barbeiroId,
    inicioDia,
    fimDia,
  );

  const temConflito = agendamentosExistentes.some(ag => {
    const agInicio = new Date(ag.dataHora).getTime();
    const agFim = agInicio + ag.duracaoMin * 60 * 1000;
    return inicioNovo < agFim && fimNovo > agInicio;
  });

  if (temConflito) {
    throw utils.conflict('O barbeiro já possui um agendamento neste horário');
  }

  // ── Verifica bloqueios ───────────────────────────────────
  const dataStr = dataHoraParsed.toISOString().split('T')[0];
  const bloqueios = await repo.findBloqueios(barbeiroId, {
    de: dataStr + 'T00:00:00',
    ate: dataStr + 'T23:59:59',
  });

  const bloqueado = bloqueios.some(bl => {
    const blInicio = new Date(bl.inicio).getTime();
    const blFim = new Date(bl.fim).getTime();
    return inicioNovo < blFim && fimNovo > blInicio;
  });

  if (bloqueado) {
    throw utils.conflict('O barbeiro está com agenda bloqueada neste horário');
  }

  // ── Cria o agendamento ───────────────────────────────────
  const agendamento = await repo.createAgendamento(tenantId, {
    barbeiroId,
    servicoId,
    clienteId: clienteId || null,
    nomeCliente: nomeCliente || null,
    telefoneCliente: telefoneCliente || null,
    dataHora: dataHoraParsed.toISOString(),
    duracaoMin: servico.duracaoMin,
    valorCobrado: servico.preco,      // preço no momento do agendamento
    origem,
    observacoes: observacoes || null,
  });

  return utils.formatAgendamento(agendamento);
}

module.exports = { execute };