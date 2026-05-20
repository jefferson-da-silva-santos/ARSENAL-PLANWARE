// ════════════════════════════════════════════════════════════
//  types/index.ts — Tipos do domínio BarberShop
//  Espelha os models do Prisma e respostas da API
// ════════════════════════════════════════════════════════════

// ── Enums ─────────────────────────────────────────────────────

export type BarberNivel = "JUNIOR" | "PLENO" | "SENIOR" | "MASTER";

export type AgendStatus =
  | "AGENDADO"
  | "CONFIRMADO"
  | "EM_ATENDIMENTO"
  | "CONCLUIDO"
  | "CANCELADO"
  | "FALTOU";

export type AgendOrigem = "PRESENCIAL" | "ONLINE" | "WHATSAPP" | "TELEFONE";

export type BloqueioTipo = "FERIAS" | "FOLGA" | "PAUSA" | "OUTRO";

export type FilaStatus =
  | "AGUARDANDO"
  | "CHAMADO"
  | "EM_ATENDIMENTO"
  | "CONCLUIDO"
  | "DESISTIU";

export type MovEstoqueTipo = "ENTRADA" | "SAIDA" | "AJUSTE";

export type AssinaturaStatus = "ATIVA" | "SUSPENSA" | "CANCELADA" | "VENCIDA";

// ── Config ────────────────────────────────────────────────────

export interface BarberConfig {
  id: string;
  tenantId: string;
  nomeFantasia: string | null;
  telefone: string | null;
  endereco: string | null;
  horarioAbertura: string; // HH:mm
  horarioFechamento: string; // HH:mm
  diasFuncionamento: number[]; // 0=Dom..6=Sáb
  intervaloSlot: number; // minutos
  limiteDiario: number | null;
  modoFila: boolean;
  pontosCorte: number;
  createdAt: string;
  updatedAt: string;
}

// ── Serviço ───────────────────────────────────────────────────

export interface Servico {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  duracaoMin: number;
  comissaoPct: number;
  nivelMinimo: BarberNivel;
  ativo: boolean;
}

// ── Barbeiro ──────────────────────────────────────────────────

export interface Barbeiro {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  foto: string | null;
  nivel: BarberNivel;
  comissaoPct: number | null;
  ativo: boolean;
  metaMensal: number | null;
  metaCortes: number | null;
  totalAgendamentos?: number;
  totalAvaliacoes?: number;
  createdAt: string;
}

export interface Bloqueio {
  id: string;
  barbeiroId: string;
  tipo: BloqueioTipo;
  inicio: string;
  fim: string;
  motivo: string | null;
  createdAt: string;
}

export interface Comissao {
  id: string;
  tenantId: string;
  barbeiroId: string;
  agendamentoId: string;
  valorServico: number;
  percentual: number;
  valorComissao: number;
  repassado: boolean;
  repassadoEm: string | null;
  createdAt: string;
  agendamento?: {
    dataHora: string;
    valorCobrado: number;
    servico: { nome: string };
  };
}

export interface DesempenhoBarbeiro {
  barbeiro: Barbeiro;
  periodo: { de: string; ate: string };
  atendimentos: {
    concluidos: number;
    cancelados: number;
    faltas: number;
    taxaCancelamento: number;
  };
  financeiro: {
    totalFaturado: number;
    ticketMedio: number;
    totalComissao: number;
  };
  metas: {
    metaMensal: number | null;
    metaCortes: number | null;
    progressoFaturamento: number | null;
    progressoCortes: number | null;
  };
  avaliacao: {
    media: number;
    mediaCorte: number;
    mediaAtend: number;
    mediaPont: number;
    totalAvaliacoes: number;
  };
  servicosMaisFeitos: {
    servicoId: string;
    quantidade: number;
    totalFaturado: number;
  }[];
}

// ── Cliente ───────────────────────────────────────────────────

export interface Cliente {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  dataNascimento: string | null;
  pontosFidelidade: number;
  totalVisitas: number;
  ultimaVisita: string | null;
  observacoes: string | null;
  ativo: boolean;
  assinaturaAtiva?: Assinatura;
  createdAt: string;
}

// ── Agendamento ───────────────────────────────────────────────

export interface Agendamento {
  id: string;
  dataHora: string;
  duracaoMin: number;
  valorCobrado: number;
  status: AgendStatus;
  origem: AgendOrigem;
  observacoes: string | null;
  nomeCliente: string | null;
  telefoneCliente: string | null;
  barbeiro?: { id: string; nome: string; foto: string | null };
  cliente?: { id: string; nome: string; telefone: string | null };
  servico?: { id: string; nome: string; duracaoMin: number };
  avaliacao?: Avaliacao;
  comissao?: Comissao;
  createdAt: string;
}

export interface Slot {
  dataHora: string;
  horaFormatada: string;
}

export interface Disponibilidade {
  data: string;
  barbeiroId: string;
  barbeiro: { id: string; nome: string };
  servicoId: string;
  servico: { id: string; nome: string; duracaoMin: number };
  abertura: string;
  fechamento: string;
  disponivel: boolean;
  motivo?: string;
  totalSlots: number;
  slotsOcupados: number;
  slotsDisponiveis: number;
  slots: Slot[];
}

// ── Fila ──────────────────────────────────────────────────────

export interface FilaEntry {
  id: string;
  tenantId: string;
  clienteId: string | null;
  barbeiroId: string | null;
  nomeCliente: string | null;
  telefone: string | null;
  servicoId: string | null;
  posicao: number;
  status: FilaStatus;
  entradaEm: string;
  chamadoEm: string | null;
  atendidoEm: string | null;
  cliente?: { id: string; nome: string; telefone: string | null };
  barbeiro?: { id: string; nome: string };
}

// ── Avaliação ─────────────────────────────────────────────────

export interface Avaliacao {
  id: string;
  agendamentoId: string;
  barbeiroId: string;
  clienteId: string | null;
  notaGeral: number;
  notaCorte: number | null;
  notaAtendimento: number | null;
  notaPontualidade: number | null;
  comentario: string | null;
  createdAt: string;
  barbeiro?: { id: string; nome: string };
  cliente?: { id: string; nome: string };
}

// ── Estoque ───────────────────────────────────────────────────

export interface Produto {
  id: string;
  nome: string;
  categoria: string | null;
  fornecedor: string | null;
  unidade: string;
  precoUnitario: number;
  quantidadeAtual: number;
  quantidadeMin: number;
  validade: string | null;
  ativo: boolean;
  createdAt: string;
  movimentacoes?: MovEstoque[];
}

export interface MovEstoque {
  id: string;
  produtoId: string;
  tipo: MovEstoqueTipo;
  quantidade: number;
  motivo: string | null;
  createdAt: string;
}

export interface AlertaEstoque {
  id: string;
  nome: string;
  categoria: string | null;
  quantidadeAtual: number;
  quantidadeMin: number;
  urgencia: "CRITICO" | "BAIXO";
  validade: string | null;
  fornecedor: string | null;
}

// ── Assinatura ────────────────────────────────────────────────

export interface Assinatura {
  id: string;
  clienteId: string;
  nome: string;
  creditosTotal: number;
  creditosRestantes: number;
  valorMensal: number;
  servicosIncluidos: string[];
  status: AssinaturaStatus;
  inicioEm: string;
  renovaEm: string;
  canceladoEm: string | null;
  observacoes: string | null;
  createdAt: string;
  cliente?: { id: string; nome: string; telefone: string | null };
}

// ── Fidelidade ────────────────────────────────────────────────

export interface Recompensa {
  id: string;
  nome: string;
  descricao: string | null;
  pontosNecessarios: number;
  ativa: boolean;
  createdAt: string;
}

export interface Resgate {
  id: string;
  clienteId: string;
  recompensaId: string;
  pontosUsados: number;
  createdAt: string;
  recompensa?: { id: string; nome: string; pontosNecessarios: number };
}

// ── Financeiro ────────────────────────────────────────────────

export interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  categoria: string | null;
  data: string;
  observacoes: string | null;
  createdAt: string;
}

export interface Fechamento {
  id: string;
  data: string;
  totalFaturado: number;
  totalComissoes: number;
  totalDespesas: number;
  totalLiquido: number;
  qtdAtendimentos: number;
  observacoes: string | null;
  createdAt: string;
}

export interface DashboardFinanceiro {
  periodo: { de: string; ate: string };
  totalFaturado: number;
  totalComissoes: number;
  totalDespesas: number;
  lucroLiquido: number;
  atendimentos: number;
  ticketMedio: number;
  variacaoFaturamento: number | null;
  porBarbeiro: {
    barbeiroId: string;
    faturamento: number;
    atendimentos: number;
  }[];
  porServico: {
    servicoId: string;
    faturamento: number;
    atendimentos: number;
  }[];
  fechamentos: Fechamento[];
}

// ── Dashboard operacional ─────────────────────────────────────

export interface DashboardData {
  agendamentosHoje: { status: string; _count: number }[];
  agendamentosMes: number;
  faturamentoDia: number;
  atendimentosDia: number;
  faturamentoMes: number;
  ticketMedioDia: number;
  totalClientes: number;
  clientesInativos: number;
  filaAtual: number;
  produtosAlerta: number;
  assinaturasAtivas: number;
  topBarbeiros: {
    barbeiroId: string;
    _sum: { valorCobrado: number };
    _count: { id: number };
  }[];
}

// ── Resposta padrão da API ────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}
