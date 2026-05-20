'use strict';

/**
 * BarbershopRoutes.js
 *
 * Todas as rotas montadas sob /barbershop
 * (prefixo registrado no app.js)
 *
 * Rotas estáticas sempre ANTES das dinâmicas com :param
 * para evitar conflitos de matching.
 */

const { Router } = require('express');
const c = require('./BarbershopController');

const router = Router();

// ─────────────────────────────────────────────────────────────
//  CONFIG
//  GET  /barbershop/config
//  PUT  /barbershop/config
// ─────────────────────────────────────────────────────────────
router.get('/config', c.getConfig);
router.put('/config', c.upsertConfig);

// ─────────────────────────────────────────────────────────────
//  DASHBOARD OPERACIONAL
//  GET  /barbershop/dashboard
// ─────────────────────────────────────────────────────────────
router.get('/dashboard', c.dashboardHandler);

// ─────────────────────────────────────────────────────────────
//  SERVIÇOS
//  GET    /barbershop/servicos
//  POST   /barbershop/servicos
//  GET    /barbershop/servicos/:id
//  PATCH  /barbershop/servicos/:id
//  PATCH  /barbershop/servicos/:id/toggle
// ─────────────────────────────────────────────────────────────
router.get('/servicos', c.listServicos);
router.post('/servicos', c.createServicoHandler);
router.get('/servicos/:id', c.getServico);
router.patch('/servicos/:id', c.updateServicoHandler);
router.delete('/servicos/:id', c.deleteServicoHandler);

// ─────────────────────────────────────────────────────────────
//  BARBEIROS
//  GET    /barbershop/barbeiros
//  POST   /barbershop/barbeiros
//  GET    /barbershop/barbeiros/:id
//  PATCH  /barbershop/barbeiros/:id
//  PATCH  /barbershop/barbeiros/:id/toggle
//  GET    /barbershop/barbeiros/:id/agenda
//  GET    /barbershop/barbeiros/:id/desempenho
//  GET    /barbershop/barbeiros/:id/bloqueios
//  POST   /barbershop/barbeiros/:id/bloqueios
//  DELETE /barbershop/barbeiros/:id/bloqueios/:bloqueioId
//  GET    /barbershop/barbeiros/:barbeiroId/comissoes
//  POST   /barbershop/barbeiros/:barbeiroId/comissoes/repassar
// ─────────────────────────────────────────────────────────────
router.get('/barbeiros', c.listBarbeiros);
router.post('/barbeiros', c.createBarbeiroHandler);
router.get('/barbeiros/:id', c.getBarbeiro);
router.patch('/barbeiros/:id', c.updateBarbeiroHandler);
router.delete('/barbeiros/:id', c.deleteBarbeiroHandler);
router.get('/barbeiros/:id/agenda', c.getAgendaBarbeiro);
router.get('/barbeiros/:id/desempenho', c.getDesempenho);
router.patch('/barbeiros/:id/meta', c.updateMeta);
router.get('/barbeiros/:id/bloqueios', c.listBloqueios);
router.post('/barbeiros/:id/bloqueios', c.createBloqueio);
router.delete('/barbeiros/:barbeiroId/bloqueios/:id', c.deleteBloqueio);
router.get('/barbeiros/:barbeiroId/comissoes', c.listComissoesBarbeiro);
router.post('/barbeiros/:barbeiroId/comissoes/repassar', c.marcarRepassadas);

// ─────────────────────────────────────────────────────────────
//  CLIENTES
//  GET    /barbershop/clientes
//  POST   /barbershop/clientes
//  GET    /barbershop/clientes/:id
//  PATCH  /barbershop/clientes/:id
// ─────────────────────────────────────────────────────────────
router.get('/clientes', c.listClientes);
router.post('/clientes', c.createClienteHandler);
router.get('/clientes/:id', c.getCliente);
router.patch('/clientes/:id', c.updateClienteHandler);

// ─────────────────────────────────────────────────────────────
//  AGENDAMENTOS
//  GET    /barbershop/agendamentos/disponibilidade  ← estático primeiro
//  GET    /barbershop/agendamentos
//  POST   /barbershop/agendamentos
//  GET    /barbershop/agendamentos/:id
//  PATCH  /barbershop/agendamentos/:id
//  POST   /barbershop/agendamentos/:id/cancelar
//  POST   /barbershop/agendamentos/:id/concluir
// ─────────────────────────────────────────────────────────────
router.get('/agendamentos/disponibilidade', c.getDisponibilidade);
router.get('/agendamentos', c.listAgendamentos);
router.post('/agendamentos', c.createAgendamentoHandler);
router.get('/agendamentos/:id', c.getAgendamento);
router.patch('/agendamentos/:id', c.updateAgendamentoHandler);
router.post('/agendamentos/:id/cancelar', c.cancelAgendamentoHandler);
router.post('/agendamentos/:id/concluir', c.concluirAgendamentoHandler);

// ─────────────────────────────────────────────────────────────
//  FILA PRESENCIAL
//  GET    /barbershop/fila
//  POST   /barbershop/fila
//  PATCH  /barbershop/fila/proximo    ← estático primeiro
//  DELETE /barbershop/fila/:id
// ─────────────────────────────────────────────────────────────
router.get('/fila', c.listFila);
router.post('/fila', c.entrarFilaHandler);
router.patch('/fila/proximo', c.chamarProximoHandler);
router.delete('/fila/:id', c.removerFilaHandler);

// ─────────────────────────────────────────────────────────────
//  AVALIAÇÕES
//  GET    /barbershop/avaliacoes
//  POST   /barbershop/avaliacoes
// ─────────────────────────────────────────────────────────────
router.get('/avaliacoes', c.listAvaliacoes);
router.post('/avaliacoes', c.createAvaliacaoHandler);

// ─────────────────────────────────────────────────────────────
//  ESTOQUE
//  GET    /barbershop/estoque/alertas  ← estático primeiro
//  GET    /barbershop/estoque
//  POST   /barbershop/estoque
//  PATCH  /barbershop/estoque/:id
//  POST   /barbershop/estoque/:id/movimentacao
// ─────────────────────────────────────────────────────────────
router.get('/estoque/alertas', c.getAlertas);
router.get('/estoque', c.listProdutos);
router.post('/estoque', c.createProdutoHandler);
router.get('/estoque/:id', c.getProduto);
router.patch('/estoque/:id', c.updateProdutoHandler);
router.post('/estoque/:id/movimentacao', c.registrarMovimentacaoHandler);

// ─────────────────────────────────────────────────────────────
//  ASSINATURAS
//  GET    /barbershop/assinaturas
//  POST   /barbershop/assinaturas
//  POST   /barbershop/assinaturas/:id/usar-credito
//  DELETE /barbershop/assinaturas/:id
// ─────────────────────────────────────────────────────────────
router.get('/assinaturas', c.listAssinaturas);
router.post('/assinaturas', c.createAssinaturaHandler);
router.post('/assinaturas/:id/usar-credito', c.usarCreditoHandler);
router.post('/assinaturas/:id/renovar', c.renovarAssinaturaHandler);
router.delete('/assinaturas/:id', c.cancelAssinaturaHandler);

// ─────────────────────────────────────────────────────────────
//  FIDELIDADE
//  GET    /barbershop/fidelidade/recompensas
//  POST   /barbershop/fidelidade/recompensas
//  GET    /barbershop/fidelidade/:clienteId
//  POST   /barbershop/fidelidade/resgatar
// ─────────────────────────────────────────────────────────────
router.get('/fidelidade/recompensas', c.listRecompensas);
router.post('/fidelidade/recompensas', c.createRecompensa);
router.patch('/fidelidade/recompensas/:id', c.updateRecompensa);
router.post('/fidelidade/pontos', c.adicionarPontosHandler);
router.post('/fidelidade/resgatar', c.resgateRecompensaHandler);
router.get('/fidelidade/:clienteId', c.getFidelidadeCliente);

// ─────────────────────────────────────────────────────────────
//  FINANCEIRO
//  GET    /barbershop/financeiro/dashboard
//  GET    /barbershop/financeiro/despesas
//  POST   /barbershop/financeiro/despesas
//  DELETE /barbershop/financeiro/despesas/:id
//  GET    /barbershop/financeiro/fechamento
//  POST   /barbershop/financeiro/fechamento
// ─────────────────────────────────────────────────────────────
router.get('/financeiro/dashboard', c.getDashboardFinanceiro);
router.get('/financeiro/despesas', c.listDespesas);
router.post('/financeiro/despesas', c.createDespesaHandler);
router.delete('/financeiro/despesas/:id', c.deleteDespesa);
router.get('/financeiro/fechamento', c.listFechamentos);
router.post('/financeiro/fechamento', c.createFechamentoHandler);

module.exports = router;