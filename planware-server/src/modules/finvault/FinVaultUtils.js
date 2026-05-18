'use strict';

const VALID_TYPES = ['income', 'expense'];
const EXPENSE_ALERT_THRESHOLD = 0.85;

function validateTransaction({ type, amount, date }) {
  const errors = [];

  if (!type || !VALID_TYPES.includes(type)) {
    errors.push('type deve ser "income" ou "expense"');
  }

  if (typeof amount !== 'number' || amount <= 0) {
    errors.push('amount deve ser um número positivo');
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    errors.push('date deve estar no formato YYYY-MM-DD');
  }

  return errors;
}

function validateListQuery({ type, from, to, limit }) {
  const errors = [];

  if (type && !VALID_TYPES.includes(type)) {
    errors.push('type deve ser "income" ou "expense"');
  }

  if (from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    errors.push('from deve estar no formato YYYY-MM-DD');
  }

  if (to && !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    errors.push('to deve estar no formato YYYY-MM-DD');
  }

  if (limit !== undefined) {
    const n = Number(limit);
    if (!Number.isInteger(n) || n < 1 || n > 500) {
      errors.push('limit deve ser um inteiro entre 1 e 500');
    }
  }

  return errors;
}

// Normaliza type para UPPERCASE (Prisma enum) ao salvar
// e de volta para lowercase ao responder (compatibilidade com frontend)
function normalizeTypeToDb(type) { return type?.toUpperCase(); }
function normalizeTypeFromDb(type) { return type?.toLowerCase(); }

// Formata transação de volta para o formato esperado pelo frontend original
function formatTransaction(tx) {
  if (!tx) return null;
  return {
    id: tx.id,
    type: normalizeTypeFromDb(tx.type),
    amount: tx.amount,
    category: tx.category,
    description: tx.description,
    date: tx.date instanceof Date
      ? tx.date.toISOString().split('T')[0]
      : tx.date,
  };
}

function brl(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);
}

function buildAlerts({ globalBalance, monthly }) {
  const alerts = [];
  const balance = globalBalance.income - globalBalance.expense;

  if (balance < 0) {
    alerts.push({
      type: 'danger',
      message: `Saldo total negativo: ${brl(balance)}. Revise suas despesas.`,
    });
  }

  if (monthly.income > 0) {
    const ratio = monthly.expense / monthly.income;
    if (ratio >= EXPENSE_ALERT_THRESHOLD && balance >= 0) {
      alerts.push({
        type: 'warning',
        message: `Despesas deste mês atingiram ${Math.round(ratio * 100)}% da sua receita.`,
      });
    }
  }

  if (monthly.transaction_count > 0 && monthly.income === 0) {
    alerts.push({
      type: 'warning',
      message: 'Nenhuma receita registrada neste mês.',
    });
  }

  return {
    alert: alerts.length > 0,
    alerts,
    message: alerts[0]?.message ?? null,
  };
}

module.exports = {
  validateTransaction,
  validateListQuery,
  normalizeTypeToDb,
  formatTransaction,
  buildAlerts,
};