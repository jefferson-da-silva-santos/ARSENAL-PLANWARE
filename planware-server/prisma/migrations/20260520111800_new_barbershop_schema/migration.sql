-- CreateEnum
CREATE TYPE "BarberNivel" AS ENUM ('JUNIOR', 'PLENO', 'SENIOR', 'MASTER');

-- CreateEnum
CREATE TYPE "BarberBloqueioTipo" AS ENUM ('FERIAS', 'FOLGA', 'PAUSA', 'OUTRO');

-- CreateEnum
CREATE TYPE "BarberAgendStatus" AS ENUM ('AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'FALTOU');

-- CreateEnum
CREATE TYPE "BarberAgendOrigem" AS ENUM ('PRESENCIAL', 'ONLINE', 'WHATSAPP', 'TELEFONE');

-- CreateEnum
CREATE TYPE "BarberFilaStatus" AS ENUM ('AGUARDANDO', 'CHAMADO', 'EM_ATENDIMENTO', 'CONCLUIDO', 'DESISTIU');

-- CreateEnum
CREATE TYPE "BarberMovEstoqueTipo" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "BarberAssinaturaStatus" AS ENUM ('ATIVA', 'SUSPENSA', 'CANCELADA', 'VENCIDA');

-- AlterEnum
ALTER TYPE "System" ADD VALUE 'BARBERSHOP';

-- CreateTable
CREATE TABLE "barber_config" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "horarioAbertura" TEXT NOT NULL DEFAULT '08:00',
    "horarioFechamento" TEXT NOT NULL DEFAULT '20:00',
    "diasFuncionamento" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6]::INTEGER[],
    "intervaloSlot" INTEGER NOT NULL DEFAULT 30,
    "limiteDiario" INTEGER,
    "modoFila" BOOLEAN NOT NULL DEFAULT false,
    "pontosCorte" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_servicos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "preco" DOUBLE PRECISION NOT NULL,
    "duracaoMin" INTEGER NOT NULL,
    "comissaoPct" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "nivelMinimo" "BarberNivel" NOT NULL DEFAULT 'JUNIOR',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_barbeiros" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "foto" TEXT,
    "nivel" "BarberNivel" NOT NULL DEFAULT 'JUNIOR',
    "comissaoPct" DOUBLE PRECISION,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "metaMensal" DOUBLE PRECISION,
    "metaCortes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_barbeiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_bloqueios" (
    "id" TEXT NOT NULL,
    "barbeiroId" TEXT NOT NULL,
    "tipo" "BarberBloqueioTipo" NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fim" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_bloqueios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_clientes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "dataNascimento" TEXT,
    "pontosFidelidade" INTEGER NOT NULL DEFAULT 0,
    "totalVisitas" INTEGER NOT NULL DEFAULT 0,
    "ultimaVisita" TIMESTAMP(3),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_agendamentos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "barbeiroId" TEXT NOT NULL,
    "clienteId" TEXT,
    "servicoId" TEXT NOT NULL,
    "nomeCliente" TEXT,
    "telefoneCliente" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "duracaoMin" INTEGER NOT NULL,
    "valorCobrado" DOUBLE PRECISION NOT NULL,
    "status" "BarberAgendStatus" NOT NULL DEFAULT 'AGENDADO',
    "origem" "BarberAgendOrigem" NOT NULL DEFAULT 'PRESENCIAL',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_fila" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT,
    "barbeiroId" TEXT,
    "nomeCliente" TEXT,
    "telefone" TEXT,
    "servicoId" TEXT,
    "posicao" INTEGER NOT NULL,
    "status" "BarberFilaStatus" NOT NULL DEFAULT 'AGUARDANDO',
    "entradaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chamadoEm" TIMESTAMP(3),
    "atendidoEm" TIMESTAMP(3),

    CONSTRAINT "barber_fila_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_avaliacoes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "barbeiroId" TEXT NOT NULL,
    "clienteId" TEXT,
    "notaGeral" INTEGER NOT NULL,
    "notaCorte" INTEGER,
    "notaAtendimento" INTEGER,
    "notaPontualidade" INTEGER,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_comissoes" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "barbeiroId" TEXT NOT NULL,
    "agendamentoId" TEXT NOT NULL,
    "valorServico" DOUBLE PRECISION NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL,
    "valorComissao" DOUBLE PRECISION NOT NULL,
    "repassado" BOOLEAN NOT NULL DEFAULT false,
    "repassadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_produtos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT,
    "fornecedor" TEXT,
    "unidade" TEXT NOT NULL DEFAULT 'un',
    "precoUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantidadeAtual" INTEGER NOT NULL DEFAULT 0,
    "quantidadeMin" INTEGER NOT NULL DEFAULT 5,
    "validade" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_mov_estoque" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "tipo" "BarberMovEstoqueTipo" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "motivo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_mov_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_assinaturas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "creditosTotal" INTEGER NOT NULL,
    "creditosRestantes" INTEGER NOT NULL,
    "valorMensal" DOUBLE PRECISION NOT NULL,
    "servicosIncluidos" TEXT[],
    "status" "BarberAssinaturaStatus" NOT NULL DEFAULT 'ATIVA',
    "inicioEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renovaEm" TIMESTAMP(3) NOT NULL,
    "canceladoEm" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "barber_assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_recompensas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "pontosNecessarios" INTEGER NOT NULL,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_recompensas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_resgates" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "recompensaId" TEXT NOT NULL,
    "pontosUsados" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_resgates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_despesas" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "categoria" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_despesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_fechamentos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "totalFaturado" DOUBLE PRECISION NOT NULL,
    "totalComissoes" DOUBLE PRECISION NOT NULL,
    "totalDespesas" DOUBLE PRECISION NOT NULL,
    "totalLiquido" DOUBLE PRECISION NOT NULL,
    "qtdAtendimentos" INTEGER NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barber_fechamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "barber_config_tenantId_key" ON "barber_config"("tenantId");

-- CreateIndex
CREATE INDEX "barber_servicos_tenantId_idx" ON "barber_servicos"("tenantId");

-- CreateIndex
CREATE INDEX "barber_barbeiros_tenantId_idx" ON "barber_barbeiros"("tenantId");

-- CreateIndex
CREATE INDEX "barber_bloqueios_barbeiroId_idx" ON "barber_bloqueios"("barbeiroId");

-- CreateIndex
CREATE INDEX "barber_bloqueios_inicio_fim_idx" ON "barber_bloqueios"("inicio", "fim");

-- CreateIndex
CREATE INDEX "barber_clientes_tenantId_idx" ON "barber_clientes"("tenantId");

-- CreateIndex
CREATE INDEX "barber_agendamentos_tenantId_idx" ON "barber_agendamentos"("tenantId");

-- CreateIndex
CREATE INDEX "barber_agendamentos_barbeiroId_idx" ON "barber_agendamentos"("barbeiroId");

-- CreateIndex
CREATE INDEX "barber_agendamentos_clienteId_idx" ON "barber_agendamentos"("clienteId");

-- CreateIndex
CREATE INDEX "barber_agendamentos_dataHora_idx" ON "barber_agendamentos"("dataHora");

-- CreateIndex
CREATE INDEX "barber_agendamentos_status_idx" ON "barber_agendamentos"("status");

-- CreateIndex
CREATE INDEX "barber_agendamentos_tenantId_dataHora_idx" ON "barber_agendamentos"("tenantId", "dataHora");

-- CreateIndex
CREATE INDEX "barber_agendamentos_barbeiroId_dataHora_idx" ON "barber_agendamentos"("barbeiroId", "dataHora");

-- CreateIndex
CREATE INDEX "barber_fila_tenantId_status_idx" ON "barber_fila"("tenantId", "status");

-- CreateIndex
CREATE INDEX "barber_fila_tenantId_posicao_idx" ON "barber_fila"("tenantId", "posicao");

-- CreateIndex
CREATE UNIQUE INDEX "barber_avaliacoes_agendamentoId_key" ON "barber_avaliacoes"("agendamentoId");

-- CreateIndex
CREATE INDEX "barber_avaliacoes_barbeiroId_idx" ON "barber_avaliacoes"("barbeiroId");

-- CreateIndex
CREATE INDEX "barber_avaliacoes_tenantId_idx" ON "barber_avaliacoes"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "barber_comissoes_agendamentoId_key" ON "barber_comissoes"("agendamentoId");

-- CreateIndex
CREATE INDEX "barber_comissoes_barbeiroId_idx" ON "barber_comissoes"("barbeiroId");

-- CreateIndex
CREATE INDEX "barber_comissoes_tenantId_idx" ON "barber_comissoes"("tenantId");

-- CreateIndex
CREATE INDEX "barber_comissoes_repassado_idx" ON "barber_comissoes"("repassado");

-- CreateIndex
CREATE INDEX "barber_produtos_tenantId_idx" ON "barber_produtos"("tenantId");

-- CreateIndex
CREATE INDEX "barber_mov_estoque_produtoId_idx" ON "barber_mov_estoque"("produtoId");

-- CreateIndex
CREATE INDEX "barber_assinaturas_tenantId_idx" ON "barber_assinaturas"("tenantId");

-- CreateIndex
CREATE INDEX "barber_assinaturas_clienteId_idx" ON "barber_assinaturas"("clienteId");

-- CreateIndex
CREATE INDEX "barber_assinaturas_status_idx" ON "barber_assinaturas"("status");

-- CreateIndex
CREATE INDEX "barber_assinaturas_renovaEm_idx" ON "barber_assinaturas"("renovaEm");

-- CreateIndex
CREATE INDEX "barber_recompensas_tenantId_idx" ON "barber_recompensas"("tenantId");

-- CreateIndex
CREATE INDEX "barber_resgates_clienteId_idx" ON "barber_resgates"("clienteId");

-- CreateIndex
CREATE INDEX "barber_despesas_tenantId_idx" ON "barber_despesas"("tenantId");

-- CreateIndex
CREATE INDEX "barber_despesas_data_idx" ON "barber_despesas"("data");

-- CreateIndex
CREATE INDEX "barber_fechamentos_tenantId_idx" ON "barber_fechamentos"("tenantId");

-- CreateIndex
CREATE INDEX "barber_fechamentos_data_idx" ON "barber_fechamentos"("data");

-- CreateIndex
CREATE UNIQUE INDEX "barber_fechamentos_tenantId_data_key" ON "barber_fechamentos"("tenantId", "data");

-- AddForeignKey
ALTER TABLE "barber_config" ADD CONSTRAINT "barber_config_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_servicos" ADD CONSTRAINT "barber_servicos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_barbeiros" ADD CONSTRAINT "barber_barbeiros_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_bloqueios" ADD CONSTRAINT "barber_bloqueios_barbeiroId_fkey" FOREIGN KEY ("barbeiroId") REFERENCES "barber_barbeiros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_clientes" ADD CONSTRAINT "barber_clientes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_agendamentos" ADD CONSTRAINT "barber_agendamentos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_agendamentos" ADD CONSTRAINT "barber_agendamentos_barbeiroId_fkey" FOREIGN KEY ("barbeiroId") REFERENCES "barber_barbeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_agendamentos" ADD CONSTRAINT "barber_agendamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "barber_clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_agendamentos" ADD CONSTRAINT "barber_agendamentos_servicoId_fkey" FOREIGN KEY ("servicoId") REFERENCES "barber_servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_fila" ADD CONSTRAINT "barber_fila_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_fila" ADD CONSTRAINT "barber_fila_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "barber_clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_fila" ADD CONSTRAINT "barber_fila_barbeiroId_fkey" FOREIGN KEY ("barbeiroId") REFERENCES "barber_barbeiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_avaliacoes" ADD CONSTRAINT "barber_avaliacoes_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "barber_agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_avaliacoes" ADD CONSTRAINT "barber_avaliacoes_barbeiroId_fkey" FOREIGN KEY ("barbeiroId") REFERENCES "barber_barbeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_avaliacoes" ADD CONSTRAINT "barber_avaliacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "barber_clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_comissoes" ADD CONSTRAINT "barber_comissoes_barbeiroId_fkey" FOREIGN KEY ("barbeiroId") REFERENCES "barber_barbeiros"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_comissoes" ADD CONSTRAINT "barber_comissoes_agendamentoId_fkey" FOREIGN KEY ("agendamentoId") REFERENCES "barber_agendamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_produtos" ADD CONSTRAINT "barber_produtos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_mov_estoque" ADD CONSTRAINT "barber_mov_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "barber_produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_assinaturas" ADD CONSTRAINT "barber_assinaturas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_assinaturas" ADD CONSTRAINT "barber_assinaturas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "barber_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_recompensas" ADD CONSTRAINT "barber_recompensas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_resgates" ADD CONSTRAINT "barber_resgates_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "barber_clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_resgates" ADD CONSTRAINT "barber_resgates_recompensaId_fkey" FOREIGN KEY ("recompensaId") REFERENCES "barber_recompensas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_despesas" ADD CONSTRAINT "barber_despesas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_fechamentos" ADD CONSTRAINT "barber_fechamentos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
