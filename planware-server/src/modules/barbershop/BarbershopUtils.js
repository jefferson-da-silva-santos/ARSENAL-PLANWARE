'use strict';

// ─────────────────────────────────────────────────────────────
//  CONSTANTES
// ─────────────────────────────────────────────────────────────

const NIVEIS_VALIDOS = ['JUNIOR', 'PLENO', 'SENIOR', 'MASTER'];
const STATUS_AGEND = ['AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'FALTOU'];
const ORIGENS_AGEND = ['PRESENCIAL', 'ONLINE', 'WHATSAPP', 'TELEFONE'];
const TIPOS_BLOQUEIO = ['FERIAS', 'FOLGA', 'PAUSA', 'OUTRO'];
const STATUS_FILA = ['AGUARDANDO', 'CHAMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'DESISTIU'];
const TIPOS_MOV_ESTOQUE = ['ENTRADA', 'SAIDA', 'AJUSTE'];
const STATUS_ASSINATURA = ['ATIVA', 'SUSPENSA', 'CANCELADA', 'VENCIDA'];
const DIAS_SEMANA = [0, 1, 2, 3, 4, 5, 6]; // 0=Dom, 6=Sáb

// ─────────────────────────────────────────────────────────────
//  HELPERS DE ERRO
// ─────────────────────────────────────────────────────────────

/**
 * Cria um erro com status HTTP definido.
 * Padrão do projeto: services lançam, controllers capturam.
 */
function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function badRequest(message) { return createError(message, 400); }
function notFound(message) { return createError(message, 404); }
function conflict(message) { return createError(message, 409); }
function forbidden(message) { return createError(message, 403); }

// ─────────────────────────────────────────────────────────────
//  VALIDAÇÕES
// ─────────────────────────────────────────────────────────────

function validateNivel(nivel) {
  if (!NIVEIS_VALIDOS.includes(nivel)) {
    throw badRequest(`nivel inválido. Válidos: ${NIVEIS_VALIDOS.join(', ')}`);
  }
}

function validateStatusAgend(status) {
  if (!STATUS_AGEND.includes(status)) {
    throw badRequest(`status inválido. Válidos: ${STATUS_AGEND.join(', ')}`);
  }
}

function validateOrigem(origem) {
  if (!ORIGENS_AGEND.includes(origem)) {
    throw badRequest(`origem inválida. Válidas: ${ORIGENS_AGEND.join(', ')}`);
  }
}

function validateTipoBloqueio(tipo) {
  if (!TIPOS_BLOQUEIO.includes(tipo)) {
    throw badRequest(`tipo de bloqueio inválido. Válidos: ${TIPOS_BLOQUEIO.join(', ')}`);
  }
}

function validateTipoMovEstoque(tipo) {
  if (!TIPOS_MOV_ESTOQUE.includes(tipo)) {
    throw badRequest(`tipo de movimentação inválido. Válidos: ${TIPOS_MOV_ESTOQUE.join(', ')}`);
  }
}

function validateStatusAssinatura(status) {
  if (!STATUS_ASSINATURA.includes(status)) {
    throw badRequest(`status de assinatura inválido. Válidos: ${STATUS_ASSINATURA.join(', ')}`);
  }
}

function validateNota(nota, campo = 'nota') {
  if (nota !== undefined && nota !== null) {
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      throw badRequest(`${campo} deve ser um inteiro entre 1 e 5`);
    }
  }
}

function validatePositivo(valor, campo = 'valor') {
  if (valor == null || isNaN(valor) || parseFloat(valor) <= 0) {
    throw badRequest(`${campo} deve ser um número positivo`);
  }
}

function validateDataHora(dataHora) {
  if (!dataHora) throw badRequest('dataHora é obrigatório');
  const d = new Date(dataHora);
  if (isNaN(d.getTime())) throw badRequest('dataHora inválido');
  return d;
}

function validateHorarioHHMM(valor, campo) {
  if (!/^\d{2}:\d{2}$/.test(valor)) {
    throw badRequest(`${campo} deve estar no formato HH:mm (ex: 08:00)`);
  }
}

// ─────────────────────────────────────────────────────────────
//  DISPONIBILIDADE — geração de slots de horário
// ─────────────────────────────────────────────────────────────

/**
 * Gera todos os slots de tempo para um dia, respeitando:
 *   - horário de abertura e fechamento da barbearia
 *   - intervalo configurado (ex: 30 min)
 *   - duração do serviço (o slot deve terminar antes do fechamento)
 *
 * @param {string} data         - YYYY-MM-DD
 * @param {string} abertura     - HH:mm
 * @param {string} fechamento   - HH:mm
 * @param {number} intervaloMin - minutos entre slots
 * @param {number} duracaoMin   - duração do serviço
 * @returns {Date[]}            - lista de DateTimes representando o início de cada slot
 */
function gerarSlotsDia(data, abertura, fechamento, intervaloMin, duracaoMin) {
  const [hAb, mAb] = abertura.split(':').map(Number);
  const [hFe, mFe] = fechamento.split(':').map(Number);

  const slots = [];
  const base = new Date(data + 'T00:00:00');

  let cursor = new Date(base);
  cursor.setHours(hAb, mAb, 0, 0);

  const limite = new Date(base);
  limite.setHours(hFe, mFe, 0, 0);

  while (true) {
    const fim = new Date(cursor.getTime() + duracaoMin * 60 * 1000);
    if (fim > limite) break;
    slots.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + intervaloMin * 60 * 1000);
  }

  return slots;
}

/**
 * Filtra slots removendo os que colidem com agendamentos existentes
 * ou com bloqueios de agenda do barbeiro.
 *
 * Um slot colide se [slotInicio, slotFim] se sobrepõe a
 * [agendInicio, agendFim] — qualquer interseção conta.
 *
 * @param {Date[]}   slots        - slots gerados por gerarSlotsDia
 * @param {number}   duracaoMin   - duração do serviço em minutos
 * @param {object[]} agendamentos - agendamentos existentes { dataHora, duracaoMin }
 * @param {object[]} bloqueios    - bloqueios { inicio, fim }
 * @returns {Date[]}              - slots disponíveis
 */
function filtrarSlotsOcupados(slots, duracaoMin, agendamentos, bloqueios) {
  return slots.filter(slot => {
    const slotInicio = slot.getTime();
    const slotFim = slotInicio + duracaoMin * 60 * 1000;

    // Verifica conflito com agendamentos
    const conflitaAgend = agendamentos.some(ag => {
      const agInicio = new Date(ag.dataHora).getTime();
      const agFim = agInicio + ag.duracaoMin * 60 * 1000;
      return slotInicio < agFim && slotFim > agInicio;
    });

    if (conflitaAgend) return false;

    // Verifica conflito com bloqueios
    const conflitaBloqueio = bloqueios.some(bl => {
      const blInicio = new Date(bl.inicio).getTime();
      const blFim = new Date(bl.fim).getTime();
      return slotInicio < blFim && slotFim > blInicio;
    });

    return !conflitaBloqueio;
  });
}

// ─────────────────────────────────────────────────────────────
//  FORMATADORES
// ─────────────────────────────────────────────────────────────

function formatBarbeiro(b) {
  if (!b) return null;
  return {
    id: b.id,
    nome: b.nome,
    telefone: b.telefone,
    email: b.email,
    foto: b.foto,
    nivel: b.nivel,
    comissaoPct: b.comissaoPct,
    ativo: b.ativo,
    metaMensal: b.metaMensal,
    metaCortes: b.metaCortes,
    totalAgendamentos: b._count?.agendamentos ?? undefined,
    totalAvaliacoes: b._count?.avaliacoes ?? undefined,
    createdAt: b.createdAt,
  };
}

function formatServico(s) {
  if (!s) return null;
  return {
    id: s.id,
    nome: s.nome,
    descricao: s.descricao,
    preco: s.preco,
    duracaoMin: s.duracaoMin,
    comissaoPct: s.comissaoPct,
    nivelMinimo: s.nivelMinimo,
    ativo: s.ativo,
  };
}

function formatCliente(c) {
  if (!c) return null;
  return {
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    email: c.email,
    dataNascimento: c.dataNascimento,
    pontosFidelidade: c.pontosFidelidade,
    totalVisitas: c.totalVisitas,
    ultimaVisita: c.ultimaVisita,
    observacoes: c.observacoes,
    ativo: c.ativo,
    assinaturaAtiva: c.assinaturas?.[0] ?? undefined,
    createdAt: c.createdAt,
  };
}

function formatAgendamento(a) {
  if (!a) return null;
  return {
    id: a.id,
    dataHora: a.dataHora,
    duracaoMin: a.duracaoMin,
    valorCobrado: a.valorCobrado,
    status: a.status,
    origem: a.origem,
    observacoes: a.observacoes,
    nomeCliente: a.nomeCliente,
    telefoneCliente: a.telefoneCliente,
    barbeiro: a.barbeiro ? { id: a.barbeiro.id, nome: a.barbeiro.nome, foto: a.barbeiro.foto } : undefined,
    cliente: a.cliente ? { id: a.cliente.id, nome: a.cliente.nome, telefone: a.cliente.telefone } : undefined,
    servico: a.servico ? { id: a.servico.id, nome: a.servico.nome, duracaoMin: a.servico.duracaoMin } : undefined,
    avaliacao: a.avaliacao ?? undefined,
    comissao: a.comissao ?? undefined,
    createdAt: a.createdAt,
  };
}

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  // Constantes
  NIVEIS_VALIDOS,
  STATUS_AGEND,
  ORIGENS_AGEND,
  TIPOS_BLOQUEIO,
  STATUS_FILA,
  TIPOS_MOV_ESTOQUE,
  STATUS_ASSINATURA,
  DIAS_SEMANA,
  // Helpers de erro
  badRequest, notFound, conflict, forbidden,
  // Validações
  validateNivel, validateStatusAgend, validateOrigem,
  validateTipoBloqueio, validateTipoMovEstoque, validateStatusAssinatura,
  validateNota, validatePositivo, validateDataHora, validateHorarioHHMM,
  // Disponibilidade
  gerarSlotsDia, filtrarSlotsOcupados,
  // Formatadores
  formatBarbeiro, formatServico, formatCliente, formatAgendamento,
};