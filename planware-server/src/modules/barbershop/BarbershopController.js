'use strict';

/**
 * BarbershopController.js
 *
 * Responsabilidade: receber req/res, delegar ao service correto,
 * capturar erros e responder ao cliente.
 *
 * Nenhuma lógica de negócio aqui.
 */

const repo = require('./BarbershopRepository');
const utils = require('./BarbershopUtils');
const { capture } = require('../../lib/ErrorTracker');

// ── Services: agendamentos ────────────────────────────────────
const GetDisponibilidadeService = require('./services/agendamentos/GetDisponibilidadeService');
const CreateAgendamentoService = require('./services/agendamentos/CreateAgendamentoService');
const UpdateAgendamentoService = require('./services/agendamentos/UpdateAgendamentoService');
const CancelAgendamentoService = require('./services/agendamentos/CancelAgendamentoService');
const ConcluirAgendamentoService = require('./services/agendamentos/ConcluirAgendamentoService');

// ── Services: barbeiros ───────────────────────────────────────
const CreateBarbeiroService = require('./services/barbeiros/CreateBarbeiroService');
const UpdateBarbeiroService = require('./services/barbeiros/UpdateBarbeiroService');
const DeleteBarbeiroService = require('./services/barbeiros/DeleteBarbeiroService');
const GetBarbeiroDesempenhoService = require('./services/barbeiros/GetBarbeiroDesempenhoService');
const UpdateMetaBarbeiroService = require('./services/barbeiros/UpdateMetaBarbeiroService');

// ── Services: serviços ────────────────────────────────────────
const CreateServicoService = require('./services/servicos/CreateServicoService');
const UpdateServicoService = require('./services/servicos/UpdateServicoService');
const DeleteServicoService = require('./services/servicos/DeleteServicoService');

// ── Services: clientes ────────────────────────────────────────
const CreateClienteService = require('./services/clientes/CreateClienteService');
const UpdateClienteService = require('./services/clientes/UpdateClienteService');

// ── Services: fila ────────────────────────────────────────────
const EntrarFilaService = require('./services/fila/EntrarFilaService');
const ChamarProximoService = require('./services/fila/ChamarProximoService');
const RemoverFilaService = require('./services/fila/RemoverFilaService');

// ── Services: estoque ─────────────────────────────────────────
const CreateProdutoService = require('./services/estoque/CreateProdutoService');
const UpdateProdutoService = require('./services/estoque/UpdateProdutoService');
const RegisterMovimentacaoService = require('./services/estoque/RegisterMovimentacaoService');
const GetAlertasEstoqueService = require('./services/estoque/GetAlertasEstoqueService');

// ── Services: assinatura ──────────────────────────────────────
const CreateAssinaturaService = require('./services/assinatura/CreateAssinaturaService');
const RenovarAssinaturaService = require('./services/assinatura/RenovarAssinaturaService');
const UsarCreditoAssinaturaService = require('./services/assinatura/UsarCreditoAssinaturaService');
const CancelAssinaturaService = require('./services/assinatura/CancelAssinaturaService');

// ── Services: fidelidade ──────────────────────────────────────
const AdicionarPontosService = require('./services/fidelidade/AdicionarPontosService');
const ResgateRecompensaService = require('./services/fidelidade/ResgateRecompensaService');

// ── Services: financeiro ──────────────────────────────────────
const CreateDespesaService = require('./services/financeiro/CreateDespesaService');
const FechamentoCaixaService = require('./services/financeiro/FechamentoCaixaService');
const GetDashboardFinanceiroService = require('./services/financeiro/GetDashboardFinanceiroService');

// ── Services: dashboard e avaliações ─────────────────────────
const GetDashboardService = require('./services/dashboard/GetDashboardService');
const CreateAvaliacaoService = require('./services/avaliacoes/CreateAvaliacaoService');

const MODULE = 'BARBERSHOP';

// ─────────────────────────────────────────────────────────────
//  HELPER — tratamento de erro centralizado
// ─────────────────────────────────────────────────────────────

function handleError(err, req, res) {
  capture(err, req, { module: MODULE });
  return res.status(err.status || 500).json({ success: false, error: err.message });
}

// ─────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────

async function getConfig(req, res) {
  try {
    const data = await repo.findConfig(req.user.tenantId);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function upsertConfig(req, res) {
  try {
    const data = await repo.upsertConfig(req.user.tenantId, req.body);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────

async function dashboardHandler(req, res) {
  try {
    const data = await GetDashboardService.execute(req.user.tenantId);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  SERVIÇOS
// ─────────────────────────────────────────────────────────────

async function listServicos(req, res) {
  try {
    const servicos = await repo.findAllServicos(req.user.tenantId, {
      apenasAtivos: req.query.ativos !== 'false',
    });
    return res.json({ success: true, data: servicos.map(utils.formatServico) });
  } catch (err) { return handleError(err, req, res); }
}

async function getServico(req, res) {
  try {
    const servico = await repo.findServico(req.user.tenantId, req.params.id);
    if (!servico) return res.status(404).json({ success: false, error: 'Serviço não encontrado' });
    return res.json({ success: true, data: utils.formatServico(servico) });
  } catch (err) { return handleError(err, req, res); }
}

async function createServicoHandler(req, res) {
  try {
    const data = await CreateServicoService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data: utils.formatServico(data) });
  } catch (err) { return handleError(err, req, res); }
}

async function updateServicoHandler(req, res) {
  try {
    const data = await UpdateServicoService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data: utils.formatServico(data) });
  } catch (err) { return handleError(err, req, res); }
}

async function deleteServicoHandler(req, res) {
  try {
    const data = await DeleteServicoService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  BARBEIROS
// ─────────────────────────────────────────────────────────────

async function listBarbeiros(req, res) {
  try {
    const barbeiros = await repo.findAllBarbeiros(req.user.tenantId, {
      apenasAtivos: req.query.ativos !== 'false',
    });
    return res.json({ success: true, data: barbeiros.map(utils.formatBarbeiro) });
  } catch (err) { return handleError(err, req, res); }
}

async function getBarbeiro(req, res) {
  try {
    const barbeiro = await repo.findBarbeiro(req.user.tenantId, req.params.id);
    if (!barbeiro) return res.status(404).json({ success: false, error: 'Barbeiro não encontrado' });
    return res.json({ success: true, data: utils.formatBarbeiro(barbeiro) });
  } catch (err) { return handleError(err, req, res); }
}

async function createBarbeiroHandler(req, res) {
  try {
    const data = await CreateBarbeiroService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function updateBarbeiroHandler(req, res) {
  try {
    const data = await UpdateBarbeiroService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function deleteBarbeiroHandler(req, res) {
  try {
    const data = await DeleteBarbeiroService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function getDesempenho(req, res) {
  try {
    const data = await GetBarbeiroDesempenhoService.execute(
      req.user.tenantId,
      req.params.id,
      { de: req.query.de, ate: req.query.ate },
    );
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function updateMeta(req, res) {
  try {
    const data = await UpdateMetaBarbeiroService.execute(
      req.user.tenantId,
      req.params.id,
      req.body,
    );
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function getAgendaBarbeiro(req, res) {
  try {
    const result = await repo.findAllAgendamentos(req.user.tenantId, {
      barbeiroId: req.params.id,
      data: req.query.data,
    });
    return res.json({ success: true, data: result.agendamentos.map(utils.formatAgendamento) });
  } catch (err) { return handleError(err, req, res); }
}

// ── Bloqueios ─────────────────────────────────────────────────

async function listBloqueios(req, res) {
  try {
    const data = await repo.findBloqueios(req.params.id, {
      de: req.query.de,
      ate: req.query.ate,
    });
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function createBloqueio(req, res) {
  try {
    if (!req.body.tipo || !req.body.inicio || !req.body.fim) {
      return res.status(400).json({ success: false, error: 'tipo, inicio e fim são obrigatórios' });
    }
    utils.validateTipoBloqueio(req.body.tipo);

    const inicio = new Date(req.body.inicio);
    const fim = new Date(req.body.fim);
    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      return res.status(400).json({ success: false, error: 'inicio ou fim com formato inválido' });
    }
    if (fim <= inicio) {
      return res.status(400).json({ success: false, error: 'fim deve ser posterior ao inicio' });
    }

    const barbeiro = await repo.findBarbeiro(req.user.tenantId, req.params.id);
    if (!barbeiro) return res.status(404).json({ success: false, error: 'Barbeiro não encontrado' });

    const data = await repo.createBloqueio(req.params.id, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function deleteBloqueio(req, res) {
  try {
    await repo.deleteBloqueio(req.params.barbeiroId, req.params.id);
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  CLIENTES
// ─────────────────────────────────────────────────────────────

async function listClientes(req, res) {
  try {
    const clientes = await repo.findAllClientes(req.user.tenantId, req.query.q);
    return res.json({ success: true, data: clientes.map(utils.formatCliente) });
  } catch (err) { return handleError(err, req, res); }
}

async function getCliente(req, res) {
  try {
    const cliente = await repo.findCliente(req.user.tenantId, req.params.id);
    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    return res.json({ success: true, data: utils.formatCliente(cliente) });
  } catch (err) { return handleError(err, req, res); }
}

async function createClienteHandler(req, res) {
  try {
    const data = await CreateClienteService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function updateClienteHandler(req, res) {
  try {
    const data = await UpdateClienteService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  AGENDAMENTOS
// ─────────────────────────────────────────────────────────────

async function getDisponibilidade(req, res) {
  try {
    const data = await GetDisponibilidadeService.execute(req.user.tenantId, {
      barbeiroId: req.query.barbeiroId,
      servicoId: req.query.servicoId,
      data: req.query.data,
    });
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function listAgendamentos(req, res) {
  try {
    const result = await repo.findAllAgendamentos(req.user.tenantId, req.query);
    return res.json({
      success: true,
      data: { ...result, agendamentos: result.agendamentos.map(utils.formatAgendamento) },
    });
  } catch (err) { return handleError(err, req, res); }
}

async function getAgendamento(req, res) {
  try {
    const agendamento = await repo.findAgendamento(req.user.tenantId, req.params.id);
    if (!agendamento) return res.status(404).json({ success: false, error: 'Agendamento não encontrado' });
    return res.json({ success: true, data: utils.formatAgendamento(agendamento) });
  } catch (err) { return handleError(err, req, res); }
}

async function createAgendamentoHandler(req, res) {
  try {
    const data = await CreateAgendamentoService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function updateAgendamentoHandler(req, res) {
  try {
    const data = await UpdateAgendamentoService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function cancelAgendamentoHandler(req, res) {
  try {
    const data = await CancelAgendamentoService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function concluirAgendamentoHandler(req, res) {
  try {
    const data = await ConcluirAgendamentoService.execute(
      req.user.tenantId,
      req.params.id,
      { valorFinal: req.body.valorFinal },
    );
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  FILA
// ─────────────────────────────────────────────────────────────

async function listFila(req, res) {
  try {
    const data = await repo.findFilaAtual(req.user.tenantId);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function entrarFilaHandler(req, res) {
  try {
    const data = await EntrarFilaService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function chamarProximoHandler(req, res) {
  try {
    const data = await ChamarProximoService.execute(req.user.tenantId);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function removerFilaHandler(req, res) {
  try {
    const data = await RemoverFilaService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  AVALIAÇÕES
// ─────────────────────────────────────────────────────────────

async function listAvaliacoes(req, res) {
  try {
    const result = await repo.findAvaliacoes(req.user.tenantId, {
      barbeiroId: req.query.barbeiroId,
      page: req.query.page,
      perPage: req.query.perPage,
    });
    return res.json({ success: true, data: result });
  } catch (err) { return handleError(err, req, res); }
}

async function createAvaliacaoHandler(req, res) {
  try {
    const data = await CreateAvaliacaoService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  ESTOQUE
// ─────────────────────────────────────────────────────────────

async function listProdutos(req, res) {
  try {
    const data = await repo.findAllProdutos(req.user.tenantId, {
      apenasAtivos: req.query.ativos !== 'false',
    });
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function getProduto(req, res) {
  try {
    const data = await repo.findProduto(req.user.tenantId, req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function getAlertas(req, res) {
  try {
    const data = await GetAlertasEstoqueService.execute(req.user.tenantId);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function createProdutoHandler(req, res) {
  try {
    const data = await CreateProdutoService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function updateProdutoHandler(req, res) {
  try {
    const data = await UpdateProdutoService.execute(req.user.tenantId, req.params.id, req.body);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function registrarMovimentacaoHandler(req, res) {
  try {
    const data = await RegisterMovimentacaoService.execute(req.user.tenantId, req.params.id, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  ASSINATURAS
// ─────────────────────────────────────────────────────────────

async function listAssinaturas(req, res) {
  try {
    const data = await repo.findAllAssinaturas(req.user.tenantId, {
      status: req.query.status,
    });
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function createAssinaturaHandler(req, res) {
  try {
    const data = await CreateAssinaturaService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function renovarAssinaturaHandler(req, res) {
  try {
    const data = await RenovarAssinaturaService.execute(
      req.user.tenantId,
      req.params.id,
      { novaRenovaEm: req.body.novaRenovaEm },
    );
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function usarCreditoHandler(req, res) {
  try {
    const data = await UsarCreditoAssinaturaService.execute(
      req.user.tenantId,
      req.params.id,
      { servicoId: req.body.servicoId },
    );
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function cancelAssinaturaHandler(req, res) {
  try {
    const data = await CancelAssinaturaService.execute(req.user.tenantId, req.params.id);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  FIDELIDADE
// ─────────────────────────────────────────────────────────────

async function listRecompensas(req, res) {
  try {
    const data = await repo.findRecompensas(req.user.tenantId, {
      apenasAtivas: req.query.todas !== 'true',
    });
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function createRecompensa(req, res) {
  try {
    if (!req.body.nome?.trim() || !req.body.pontosNecessarios) {
      return res.status(400).json({ success: false, error: 'nome e pontosNecessarios são obrigatórios' });
    }
    const data = await repo.createRecompensa(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function updateRecompensa(req, res) {
  try {
    await repo.updateRecompensa(req.user.tenantId, req.params.id, req.body);
    const data = await repo.findRecompensa(req.user.tenantId, req.params.id);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function getFidelidadeCliente(req, res) {
  try {
    const [cliente, resgates] = await Promise.all([
      repo.findCliente(req.user.tenantId, req.params.clienteId),
      repo.findResgatesCliente(req.params.clienteId),
    ]);
    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    return res.json({
      success: true,
      data: {
        cliente: { id: cliente.id, nome: cliente.nome, pontos: cliente.pontosFidelidade },
        resgates,
      },
    });
  } catch (err) { return handleError(err, req, res); }
}

async function adicionarPontosHandler(req, res) {
  try {
    const data = await AdicionarPontosService.execute(
      req.user.tenantId,
      req.body.clienteId,
      { pontos: req.body.pontos, motivo: req.body.motivo },
    );
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function resgateRecompensaHandler(req, res) {
  try {
    const data = await ResgateRecompensaService.execute(
      req.user.tenantId,
      req.body.clienteId,
      req.body.recompensaId,
    );
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  FINANCEIRO
// ─────────────────────────────────────────────────────────────

async function getDashboardFinanceiro(req, res) {
  try {
    const data = await GetDashboardFinanceiroService.execute(req.user.tenantId, req.query);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function createDespesaHandler(req, res) {
  try {
    const data = await CreateDespesaService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function listDespesas(req, res) {
  try {
    const data = await repo.findDespesas(req.user.tenantId, req.query);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function deleteDespesa(req, res) {
  try {
    await repo.deleteDespesa(req.user.tenantId, req.params.id);
    return res.json({ success: true, data: { id: req.params.id } });
  } catch (err) { return handleError(err, req, res); }
}

async function listFechamentos(req, res) {
  try {
    const data = await repo.findFechamentos(req.user.tenantId, req.query);
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function createFechamentoHandler(req, res) {
  try {
    const data = await FechamentoCaixaService.execute(req.user.tenantId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function listComissoesBarbeiro(req, res) {
  try {
    const repassado = req.query.repassado === 'true' ? true
      : req.query.repassado === 'false' ? false
        : undefined;
    const data = await repo.findComissoesBarbeiro(
      req.user.tenantId,
      req.params.barbeiroId,
      { repassado, de: req.query.de, ate: req.query.ate },
    );
    return res.json({ success: true, data });
  } catch (err) { return handleError(err, req, res); }
}

async function marcarRepassadas(req, res) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids deve ser um array não vazio' });
    }
    const result = await repo.marcarComissoesRepassadas(
      req.user.tenantId,
      req.params.barbeiroId,
      ids,
    );
    return res.json({ success: true, data: { repassadas: result.count } });
  } catch (err) { return handleError(err, req, res); }
}

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  getConfig, upsertConfig,
  dashboardHandler,
  listServicos, getServico, createServicoHandler, updateServicoHandler, deleteServicoHandler,
  listBarbeiros, getBarbeiro, createBarbeiroHandler, updateBarbeiroHandler,
  deleteBarbeiroHandler, getDesempenho, updateMeta, getAgendaBarbeiro,
  listBloqueios, createBloqueio, deleteBloqueio,
  listClientes, getCliente, createClienteHandler, updateClienteHandler,
  getDisponibilidade, listAgendamentos, getAgendamento,
  createAgendamentoHandler, updateAgendamentoHandler,
  cancelAgendamentoHandler, concluirAgendamentoHandler,
  listFila, entrarFilaHandler, chamarProximoHandler, removerFilaHandler,
  listAvaliacoes, createAvaliacaoHandler,
  listProdutos, getProduto, getAlertas,
  createProdutoHandler, updateProdutoHandler, registrarMovimentacaoHandler,
  listAssinaturas, createAssinaturaHandler, renovarAssinaturaHandler,
  usarCreditoHandler, cancelAssinaturaHandler,
  listRecompensas, createRecompensa, updateRecompensa,
  getFidelidadeCliente, adicionarPontosHandler, resgateRecompensaHandler,
  getDashboardFinanceiro, createDespesaHandler, listDespesas, deleteDespesa,
  listFechamentos, createFechamentoHandler,
  listComissoesBarbeiro, marcarRepassadas,
};