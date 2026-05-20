'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const chalk = require('chalk');

const auth = require('./middleware/auth');
const { requireSystem } = require('./middleware/requireRole');
const ErrorTracker = require('./lib/ErrorTracker'); 

// ── Rotas dos módulos ────────────────────────────────────────
const authRoutes = require('./modules/auth/AuthRoutes');
const adminRoutes = require('./modules/admin/AdminRoutes');
const clientProRoutes = require('./modules/clientpro/ClientProRoutes');
const stockProRoutes = require('./modules/stockpro/StockProRoutes');
const finVaultRoutes = require('./modules/finvault/FinVaultRoutes');
const finFlowRoutes = require('./modules/finflow/FinFlowRoutes');
const financeFlowRoutes = require('./modules/financeflow/FinanceFlowRoutes');
const feedbackRoutes = require('./modules/feedback/FeedbackRoutes');
const kanbanRoutes = require('./modules/kanban/KanbanRoutes');
const clinicaRoutes = require('./modules/clinica/ClinicaRoutes');
const ordemtechRoutes = require('./modules/ordemtech/OrdemTechRoutes');
const fiadoRoutes = require('./modules/fiado/FiadoRoutes');
const billingRoutes = require('./modules/billing/BillingRoutes');
const barbershopRoutes = require('./modules/barbershop/BarbershopRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globais ──────────────────────────────────────
app.use(cors());
app.use(express.json());

// Logger de requisições
app.use((req, _res, next) => {
  const ts = new Date().toLocaleTimeString('pt-BR');
  console.log(
    chalk.gray(`[${ts}]`) + ' ' +
    chalk.cyan(req.method.padEnd(7)) +
    chalk.white(req.path)
  );
  next();
});

// ── Rotas públicas (sem auth) ────────────────────────────────
app.use('/auth', authRoutes);

// ── Rotas protegidas (todas exigem JWT válido) ───────────────
app.use('/admin', auth, adminRoutes);
app.use('/clientpro', auth, requireSystem('CLIENTPRO'), clientProRoutes);
app.use('/stockpro', auth, requireSystem('STOCKPRO'), stockProRoutes);
app.use('/finvault', auth, requireSystem('FINVAULT'), finVaultRoutes);
app.use('/finflow', auth, requireSystem('FINFLOW'), finFlowRoutes);
app.use('/financeflow', auth, requireSystem('FINANCEFLOW'), financeFlowRoutes);
app.use('/feedback', auth, feedbackRoutes);
app.use('/kanban', auth, requireSystem('KANBAN'), kanbanRoutes);
app.use('/clinica', auth, requireSystem('CLINICA'), clinicaRoutes);
app.use('/ordemtech', auth, requireSystem('ORDEMTECH'), ordemtechRoutes);
app.use('/fiado', auth, requireSystem('FIADO'), fiadoRoutes);
app.use('/billing', auth, billingRoutes);
app.use('/barbershop', auth, requireSystem('BARBERSHOP'), barbershopRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', ts: Date.now() } });
});

// ── Middleware global de erros ───────────────────────────────
// DEVE ser o último middleware registrado — depois de todas as rotas.
// Captura erros chegados via next(err) ou throw em async handlers,
// registra no banco via errorTracker e responde ao cliente.
app.use(ErrorTracker.globalMiddleware);

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, () => {
  const now = new Date().toLocaleString('pt-BR');

  console.log(chalk.bold.hex('#6366f1')(`
██████╗ ██╗      █████╗ ███╗   ██╗██╗    ██╗ █████╗ ██████╗ ███████╗
██╔══██╗██║     ██╔══██╗████╗  ██║██║    ██║██╔══██╗██╔══██╗██╔════╝
██████╔╝██║     ███████║██╔██╗ ██║██║ █╗ ██║███████║██████╔╝█████╗
██╔═══╝ ██║     ██╔══██║██║╚██╗██║██║███╗██║██╔══██║██╔══██╗██╔══╝
██║     ███████╗██║  ██║██║ ╚████║╚███╔███╔╝██║  ██║██║  ██║███████╗
╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
  `));

  console.log(chalk.bold('  ◈  PlanwareServer — Backend Unificado\n'));
  console.log('  ' + chalk.green('●') + chalk.white.bold(' ONLINE') + chalk.gray(`  •  http://localhost:${PORT}  •  ${now}\n`));

  console.log(chalk.gray('  ──────────────────────────────────────────'));

  const route = (prefix, label) =>
    console.log('  ' + chalk.hex('#6366f1')(prefix.padEnd(18)) + chalk.gray(label));

  route('/auth', 'login · register · refresh');
  route('/admin', 'superadmin — tenants · users · permissions');
  route('/clientpro', 'CRM · clientes · agendamentos · contatos');
  route('/stockpro', 'produtos · estoque · movimentações');
  route('/finvault', 'financeiro padrão · alertas · relatório PDF');
  route('/finflow', 'financeiro 50/30/20 · parcelas · resumo anual');
  route('/financeflow', 'financeiro personalizável · categorias · parcelas');
  route('/feedback', 'tickets · bugs · features · requisitos');
  route('/kanban', 'membros · colunas · tarefas · stats');
  route('/clinica', 'pacientes · agendamentos · atendimentos · alertas');
  route('/ordemtech', 'clientes · ordens de serviço · dashboard');
  route('/fiado', 'clientes · contas · parcelas · inadimplência');
  route('/billing', 'clientes · contas · parcelas · inadimplência');
  route('/barbershop', 'barbeiros · serviços · agendamentos · clientes');

  console.log(chalk.gray('  ──────────────────────────────────────────\n'));
});

module.exports = app;