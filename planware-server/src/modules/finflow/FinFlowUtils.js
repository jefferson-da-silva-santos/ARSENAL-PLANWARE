'use strict';

const VALID_CATEGORIES = ['ESSENTIAL', 'PERSONAL', 'SAVINGS'];

function validatePercents(essential, personal, savings) {
  const total = (parseFloat(essential) || 0)
    + (parseFloat(personal) || 0)
    + (parseFloat(savings) || 0);
  return Math.abs(total - 100) < 0.01;
}

function validateCategory(category) {
  return VALID_CATEGORIES.includes(category?.toUpperCase());
}

// Adiciona N meses a uma data ISO (YYYY-MM-DD)
function addMonths(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toISOString().slice(0, 10);
}

function getYearMonth(dateStr) {
  const [year, month] = dateStr.split('-').map(Number);
  return { year, month };
}

function generateGroupId() {
  return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Computa o resumo 50/30/20 do mês
function computeSummary(monthRow, transactions, incomes) {
  const totalIncomeReceived = incomes
    .filter((i) => i.received)
    .reduce((s, i) => s + i.amount, 0);

  const baseIncome = monthRow.income + totalIncomeReceived;

  const planned = {
    essential: (baseIncome * monthRow.pctEssential) / 100,
    personal: (baseIncome * monthRow.pctPersonal) / 100,
    savings: (baseIncome * monthRow.pctSavings) / 100,
  };

  const realized = { essential: 0, personal: 0, savings: 0 };
  const pending = { essential: 0, personal: 0, savings: 0 };

  for (const tx of transactions) {
    const key = tx.category.toLowerCase();
    if (tx.paid) realized[key] = (realized[key] || 0) + tx.amount;
    else pending[key] = (pending[key] || 0) + tx.amount;
  }

  const totalRealized = realized.essential + realized.personal + realized.savings;

  return { planned, realized, pending, totalRealized, baseIncome, totalIncomeReceived };
}

// Converte category para o enum do Prisma (uppercase)
function normalizeCategoryToDb(cat) {
  return cat?.toUpperCase();
}

// Formata transação para resposta (snake_case para o frontend)
function formatTransaction(tx) {
  if (!tx) return null;
  return {
    id: tx.id,
    month_id: tx.flowMonthId,
    description: tx.description,
    amount: tx.amount,
    payment_method: tx.paymentMethod,
    payment_type: tx.paymentType,
    category: tx.category?.toLowerCase(),
    due_date: tx.dueDate ? tx.dueDate.toISOString().split('T')[0] : null,
    paid: tx.paid,
    is_installment: tx.isInstallment,
    installment_group_id: tx.installmentGroupId,
    installment_number: tx.installmentNumber,
    installment_total: tx.installmentTotal,
    created_at: tx.createdAt,
  };
}

function formatIncome(income) {
  if (!income) return null;
  return {
    id: income.id,
    month_id: income.flowMonthId,
    description: income.description,
    amount: income.amount,
    received: income.received,
    created_at: income.createdAt,
  };
}

function formatMonth(row) {
  if (!row) return null;
  return {
    id: row.id,
    year: row.year,
    month: row.month,
    income: row.income,
    pct_essential: row.pctEssential,
    pct_personal: row.pctPersonal,
    pct_savings: row.pctSavings,
  };
}

module.exports = {
  VALID_CATEGORIES,
  validatePercents,
  validateCategory,
  addMonths,
  getYearMonth,
  generateGroupId,
  computeSummary,
  normalizeCategoryToDb,
  formatTransaction,
  formatIncome,
  formatMonth,
};