-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPERADMIN', 'USER');

-- CreateEnum
CREATE TYPE "System" AS ENUM ('CLIENTPRO', 'STOCKPRO', 'FINVAULT', 'FINFLOW', 'FINANCEFLOW', 'KANBAN', 'CLINICA', 'ORDEMTECH', 'FIADO');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NOVO', 'EM_CONTATO', 'NEGOCIANDO', 'FECHADO', 'PERDIDO');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('NOTA', 'LIGACAO', 'EMAIL', 'REUNIAO', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('GERAL', 'CONTATO', 'AGENDAMENTO');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "FinType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateEnum
CREATE TYPE "FlowCategory" AS ENUM ('ESSENTIAL', 'PERSONAL', 'SAVINGS');

-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('BUG', 'FEATURE', 'REQUISITO', 'OUTRO');

-- CreateEnum
CREATE TYPE "FeedbackStatus" AS ENUM ('ABERTO', 'EM_ANALISE', 'RESOLVIDO', 'RECUSADO');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "ClinicaAgendStatus" AS ENUM ('AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'FINALIZADO', 'CANCELADO', 'FALTOU');

-- CreateEnum
CREATE TYPE "ClinicaAtendStatus" AS ENUM ('EM_ATENDIMENTO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "ClinicaAlertaTipo" AS ENUM ('RETORNO', 'CONSULTA', 'SISTEMA');

-- CreateEnum
CREATE TYPE "OrdemStatus" AS ENUM ('EM_ANDAMENTO', 'PRONTO', 'CANCELADO');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "system" "System" NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "endereco" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedules" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT,
    "titulo" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 60,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'PENDENTE',
    "notas" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "empresa" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "cargo" TEXT,
    "statusLead" "LeadStatus" NOT NULL DEFAULT 'NOVO',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interactions" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "tipo" "InteractionType" NOT NULL DEFAULT 'NOTA',
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "tipo" "ReminderType" NOT NULL DEFAULT 'GERAL',
    "refId" TEXT,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "sku" TEXT,
    "precoCusto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precoVenda" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantidadeEstoque" INTEGER NOT NULL DEFAULT 0,
    "estoqueMinimo" INTEGER NOT NULL DEFAULT 5,
    "unidadeMedida" TEXT NOT NULL DEFAULT 'un',
    "marca" TEXT,
    "ncm" TEXT,
    "categoria" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movements" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fin_transactions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "FinType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fin_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_months" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "income" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pctEssential" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "pctPersonal" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "pctSavings" DOUBLE PRECISION NOT NULL DEFAULT 20,

    CONSTRAINT "flow_months_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_transactions" (
    "id" TEXT NOT NULL,
    "flowMonthId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'money',
    "paymentType" TEXT NOT NULL DEFAULT 'cash',
    "category" "FlowCategory" NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "isInstallment" BOOLEAN NOT NULL DEFAULT false,
    "installmentGroupId" TEXT,
    "installmentNumber" INTEGER,
    "installmentTotal" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flow_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_incomes" (
    "id" TEXT NOT NULL,
    "flowMonthId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "received" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flow_incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fc_months" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,

    CONSTRAINT "fc_months_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fc_categories" (
    "id" TEXT NOT NULL,
    "fcMonthId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "fc_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fc_transactions" (
    "id" TEXT NOT NULL,
    "fcMonthId" TEXT NOT NULL,
    "categoryId" TEXT,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT '',
    "paymentType" TEXT NOT NULL DEFAULT 'avista',
    "dueDate" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "isInstallment" BOOLEAN NOT NULL DEFAULT false,
    "installmentGroupId" TEXT,
    "installmentNumber" INTEGER NOT NULL DEFAULT 1,
    "totalInstallments" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "fc_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fc_incomes" (
    "id" TEXT NOT NULL,
    "fcMonthId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "received" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "fc_incomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedbacks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "FeedbackType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "FeedbackStatus" NOT NULL DEFAULT 'ABERTO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_replies" (
    "id" TEXT NOT NULL,
    "feedbackId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_replies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_members" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#4A90D9',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_columns" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT NOT NULL DEFAULT '#4A90D9',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kanban_columns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kanban_tasks" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "columnId" TEXT NOT NULL,
    "memberId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinica_pacientes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "dataNascimento" TEXT,
    "sexo" TEXT,
    "endereco" TEXT,
    "convenio" TEXT,
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinica_pacientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinica_agendamentos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracaoMin" INTEGER NOT NULL DEFAULT 30,
    "tipo" TEXT NOT NULL,
    "status" "ClinicaAgendStatus" NOT NULL DEFAULT 'AGENDADO',
    "observacoes" TEXT,
    "lembreteEnviado" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinica_agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinica_atendimentos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pacienteId" TEXT NOT NULL,
    "profissionalId" TEXT NOT NULL,
    "agendamentoId" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "anamnese" TEXT,
    "diagnostico" TEXT,
    "conduta" TEXT,
    "observacoes" TEXT,
    "retornoEm" TEXT,
    "status" "ClinicaAtendStatus" NOT NULL DEFAULT 'EM_ATENDIMENTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinica_atendimentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinica_anexos" (
    "id" TEXT NOT NULL,
    "atendimentoId" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tipoMime" TEXT,
    "tamanhoBytes" INTEGER,
    "descricao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinica_anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinica_alertas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipo" "ClinicaAlertaTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT,
    "pacienteId" TEXT,
    "agendamentoId" TEXT,
    "usuarioId" TEXT,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinica_alertas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinica_logs" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "usuarioNome" TEXT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "detalhes" TEXT,
    "ip" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinica_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordem_clientes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordem_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "equipamento" TEXT NOT NULL,
    "problema" TEXT NOT NULL,
    "observacoes" TEXT DEFAULT '',
    "valor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "OrdemStatus" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiado_clientes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiado_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiado_contas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorTotal" DOUBLE PRECISION NOT NULL,
    "numParcelas" INTEGER NOT NULL DEFAULT 1,
    "dataPrimeira" TEXT NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiado_contas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiado_parcelas" (
    "id" TEXT NOT NULL,
    "contaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "vencimento" TEXT NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    "dataPagamento" TEXT,
    "observacao" TEXT,

    CONSTRAINT "fiado_parcelas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_system_key" ON "user_permissions"("userId", "system");

-- CreateIndex
CREATE INDEX "clients_tenantId_idx" ON "clients"("tenantId");

-- CreateIndex
CREATE INDEX "attendances_clientId_idx" ON "attendances"("clientId");

-- CreateIndex
CREATE INDEX "schedules_tenantId_idx" ON "schedules"("tenantId");

-- CreateIndex
CREATE INDEX "schedules_dataHora_idx" ON "schedules"("dataHora");

-- CreateIndex
CREATE INDEX "contacts_tenantId_idx" ON "contacts"("tenantId");

-- CreateIndex
CREATE INDEX "interactions_contactId_idx" ON "interactions"("contactId");

-- CreateIndex
CREATE INDEX "reminders_tenantId_idx" ON "reminders"("tenantId");

-- CreateIndex
CREATE INDEX "reminders_dataHora_idx" ON "reminders"("dataHora");

-- CreateIndex
CREATE INDEX "products_tenantId_idx" ON "products"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "products_tenantId_sku_key" ON "products"("tenantId", "sku");

-- CreateIndex
CREATE INDEX "movements_tenantId_idx" ON "movements"("tenantId");

-- CreateIndex
CREATE INDEX "movements_productId_idx" ON "movements"("productId");

-- CreateIndex
CREATE INDEX "fin_transactions_tenantId_idx" ON "fin_transactions"("tenantId");

-- CreateIndex
CREATE INDEX "fin_transactions_date_idx" ON "fin_transactions"("date");

-- CreateIndex
CREATE INDEX "flow_months_tenantId_idx" ON "flow_months"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "flow_months_tenantId_year_month_key" ON "flow_months"("tenantId", "year", "month");

-- CreateIndex
CREATE INDEX "flow_transactions_flowMonthId_idx" ON "flow_transactions"("flowMonthId");

-- CreateIndex
CREATE INDEX "flow_transactions_installmentGroupId_idx" ON "flow_transactions"("installmentGroupId");

-- CreateIndex
CREATE INDEX "flow_incomes_flowMonthId_idx" ON "flow_incomes"("flowMonthId");

-- CreateIndex
CREATE INDEX "fc_months_tenantId_idx" ON "fc_months"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "fc_months_tenantId_year_month_key" ON "fc_months"("tenantId", "year", "month");

-- CreateIndex
CREATE INDEX "fc_categories_fcMonthId_idx" ON "fc_categories"("fcMonthId");

-- CreateIndex
CREATE INDEX "fc_transactions_fcMonthId_idx" ON "fc_transactions"("fcMonthId");

-- CreateIndex
CREATE INDEX "fc_transactions_installmentGroupId_idx" ON "fc_transactions"("installmentGroupId");

-- CreateIndex
CREATE INDEX "fc_incomes_fcMonthId_idx" ON "fc_incomes"("fcMonthId");

-- CreateIndex
CREATE INDEX "feedbacks_tenantId_idx" ON "feedbacks"("tenantId");

-- CreateIndex
CREATE INDEX "feedbacks_status_idx" ON "feedbacks"("status");

-- CreateIndex
CREATE INDEX "feedback_replies_feedbackId_idx" ON "feedback_replies"("feedbackId");

-- CreateIndex
CREATE INDEX "kanban_members_tenantId_idx" ON "kanban_members"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "kanban_members_tenantId_name_key" ON "kanban_members"("tenantId", "name");

-- CreateIndex
CREATE INDEX "kanban_columns_tenantId_idx" ON "kanban_columns"("tenantId");

-- CreateIndex
CREATE INDEX "kanban_tasks_tenantId_idx" ON "kanban_tasks"("tenantId");

-- CreateIndex
CREATE INDEX "kanban_tasks_columnId_idx" ON "kanban_tasks"("columnId");

-- CreateIndex
CREATE INDEX "clinica_pacientes_tenantId_idx" ON "clinica_pacientes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "clinica_pacientes_tenantId_cpf_key" ON "clinica_pacientes"("tenantId", "cpf");

-- CreateIndex
CREATE INDEX "clinica_agendamentos_tenantId_idx" ON "clinica_agendamentos"("tenantId");

-- CreateIndex
CREATE INDEX "clinica_agendamentos_dataHora_idx" ON "clinica_agendamentos"("dataHora");

-- CreateIndex
CREATE INDEX "clinica_atendimentos_tenantId_idx" ON "clinica_atendimentos"("tenantId");

-- CreateIndex
CREATE INDEX "clinica_atendimentos_pacienteId_idx" ON "clinica_atendimentos"("pacienteId");

-- CreateIndex
CREATE INDEX "clinica_anexos_atendimentoId_idx" ON "clinica_anexos"("atendimentoId");

-- CreateIndex
CREATE INDEX "clinica_alertas_tenantId_idx" ON "clinica_alertas"("tenantId");

-- CreateIndex
CREATE INDEX "clinica_logs_tenantId_idx" ON "clinica_logs"("tenantId");

-- CreateIndex
CREATE INDEX "clinica_logs_criadoEm_idx" ON "clinica_logs"("criadoEm");

-- CreateIndex
CREATE INDEX "ordem_clientes_tenantId_idx" ON "ordem_clientes"("tenantId");

-- CreateIndex
CREATE INDEX "ordens_tenantId_idx" ON "ordens"("tenantId");

-- CreateIndex
CREATE INDEX "ordens_status_idx" ON "ordens"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_tenantId_numero_key" ON "ordens"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "fiado_clientes_tenantId_idx" ON "fiado_clientes"("tenantId");

-- CreateIndex
CREATE INDEX "fiado_contas_clienteId_idx" ON "fiado_contas"("clienteId");

-- CreateIndex
CREATE INDEX "fiado_parcelas_contaId_idx" ON "fiado_parcelas"("contaId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fin_transactions" ADD CONSTRAINT "fin_transactions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_months" ADD CONSTRAINT "flow_months_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_transactions" ADD CONSTRAINT "flow_transactions_flowMonthId_fkey" FOREIGN KEY ("flowMonthId") REFERENCES "flow_months"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_incomes" ADD CONSTRAINT "flow_incomes_flowMonthId_fkey" FOREIGN KEY ("flowMonthId") REFERENCES "flow_months"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fc_months" ADD CONSTRAINT "fc_months_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fc_categories" ADD CONSTRAINT "fc_categories_fcMonthId_fkey" FOREIGN KEY ("fcMonthId") REFERENCES "fc_months"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fc_transactions" ADD CONSTRAINT "fc_transactions_fcMonthId_fkey" FOREIGN KEY ("fcMonthId") REFERENCES "fc_months"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fc_transactions" ADD CONSTRAINT "fc_transactions_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "fc_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fc_incomes" ADD CONSTRAINT "fc_incomes_fcMonthId_fkey" FOREIGN KEY ("fcMonthId") REFERENCES "fc_months"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedbacks" ADD CONSTRAINT "feedbacks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_replies" ADD CONSTRAINT "feedback_replies_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedbacks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_replies" ADD CONSTRAINT "feedback_replies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_members" ADD CONSTRAINT "kanban_members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_columns" ADD CONSTRAINT "kanban_columns_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "kanban_columns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kanban_tasks" ADD CONSTRAINT "kanban_tasks_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "kanban_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_pacientes" ADD CONSTRAINT "clinica_pacientes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_agendamentos" ADD CONSTRAINT "clinica_agendamentos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_agendamentos" ADD CONSTRAINT "clinica_agendamentos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "clinica_pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_atendimentos" ADD CONSTRAINT "clinica_atendimentos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_atendimentos" ADD CONSTRAINT "clinica_atendimentos_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "clinica_pacientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_atendimentos" ADD CONSTRAINT "clinica_atendimentos_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "clinica_agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_anexos" ADD CONSTRAINT "clinica_anexos_atendimentoId_fkey" FOREIGN KEY ("atendimentoId") REFERENCES "clinica_atendimentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_alertas" ADD CONSTRAINT "clinica_alertas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_alertas" ADD CONSTRAINT "clinica_alertas_pacienteId_fkey" FOREIGN KEY ("pacienteId") REFERENCES "clinica_pacientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_alertas" ADD CONSTRAINT "clinica_alertas_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "clinica_agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinica_logs" ADD CONSTRAINT "clinica_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordem_clientes" ADD CONSTRAINT "ordem_clientes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens" ADD CONSTRAINT "ordens_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens" ADD CONSTRAINT "ordens_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ordem_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiado_clientes" ADD CONSTRAINT "fiado_clientes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiado_contas" ADD CONSTRAINT "fiado_contas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "fiado_clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fiado_parcelas" ADD CONSTRAINT "fiado_parcelas_contaId_fkey" FOREIGN KEY ("contaId") REFERENCES "fiado_contas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
