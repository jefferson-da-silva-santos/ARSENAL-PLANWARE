'use strict';

/**
 * BarbershopRepository.js
 *
 * Camada exclusiva de acesso ao banco para o módulo BarberShop.
 * Nenhuma lógica de negócio aqui — apenas queries Prisma.
 *
 * Organização:
 *   1. Config
 *   2. Serviços
 *   3. Barbeiros + Bloqueios
 *   4. Clientes
 *   5. Agendamentos
 *   6. Fila presencial
 *   7. Avaliações
 *   8. Comissões
 *   9. Estoque + Movimentações
 *  10. Assinaturas
 *  11. Fidelidade (recompensas + resgates)
 *  12. Financeiro (despesas + fechamento)
 *  13. Dashboard
 */

const prisma = require('../../db/client');

// ─────────────────────────────────────────────────────────────
//  1. CONFIG
// ─────────────────────────────────────────────────────────────

async function findConfig(tenantId) {
  return prisma.barberConfig.findUnique({ where: { tenantId } });
}

async function upsertConfig(tenantId, data) {
  return prisma.barberConfig.upsert({
    where: { tenantId },
    create: { tenantId, ...data },
    update: data,
  });
}

// ─────────────────────────────────────────────────────────────
//  2. SERVIÇOS
// ─────────────────────────────────────────────────────────────

async function findAllServicos(tenantId, { apenasAtivos = true } = {}) {
  return prisma.barberServico.findMany({
    where: { tenantId, ...(apenasAtivos ? { ativo: true } : {}) },
    orderBy: { nome: 'asc' },
  });
}

async function findServico(tenantId, id) {
  return prisma.barberServico.findFirst({ where: { id, tenantId } });
}

async function createServico(tenantId, data) {
  return prisma.barberServico.create({ data: { tenantId, ...data } });
}

async function updateServico(tenantId, id, data) {
  return prisma.barberServico.updateMany({ where: { id, tenantId }, data });
}

async function toggleServico(tenantId, id, ativo) {
  return prisma.barberServico.updateMany({ where: { id, tenantId }, data: { ativo } });
}

// ─────────────────────────────────────────────────────────────
//  3. BARBEIROS
// ─────────────────────────────────────────────────────────────

async function findAllBarbeiros(tenantId, { apenasAtivos = true } = {}) {
  return prisma.barberBarbeiro.findMany({
    where: { tenantId, ...(apenasAtivos ? { ativo: true } : {}) },
    orderBy: { nome: 'asc' },
    include: {
      // Média de avaliação inline via query bruta abaixo — aqui só retorna contagem
      _count: { select: { agendamentos: true, avaliacoes: true } },
    },
  });
}

async function findBarbeiro(tenantId, id) {
  return prisma.barberBarbeiro.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { agendamentos: true, avaliacoes: true } } },
  });
}

async function createBarbeiro(tenantId, data) {
  return prisma.barberBarbeiro.create({ data: { tenantId, ...data } });
}

async function updateBarbeiro(tenantId, id, data) {
  return prisma.barberBarbeiro.updateMany({ where: { id, tenantId }, data });
}

async function toggleBarbeiro(tenantId, id, ativo) {
  return prisma.barberBarbeiro.updateMany({ where: { id, tenantId }, data: { ativo } });
}

// ── Bloqueios de agenda ───────────────────────────────────────

async function findBloqueios(barbeiroId, { de, ate } = {}) {
  return prisma.barberBloqueio.findMany({
    where: {
      barbeiroId,
      ...(de || ate ? {
        inicio: { ...(de ? { gte: new Date(de) } : {}) },
        fim: { ...(ate ? { lte: new Date(ate) } : {}) },
      } : {}),
    },
    orderBy: { inicio: 'asc' },
  });
}

async function createBloqueio(barbeiroId, data) {
  return prisma.barberBloqueio.create({
    data: {
      barbeiroId,
      tipo: data.tipo,
      inicio: new Date(data.inicio),
      fim: new Date(data.fim),
      motivo: data.motivo || null,
    },
  });
}

async function deleteBloqueio(barbeiroId, id) {
  return prisma.barberBloqueio.deleteMany({ where: { id, barbeiroId } });
}

// ─────────────────────────────────────────────────────────────
//  4. CLIENTES
// ─────────────────────────────────────────────────────────────

async function findAllClientes(tenantId, search = '') {
  return prisma.barberCliente.findMany({
    where: {
      tenantId,
      ativo: true,
      ...(search ? {
        OR: [
          { nome: { contains: search, mode: 'insensitive' } },
          { telefone: { contains: search } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      } : {}),
    },
    orderBy: { nome: 'asc' },
  });
}

async function findCliente(tenantId, id) {
  return prisma.barberCliente.findFirst({
    where: { id, tenantId },
    include: {
      assinaturas: { where: { status: 'ATIVA' }, take: 1 },
      _count: { select: { agendamentos: true } },
    },
  });
}

async function findClienteByTelefone(tenantId, telefone) {
  return prisma.barberCliente.findFirst({ where: { tenantId, telefone, ativo: true } });
}

async function createCliente(tenantId, data) {
  return prisma.barberCliente.create({ data: { tenantId, ...data } });
}

async function updateCliente(tenantId, id, data) {
  return prisma.barberCliente.updateMany({ where: { id, tenantId }, data });
}

async function incrementarVisita(clienteId) {
  return prisma.barberCliente.update({
    where: { id: clienteId },
    data: { totalVisitas: { increment: 1 }, ultimaVisita: new Date() },
  });
}

async function adicionarPontosCliente(clienteId, pontos) {
  return prisma.barberCliente.update({
    where: { id: clienteId },
    data: { pontosFidelidade: { increment: pontos } },
  });
}

async function deduzirPontosCliente(clienteId, pontos) {
  return prisma.barberCliente.update({
    where: { id: clienteId },
    data: { pontosFidelidade: { decrement: pontos } },
  });
}

// ─────────────────────────────────────────────────────────────
//  5. AGENDAMENTOS
// ─────────────────────────────────────────────────────────────

async function findAllAgendamentos(tenantId, {
  data,           // filtrar por dia específico (YYYY-MM-DD)
  de,             // range início
  ate,            // range fim
  barbeiroId,
  clienteId,
  status,
  page = 1,
  perPage = 50,
} = {}) {
  const where = { tenantId };

  if (barbeiroId) where.barbeiroId = barbeiroId;
  if (clienteId) where.clienteId = clienteId;
  if (status) where.status = status;

  if (data) {
    // Busca um dia inteiro (00:00 até 23:59:59)
    const inicio = new Date(data + 'T00:00:00');
    const fim = new Date(data + 'T23:59:59');
    where.dataHora = { gte: inicio, lte: fim };
  } else if (de || ate) {
    where.dataHora = {
      ...(de ? { gte: new Date(de) } : {}),
      ...(ate ? { lte: new Date(ate) } : {}),
    };
  }

  const take = Math.min(parseInt(perPage) || 50, 200);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

  const [total, agendamentos] = await Promise.all([
    prisma.barberAgendamento.count({ where }),
    prisma.barberAgendamento.findMany({
      where,
      orderBy: { dataHora: 'asc' },
      take,
      skip,
      include: {
        barbeiro: { select: { id: true, nome: true, foto: true } },
        cliente: { select: { id: true, nome: true, telefone: true } },
        servico: { select: { id: true, nome: true, duracaoMin: true } },
      },
    }),
  ]);

  return { agendamentos, total, page: parseInt(page), perPage: take };
}

async function findAgendamento(tenantId, id) {
  return prisma.barberAgendamento.findFirst({
    where: { id, tenantId },
    include: {
      barbeiro: true,
      cliente: true,
      servico: true,
      avaliacao: true,
      comissao: true,
    },
  });
}

/**
 * Busca agendamentos de um barbeiro em um intervalo de tempo.
 * Usado pelo GetDisponibilidadeService para calcular horários livres.
 */
async function findAgendamentosByBarbeiroNoPeriodo(barbeiroId, inicio, fim) {
  return prisma.barberAgendamento.findMany({
    where: {
      barbeiroId,
      status: { notIn: ['CANCELADO', 'FALTOU'] },
      dataHora: { gte: inicio, lt: fim },
    },
    orderBy: { dataHora: 'asc' },
    select: { dataHora: true, duracaoMin: true, status: true },
  });
}

async function createAgendamento(tenantId, data) {
  return prisma.barberAgendamento.create({
    data: {
      tenantId,
      barbeiroId: data.barbeiroId,
      clienteId: data.clienteId || null,
      servicoId: data.servicoId,
      nomeCliente: data.nomeCliente || null,
      telefoneCliente: data.telefoneCliente || null,
      dataHora: new Date(data.dataHora),
      duracaoMin: data.duracaoMin,
      valorCobrado: data.valorCobrado,
      status: 'AGENDADO',
      origem: data.origem || 'PRESENCIAL',
      observacoes: data.observacoes || null,
    },
    include: {
      barbeiro: { select: { id: true, nome: true } },
      servico: { select: { id: true, nome: true } },
    },
  });
}

async function updateAgendamentoStatus(tenantId, id, status) {
  return prisma.barberAgendamento.updateMany({
    where: { id, tenantId },
    data: { status },
  });
}

async function updateAgendamento(tenantId, id, data) {
  const payload = { ...data };
  if (payload.dataHora) payload.dataHora = new Date(payload.dataHora);
  return prisma.barberAgendamento.updateMany({ where: { id, tenantId }, data: payload });
}

// ─────────────────────────────────────────────────────────────
//  6. FILA PRESENCIAL
// ─────────────────────────────────────────────────────────────

async function findFilaAtual(tenantId) {
  return prisma.barberFila.findMany({
    where: { tenantId, status: { in: ['AGUARDANDO', 'CHAMADO', 'EM_ATENDIMENTO'] } },
    orderBy: { posicao: 'asc' },
    include: {
      cliente: { select: { id: true, nome: true, telefone: true } },
      barbeiro: { select: { id: true, nome: true } },
    },
  });
}

async function findProximaPosicaoFila(tenantId) {
  const ultimo = await prisma.barberFila.findFirst({
    where: { tenantId, status: { in: ['AGUARDANDO', 'CHAMADO'] } },
    orderBy: { posicao: 'desc' },
    select: { posicao: true },
  });
  return (ultimo?.posicao ?? 0) + 1;
}

async function createFilaEntry(tenantId, data) {
  const posicao = await findProximaPosicaoFila(tenantId);
  return prisma.barberFila.create({
    data: {
      tenantId,
      clienteId: data.clienteId || null,
      barbeiroId: data.barbeiroId || null,
      nomeCliente: data.nomeCliente || null,
      telefone: data.telefone || null,
      servicoId: data.servicoId || null,
      posicao,
      status: 'AGUARDANDO',
    },
  });
}

async function updateFilaStatus(tenantId, id, status) {
  const data = { status };
  if (status === 'CHAMADO') data.chamadoEm = new Date();
  if (status === 'EM_ATENDIMENTO') data.atendidoEm = new Date();

  return prisma.barberFila.updateMany({ where: { id, tenantId }, data });
}

async function removeFilaEntry(tenantId, id) {
  return prisma.barberFila.updateMany({
    where: { id, tenantId },
    data: { status: 'DESISTIU' },
  });
}

// ─────────────────────────────────────────────────────────────
//  7. AVALIAÇÕES
// ─────────────────────────────────────────────────────────────

async function findAvaliacoes(tenantId, { barbeiroId, page = 1, perPage = 30 } = {}) {
  const where = { tenantId, ...(barbeiroId ? { barbeiroId } : {}) };
  const take = Math.min(parseInt(perPage) || 30, 100);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

  const [total, avaliacoes] = await Promise.all([
    prisma.barberAvaliacao.count({ where }),
    prisma.barberAvaliacao.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        barbeiro: { select: { id: true, nome: true } },
        cliente: { select: { id: true, nome: true } },
      },
    }),
  ]);

  return { avaliacoes, total };
}

async function findAvaliacaoPorAgendamento(agendamentoId) {
  return prisma.barberAvaliacao.findUnique({ where: { agendamentoId } });
}

async function createAvaliacao(data) {
  return prisma.barberAvaliacao.create({ data });
}

// Média de avaliação de um barbeiro
async function getMediaAvaliacaoBarbeiro(barbeiroId) {
  const result = await prisma.barberAvaliacao.aggregate({
    where: { barbeiroId },
    _avg: { notaGeral: true, notaCorte: true, notaAtendimento: true, notaPontualidade: true },
    _count: { notaGeral: true },
  });
  return {
    media: result._avg.notaGeral ?? 0,
    mediaCorte: result._avg.notaCorte ?? 0,
    mediaAtend: result._avg.notaAtendimento ?? 0,
    mediaPont: result._avg.notaPontualidade ?? 0,
    totalAvaliacoes: result._count.notaGeral ?? 0,
  };
}

// ─────────────────────────────────────────────────────────────
//  8. COMISSÕES
// ─────────────────────────────────────────────────────────────

async function createComissao(data) {
  return prisma.barberComissao.create({ data });
}

async function findComissoesBarbeiro(tenantId, barbeiroId, { repassado, de, ate } = {}) {
  return prisma.barberComissao.findMany({
    where: {
      tenantId,
      barbeiroId,
      ...(repassado !== undefined ? { repassado } : {}),
      ...(de || ate ? {
        createdAt: {
          ...(de ? { gte: new Date(de) } : {}),
          ...(ate ? { lte: new Date(ate) } : {}),
        },
      } : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      agendamento: {
        select: { dataHora: true, valorCobrado: true, servico: { select: { nome: true } } },
      },
    },
  });
}

async function marcarComissoesRepassadas(tenantId, barbeiroId, ids) {
  return prisma.barberComissao.updateMany({
    where: { tenantId, barbeiroId, id: { in: ids }, repassado: false },
    data: { repassado: true, repassadoEm: new Date() },
  });
}

// ─────────────────────────────────────────────────────────────
//  9. ESTOQUE
// ─────────────────────────────────────────────────────────────

async function findAllProdutos(tenantId, { apenasAtivos = true } = {}) {
  return prisma.barberProduto.findMany({
    where: { tenantId, ...(apenasAtivos ? { ativo: true } : {}) },
    orderBy: { nome: 'asc' },
  });
}

async function findProduto(tenantId, id) {
  return prisma.barberProduto.findFirst({
    where: { id, tenantId },
    include: { movimentacoes: { orderBy: { createdAt: 'desc' }, take: 20 } },
  });
}

async function findProdutosAbaixoDoMinimo(tenantId) {
  // Prisma não suporta comparação de colunas diretamente — filtra em memória
  const produtos = await prisma.barberProduto.findMany({
    where: { tenantId, ativo: true },
  });
  return produtos.filter(p => p.quantidadeAtual <= p.quantidadeMin);
}

async function createProduto(tenantId, data) {
  return prisma.barberProduto.create({ data: { tenantId, ...data } });
}

async function updateProduto(tenantId, id, data) {
  return prisma.barberProduto.updateMany({ where: { id, tenantId }, data });
}

async function registrarMovEstoque(produtoId, tipo, quantidade, motivo) {
  // Roda em transação: cria movimentação + atualiza quantidade
  return prisma.$transaction([
    prisma.barberMovEstoque.create({
      data: { produtoId, tipo, quantidade, motivo: motivo || null },
    }),
    prisma.barberProduto.update({
      where: { id: produtoId },
      data: {
        quantidadeAtual: tipo === 'ENTRADA'
          ? { increment: quantidade }
          : { decrement: quantidade },
      },
    }),
  ]);
}

// ─────────────────────────────────────────────────────────────
//  10. ASSINATURAS
// ─────────────────────────────────────────────────────────────

async function findAllAssinaturas(tenantId, { status } = {}) {
  return prisma.barberAssinatura.findMany({
    where: { tenantId, ...(status ? { status } : {}) },
    orderBy: { renovaEm: 'asc' },
    include: { cliente: { select: { id: true, nome: true, telefone: true } } },
  });
}

async function findAssinatura(tenantId, id) {
  return prisma.barberAssinatura.findFirst({
    where: { id, tenantId },
    include: { cliente: { select: { id: true, nome: true } } },
  });
}

async function findAssinaturaAtivaCliente(tenantId, clienteId) {
  return prisma.barberAssinatura.findFirst({
    where: { tenantId, clienteId, status: 'ATIVA' },
  });
}

async function createAssinatura(tenantId, data) {
  return prisma.barberAssinatura.create({
    data: {
      tenantId,
      clienteId: data.clienteId,
      nome: data.nome,
      creditosTotal: data.creditosTotal,
      creditosRestantes: data.creditosTotal,  // começa cheio
      valorMensal: data.valorMensal,
      servicosIncluidos: data.servicosIncluidos || [],
      renovaEm: new Date(data.renovaEm),
      observacoes: data.observacoes || null,
    },
    include: { cliente: { select: { id: true, nome: true } } },
  });
}

async function usarCreditoAssinatura(id) {
  return prisma.barberAssinatura.update({
    where: { id },
    data: { creditosRestantes: { decrement: 1 } },
  });
}

async function renovarAssinatura(id, novaRenovaEm) {
  const assinatura = await prisma.barberAssinatura.findUnique({ where: { id } });
  return prisma.barberAssinatura.update({
    where: { id },
    data: {
      creditosRestantes: assinatura.creditosTotal, // repõe créditos
      renovaEm: new Date(novaRenovaEm),
      status: 'ATIVA',
    },
  });
}

async function updateAssinaturaStatus(tenantId, id, status) {
  const data = { status };
  if (status === 'CANCELADA') data.canceladoEm = new Date();
  return prisma.barberAssinatura.updateMany({ where: { id, tenantId }, data });
}

// ─────────────────────────────────────────────────────────────
//  11. FIDELIDADE
// ─────────────────────────────────────────────────────────────

async function findRecompensas(tenantId, { apenasAtivas = true } = {}) {
  return prisma.barberRecompensa.findMany({
    where: { tenantId, ...(apenasAtivas ? { ativa: true } : {}) },
    orderBy: { pontosNecessarios: 'asc' },
  });
}

async function findRecompensa(tenantId, id) {
  return prisma.barberRecompensa.findFirst({ where: { id, tenantId } });
}

async function createRecompensa(tenantId, data) {
  return prisma.barberRecompensa.create({ data: { tenantId, ...data } });
}

async function updateRecompensa(tenantId, id, data) {
  return prisma.barberRecompensa.updateMany({ where: { id, tenantId }, data });
}

async function createResgate(clienteId, recompensaId, pontosUsados) {
  return prisma.barberResgate.create({
    data: { clienteId, recompensaId, pontosUsados },
  });
}

async function findResgatesCliente(clienteId) {
  return prisma.barberResgate.findMany({
    where: { clienteId },
    orderBy: { createdAt: 'desc' },
    include: { recompensa: { select: { id: true, nome: true, pontosNecessarios: true } } },
  });
}

// ─────────────────────────────────────────────────────────────
//  12. FINANCEIRO
// ─────────────────────────────────────────────────────────────

async function createDespesa(tenantId, data) {
  return prisma.barberDespesa.create({
    data: {
      tenantId,
      descricao: data.descricao,
      valor: data.valor,
      categoria: data.categoria || null,
      data: data.data ? new Date(data.data) : new Date(),
      observacoes: data.observacoes || null,
    },
  });
}

async function findDespesas(tenantId, { de, ate, categoria } = {}) {
  return prisma.barberDespesa.findMany({
    where: {
      tenantId,
      ...(categoria ? { categoria } : {}),
      ...(de || ate ? {
        data: {
          ...(de ? { gte: new Date(de) } : {}),
          ...(ate ? { lte: new Date(ate) } : {}),
        },
      } : {}),
    },
    orderBy: { data: 'desc' },
  });
}

async function deleteDespesa(tenantId, id) {
  return prisma.barberDespesa.deleteMany({ where: { id, tenantId } });
}

async function findFechamentos(tenantId, { de, ate } = {}) {
  return prisma.barberFechamento.findMany({
    where: {
      tenantId,
      ...(de || ate ? {
        data: {
          ...(de ? { gte: new Date(de) } : {}),
          ...(ate ? { lte: new Date(ate) } : {}),
        },
      } : {}),
    },
    orderBy: { data: 'desc' },
  });
}

async function findFechamentoPorData(tenantId, data) {
  const inicio = new Date(data + 'T00:00:00');
  const fim = new Date(data + 'T23:59:59');
  return prisma.barberFechamento.findFirst({
    where: { tenantId, data: { gte: inicio, lte: fim } },
  });
}

async function createFechamento(tenantId, dados) {
  return prisma.barberFechamento.create({
    data: { tenantId, ...dados },
  });
}

// ─────────────────────────────────────────────────────────────
//  13. DASHBOARD
// ─────────────────────────────────────────────────────────────

async function getDashboardData(tenantId) {
  const hoje = new Date();
  const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

  const [
    agendamentosHoje,
    agendamentosMes,
    faturamentoDia,
    faturamentoMes,
    totalClientes,
    clientesInativos,
    filaAtual,
    produtosAlerta,
    assinaturasAtivas,
    topBarbeiros,
  ] = await Promise.all([

    // Agendamentos do dia por status
    prisma.barberAgendamento.groupBy({
      by: ['status'],
      where: { tenantId, dataHora: { gte: inicioDia, lte: fimDia } },
      _count: true,
    }),

    // Total de agendamentos do mês
    prisma.barberAgendamento.count({
      where: { tenantId, dataHora: { gte: inicioMes, lte: fimMes }, status: 'CONCLUIDO' },
    }),

    // Faturamento do dia
    prisma.barberAgendamento.aggregate({
      where: { tenantId, dataHora: { gte: inicioDia, lte: fimDia }, status: 'CONCLUIDO' },
      _sum: { valorCobrado: true },
      _count: { id: true },
    }),

    // Faturamento do mês
    prisma.barberAgendamento.aggregate({
      where: { tenantId, dataHora: { gte: inicioMes, lte: fimMes }, status: 'CONCLUIDO' },
      _sum: { valorCobrado: true },
    }),

    // Total de clientes ativos
    prisma.barberCliente.count({ where: { tenantId, ativo: true } }),

    // Clientes inativos há mais de 30 dias
    prisma.barberCliente.count({
      where: {
        tenantId,
        ativo: true,
        ultimaVisita: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),

    // Fila atual
    prisma.barberFila.count({
      where: { tenantId, status: { in: ['AGUARDANDO', 'CHAMADO'] } },
    }),

    // Produtos abaixo do mínimo
    prisma.barberProduto.findMany({ where: { tenantId, ativo: true } })
      .then(prods => prods.filter(p => p.quantidadeAtual <= p.quantidadeMin).length),

    // Assinaturas ativas
    prisma.barberAssinatura.count({ where: { tenantId, status: 'ATIVA' } }),

    // Top 5 barbeiros por faturamento no mês
    prisma.barberAgendamento.groupBy({
      by: ['barbeiroId'],
      where: { tenantId, dataHora: { gte: inicioMes, lte: fimMes }, status: 'CONCLUIDO' },
      _sum: { valorCobrado: true },
      _count: { id: true },
      orderBy: { _sum: { valorCobrado: 'desc' } },
      take: 5,
    }),
  ]);

  return {
    agendamentosHoje,
    agendamentosMes,
    faturamentoDia: faturamentoDia._sum.valorCobrado ?? 0,
    atendimentosDia: faturamentoDia._count.id ?? 0,
    faturamentoMes: faturamentoMes._sum.valorCobrado ?? 0,
    ticketMedioDia: faturamentoDia._count.id > 0
      ? (faturamentoDia._sum.valorCobrado ?? 0) / faturamentoDia._count.id
      : 0,
    totalClientes,
    clientesInativos,
    filaAtual,
    produtosAlerta,
    assinaturasAtivas,
    topBarbeiros,
  };
}

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  // config
  findConfig, upsertConfig,
  // serviços
  findAllServicos, findServico, createServico, updateServico, toggleServico,
  // barbeiros
  findAllBarbeiros, findBarbeiro, createBarbeiro, updateBarbeiro, toggleBarbeiro,
  findBloqueios, createBloqueio, deleteBloqueio,
  // clientes
  findAllClientes, findCliente, findClienteByTelefone,
  createCliente, updateCliente, incrementarVisita,
  adicionarPontosCliente, deduzirPontosCliente,
  // agendamentos
  findAllAgendamentos, findAgendamento,
  findAgendamentosByBarbeiroNoPeriodo,
  createAgendamento, updateAgendamentoStatus, updateAgendamento,
  // fila
  findFilaAtual, findProximaPosicaoFila,
  createFilaEntry, updateFilaStatus, removeFilaEntry,
  // avaliações
  findAvaliacoes, findAvaliacaoPorAgendamento,
  createAvaliacao, getMediaAvaliacaoBarbeiro,
  // comissões
  createComissao, findComissoesBarbeiro, marcarComissoesRepassadas,
  // estoque
  findAllProdutos, findProduto, findProdutosAbaixoDoMinimo,
  createProduto, updateProduto, registrarMovEstoque,
  // assinaturas
  findAllAssinaturas, findAssinatura, findAssinaturaAtivaCliente,
  createAssinatura, usarCreditoAssinatura, renovarAssinatura, updateAssinaturaStatus,
  // fidelidade
  findRecompensas, findRecompensa, createRecompensa, updateRecompensa,
  createResgate, findResgatesCliente,
  // financeiro
  createDespesa, findDespesas, deleteDespesa,
  findFechamentos, findFechamentoPorData, createFechamento,
  // dashboard
  getDashboardData,
};