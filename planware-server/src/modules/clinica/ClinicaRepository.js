'use strict';

const prisma = require('../../db/client');

// ─────────────────────────────────────────────────────────────
//  PACIENTES
// ─────────────────────────────────────────────────────────────

async function findAllPacientes(tenantId, { q, cpf, pagina = 1, limite = 20 } = {}) {
  const skip = (parseInt(pagina) - 1) * parseInt(limite);
  const where = {
    tenantId,
    ativo: true,
    ...(q && {
      OR: [
        { nome: { contains: q, mode: 'insensitive' } },
        { telefone: { contains: q, mode: 'insensitive' } },
      ],
    }),
    ...(cpf && { cpf: { contains: cpf.replace(/\D/g, '') } }),
  };

  const [total, pacientes] = await Promise.all([
    prisma.clinicaPaciente.count({ where }),
    prisma.clinicaPaciente.findMany({
      where,
      orderBy: { nome: 'asc' },
      skip,
      take: parseInt(limite),
      include: {
        _count: { select: { atendimentos: true } },
        atendimentos: { orderBy: { dataHora: 'desc' }, take: 1, select: { dataHora: true } },
      },
    }),
  ]);

  return {
    pacientes: pacientes.map((p) => ({
      ...formatPaciente(p),
      total_atendimentos: p._count.atendimentos,
      ultimo_atendimento: p.atendimentos[0]?.dataHora ?? null,
    })),
    total,
    pagina: parseInt(pagina),
    limite: parseInt(limite),
  };
}

async function findPacienteById(tenantId, id) {
  return prisma.clinicaPaciente.findFirst({ where: { id, tenantId, ativo: true } });
}

async function findPacienteByCpf(tenantId, cpf) {
  return prisma.clinicaPaciente.findUnique({ where: { tenantId_cpf: { tenantId, cpf } } });
}

async function createPaciente(tenantId, data) {
  return prisma.clinicaPaciente.create({
    data: {
      tenantId,
      nome: data.nome,
      cpf: data.cpf,
      telefone: data.telefone ?? null,
      email: data.email ?? null,
      dataNascimento: data.data_nascimento ?? null,
      sexo: data.sexo ?? null,
      endereco: data.endereco ?? null,
      convenio: data.convenio ?? null,
      observacoes: data.observacoes ?? null,
    },
  });
}

async function updatePaciente(tenantId, id, data) {
  return prisma.clinicaPaciente.updateMany({
    where: { id, tenantId },
    data: {
      nome: data.nome,
      cpf: data.cpf ?? undefined,
      telefone: data.telefone ?? null,
      email: data.email ?? null,
      dataNascimento: data.data_nascimento ?? null,
      sexo: data.sexo ?? null,
      endereco: data.endereco ?? null,
      convenio: data.convenio ?? null,
      observacoes: data.observacoes ?? null,
    },
  });
}

async function softDeletePaciente(tenantId, id) {
  return prisma.clinicaPaciente.updateMany({ where: { id, tenantId }, data: { ativo: false } });
}

// ─────────────────────────────────────────────────────────────
//  AGENDAMENTOS
// ─────────────────────────────────────────────────────────────

async function findAllAgendamentos(tenantId, filters = {}) {
  const { data, profissional_id, status, paciente_id, data_inicio, data_fim } = filters;

  return prisma.clinicaAgendamento.findMany({
    where: {
      tenantId,
      ...(data && { dataHora: { gte: new Date(data + 'T00:00:00'), lte: new Date(data + 'T23:59:59') } }),
      ...(data_inicio && !data && { dataHora: { gte: new Date(data_inicio) } }),
      ...(data_fim && !data && { dataHora: { lte: new Date(data_fim + 'T23:59:59') } }),
      ...(profissional_id && { profissionalId: profissional_id }),
      ...(status && { status: status.toUpperCase() }),
      ...(paciente_id && { pacienteId: paciente_id }),
    },
    include: {
      paciente: { select: { nome: true, telefone: true } },
    },
    orderBy: { dataHora: 'asc' },
  });
}

async function findAgendamentoById(tenantId, id) {
  return prisma.clinicaAgendamento.findFirst({ where: { id, tenantId } });
}

async function findConflito(tenantId, profissionalId, dataHora, duracaoMin, excludeId = null) {
  const inicio = new Date(dataHora);
  const fim = new Date(inicio.getTime() + duracaoMin * 60000);

  const agendamentos = await prisma.clinicaAgendamento.findMany({
    where: {
      tenantId,
      profissionalId,
      status: { notIn: ['CANCELADO', 'FALTOU'] },
      ...(excludeId && { id: { not: excludeId } }),
    },
    select: { id: true, dataHora: true, duracaoMin: true },
  });

  return agendamentos.find((ag) => {
    const agInicio = new Date(ag.dataHora);
    const agFim = new Date(agInicio.getTime() + ag.duracaoMin * 60000);
    return inicio < agFim && fim > agInicio;
  });
}

async function createAgendamento(tenantId, data) {
  return prisma.clinicaAgendamento.create({
    data: {
      tenantId,
      pacienteId: data.paciente_id,
      profissionalId: data.profissional_id,
      dataHora: new Date(data.data_hora),
      duracaoMin: data.duracao_min ?? 30,
      tipo: data.tipo,
      observacoes: data.observacoes ?? null,
    },
  });
}

async function updateAgendamento(tenantId, id, data) {
  const updateData = {};
  if (data.status !== undefined) updateData.status = data.status.toUpperCase();
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
  if (data.data_hora !== undefined) updateData.dataHora = new Date(data.data_hora);
  if (data.duracao_min !== undefined) updateData.duracaoMin = data.duracao_min;
  if (data.tipo !== undefined) updateData.tipo = data.tipo;

  return prisma.clinicaAgendamento.updateMany({ where: { id, tenantId }, data: updateData });
}

async function cancelarAgendamento(tenantId, id) {
  return prisma.clinicaAgendamento.updateMany({
    where: { id, tenantId },
    data: { status: 'CANCELADO' },
  });
}

// ─────────────────────────────────────────────────────────────
//  ATENDIMENTOS
// ─────────────────────────────────────────────────────────────

async function findAllAtendimentos(tenantId, filters = {}) {
  const { paciente_id, profissional_id, data_inicio, data_fim, tipo, status } = filters;

  return prisma.clinicaAtendimento.findMany({
    where: {
      tenantId,
      ...(paciente_id && { pacienteId: paciente_id }),
      ...(profissional_id && { profissionalId: profissional_id }),
      ...(data_inicio && { dataHora: { gte: new Date(data_inicio) } }),
      ...(data_fim && { dataHora: { lte: new Date(data_fim + 'T23:59:59') } }),
      ...(tipo && { tipo }),
      ...(status && { status: status.toUpperCase() }),
    },
    include: {
      paciente: { select: { nome: true, cpf: true } },
      _count: { select: { anexos: true } },
    },
    orderBy: { dataHora: 'desc' },
  });
}

async function findAtendimentoById(tenantId, id) {
  return prisma.clinicaAtendimento.findFirst({
    where: { id, tenantId },
    include: {
      paciente: { select: { nome: true, cpf: true, dataNascimento: true } },
      anexos: true,
    },
  });
}

async function createAtendimento(tenantId, data) {
  return prisma.clinicaAtendimento.create({
    data: {
      tenantId,
      pacienteId: data.paciente_id,
      profissionalId: data.profissional_id,
      agendamentoId: data.agendamento_id ?? null,
      tipo: data.tipo,
      motivo: data.motivo,
      anamnese: data.anamnese ?? null,
      diagnostico: data.diagnostico ?? null,
      conduta: data.conduta ?? null,
      observacoes: data.observacoes ?? null,
      retornoEm: data.retorno_em ?? null,
    },
  });
}

async function updateAtendimento(tenantId, id, data) {
  const updateData = {};
  if (data.tipo !== undefined) updateData.tipo = data.tipo;
  if (data.motivo !== undefined) updateData.motivo = data.motivo;
  if (data.anamnese !== undefined) updateData.anamnese = data.anamnese;
  if (data.diagnostico !== undefined) updateData.diagnostico = data.diagnostico;
  if (data.conduta !== undefined) updateData.conduta = data.conduta;
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes;
  if (data.retorno_em !== undefined) updateData.retornoEm = data.retorno_em;
  if (data.status !== undefined) updateData.status = data.status.toUpperCase();

  return prisma.clinicaAtendimento.updateMany({ where: { id, tenantId }, data: updateData });
}

async function cancelarAtendimento(tenantId, id) {
  return prisma.clinicaAtendimento.updateMany({
    where: { id, tenantId },
    data: { status: 'CANCELADO' },
  });
}

// ─────────────────────────────────────────────────────────────
//  ANEXOS
// ─────────────────────────────────────────────────────────────

async function findAnexoById(id) {
  return prisma.clinicaAnexo.findUnique({ where: { id } });
}

async function createAnexo(data) {
  return prisma.clinicaAnexo.create({ data });
}

async function deleteAnexo(id) {
  return prisma.clinicaAnexo.delete({ where: { id } });
}

// ─────────────────────────────────────────────────────────────
//  ALERTAS
// ─────────────────────────────────────────────────────────────

async function findAlertasByUsuario(tenantId, usuarioId) {
  return prisma.clinicaAlerta.findMany({
    where: {
      tenantId,
      OR: [{ usuarioId }, { usuarioId: null }],
    },
    include: { paciente: { select: { nome: true } } },
    orderBy: { criadoEm: 'desc' },
    take: 50,
  });
}

async function createAlerta(tenantId, data) {
  return prisma.clinicaAlerta.create({
    data: {
      tenantId,
      tipo: data.tipo,
      titulo: data.titulo,
      mensagem: data.mensagem ?? null,
      pacienteId: data.pacienteId ?? null,
      agendamentoId: data.agendamentoId ?? null,
      usuarioId: data.usuarioId ?? null,
    },
  });
}

async function marcarAlertaLido(tenantId, id) {
  return prisma.clinicaAlerta.updateMany({ where: { id, tenantId }, data: { lido: true } });
}

async function marcarTodosLidos(tenantId, usuarioId) {
  return prisma.clinicaAlerta.updateMany({
    where: { tenantId, OR: [{ usuarioId }, { usuarioId: null }] },
    data: { lido: true },
  });
}

// ─────────────────────────────────────────────────────────────
//  LOGS
// ─────────────────────────────────────────────────────────────

async function registrarLog(tenantId, { usuarioId, usuarioNome, acao, entidade, entidadeId, detalhes }) {
  try {
    await prisma.clinicaLog.create({
      data: {
        tenantId,
        usuarioId: usuarioId ?? null,
        usuarioNome: usuarioNome ?? null,
        acao,
        entidade,
        entidadeId: entidadeId ? String(entidadeId) : null,
        detalhes: detalhes ? JSON.stringify(detalhes) : null,
      },
    });
  } catch (_) { /* log nunca deve quebrar o fluxo */ }
}

async function findLogs(tenantId, { entidade, usuario_id, pagina = 1, limite = 50 } = {}) {
  const skip = (parseInt(pagina) - 1) * parseInt(limite);
  const where = {
    tenantId,
    ...(entidade && { entidade }),
    ...(usuario_id && { usuarioId: usuario_id }),
  };

  const [total, logs] = await Promise.all([
    prisma.clinicaLog.count({ where }),
    prisma.clinicaLog.findMany({ where, orderBy: { criadoEm: 'desc' }, skip, take: parseInt(limite) }),
  ]);

  return { logs, total };
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────

async function getDashboard(tenantId) {
  const hoje = new Date();
  const hojeStr = hoje.toISOString().split('T')[0];
  const inicioDia = new Date(hojeStr + 'T00:00:00');
  const fimDia = new Date(hojeStr + 'T23:59:59');

  const [
    totalPacientes,
    agendHoje,
    atendHoje,
    agendStatus,
    proximosAgend,
    alertasPendentes,
  ] = await Promise.all([
    prisma.clinicaPaciente.count({ where: { tenantId, ativo: true } }),

    prisma.clinicaAgendamento.count({
      where: { tenantId, dataHora: { gte: inicioDia, lte: fimDia }, status: { notIn: ['CANCELADO', 'FALTOU'] } },
    }),

    prisma.clinicaAtendimento.count({
      where: { tenantId, dataHora: { gte: inicioDia, lte: fimDia } },
    }),

    prisma.clinicaAgendamento.groupBy({
      by: ['status'],
      where: { tenantId, dataHora: { gte: inicioDia, lte: fimDia } },
      _count: true,
    }),

    prisma.clinicaAgendamento.findMany({
      where: {
        tenantId,
        dataHora: { gte: new Date() },
        status: { in: ['AGENDADO', 'CONFIRMADO'] },
      },
      include: { paciente: { select: { nome: true } } },
      orderBy: { dataHora: 'asc' },
      take: 8,
    }),

    prisma.clinicaAlerta.count({ where: { tenantId, lido: false } }),
  ]);

  return {
    total_pacientes: totalPacientes,
    agend_hoje: agendHoje,
    atend_hoje: atendHoje,
    agend_status: agendStatus.map((s) => ({ status: s.status.toLowerCase(), n: s._count })),
    proximos_agendamentos: proximosAgend.map((a) => ({
      id: a.id,
      data_hora: a.dataHora,
      tipo: a.tipo,
      status: a.status.toLowerCase(),
      paciente_nome: a.paciente.nome,
    })),
    alertas_pendentes: alertasPendentes,
  };
}

// ─────────────────────────────────────────────────────────────
//  BUSCA GLOBAL
// ─────────────────────────────────────────────────────────────

async function buscaGlobal(tenantId, q) {
  const [pacientes, atendimentos] = await Promise.all([
    prisma.clinicaPaciente.findMany({
      where: {
        tenantId, ativo: true,
        OR: [
          { nome: { contains: q, mode: 'insensitive' } },
          { cpf: { contains: q } },
          { telefone: { contains: q } },
        ],
      },
      select: { id: true, nome: true, cpf: true, telefone: true },
      take: 10,
    }),

    prisma.clinicaAtendimento.findMany({
      where: {
        tenantId,
        OR: [
          { motivo: { contains: q, mode: 'insensitive' } },
          { tipo: { contains: q, mode: 'insensitive' } },
          { paciente: { nome: { contains: q, mode: 'insensitive' } } },
        ],
      },
      select: { id: true, tipo: true, motivo: true, dataHora: true, paciente: { select: { nome: true } } },
      take: 10,
    }),
  ]);

  return {
    pacientes,
    atendimentos: atendimentos.map((a) => ({ ...a, paciente_nome: a.paciente.nome })),
  };
}

// ─────────────────────────────────────────────────────────────
//  FORMATTERS
// ─────────────────────────────────────────────────────────────

function formatPaciente(p) {
  if (!p) return null;
  return {
    id: p.id,
    nome: p.nome,
    cpf: p.cpf,
    telefone: p.telefone,
    email: p.email,
    data_nascimento: p.dataNascimento,
    sexo: p.sexo,
    endereco: p.endereco,
    convenio: p.convenio,
    observacoes: p.observacoes,
    ativo: p.ativo,
    criado_em: p.criadoEm,
    atualizado_em: p.atualizadoEm,
  };
}

function formatAgendamento(a) {
  if (!a) return null;
  return {
    id: a.id,
    paciente_id: a.pacienteId,
    paciente_nome: a.paciente?.nome ?? null,
    paciente_telefone: a.paciente?.telefone ?? null,
    profissional_id: a.profissionalId,
    data_hora: a.dataHora,
    duracao_min: a.duracaoMin,
    tipo: a.tipo,
    status: a.status?.toLowerCase(),
    observacoes: a.observacoes,
    criado_em: a.criadoEm,
  };
}

function formatAtendimento(a) {
  if (!a) return null;
  return {
    id: a.id,
    paciente_id: a.pacienteId,
    paciente_nome: a.paciente?.nome ?? null,
    paciente_cpf: a.paciente?.cpf ?? null,
    profissional_id: a.profissionalId,
    agendamento_id: a.agendamentoId,
    data_hora: a.dataHora,
    tipo: a.tipo,
    motivo: a.motivo,
    anamnese: a.anamnese,
    diagnostico: a.diagnostico,
    conduta: a.conduta,
    observacoes: a.observacoes,
    retorno_em: a.retornoEm,
    status: a.status?.toLowerCase(),
    total_anexos: a._count?.anexos ?? a.anexos?.length ?? 0,
    anexos: a.anexos ?? undefined,
    criado_em: a.criadoEm,
  };
}

module.exports = {
  findAllPacientes, findPacienteById, findPacienteByCpf,
  createPaciente, updatePaciente, softDeletePaciente,
  findAllAgendamentos, findAgendamentoById, findConflito,
  createAgendamento, updateAgendamento, cancelarAgendamento,
  findAllAtendimentos, findAtendimentoById,
  createAtendimento, updateAtendimento, cancelarAtendimento,
  findAnexoById, createAnexo, deleteAnexo,
  findAlertasByUsuario, createAlerta, marcarAlertaLido, marcarTodosLidos,
  registrarLog, findLogs,
  getDashboard, buscaGlobal,
  formatPaciente, formatAgendamento, formatAtendimento,
};