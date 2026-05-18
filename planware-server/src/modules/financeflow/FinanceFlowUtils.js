'use strict';

const { randomUUID } = require('crypto');

function addMonths(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  let newMonth = m + n;
  let newYear = y;
  while (newMonth > 12) { newMonth -= 12; newYear++; }
  const maxDay = new Date(newYear, newMonth, 0).getDate();
  const day = Math.min(d, maxDay);
  return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getYearMonth(dateStr) {
  const [year, month] = dateStr.split('-').map(Number);
  return { year, month };
}

// Computa resumo do dashboard a partir dos dados do mês
function computeSummary(categories, transactions, incomes) {
  const today = new Date().toISOString().split('T')[0];

  const paidTransactions = transactions.filter((t) => t.paid);
  const receivedIncomes = incomes.filter((i) => i.received);

  const totalIncome = receivedIncomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = paidTransactions.reduce((s, t) => s + t.amount, 0);

  const spentByCategory = {};
  for (const cat of categories) spentByCategory[cat.id] = 0;
  for (const tx of paidTransactions) {
    if (tx.categoryId && spentByCategory[tx.categoryId] !== undefined) {
      spentByCategory[tx.categoryId] += tx.amount;
    }
  }

  const categoryBreakdown = categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    percentage: cat.percentage,
    planned_amount: totalIncome * (cat.percentage / 100),
    spent_amount: spentByCategory[cat.id] || 0,
  }));

  const upcoming = transactions.filter(
    (t) => !t.paid && t.dueDate && t.dueDate >= today
  );
  const overdue = transactions.filter(
    (t) => !t.paid && t.dueDate && t.dueDate < today
  );

  return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses, categoryBreakdown, upcoming, overdue };
}

function formatTransaction(tx) {
  if (!tx) return null;
  return {
    id: tx.id,
    month_id: tx.fcMonthId,
    category_id: tx.categoryId,
    category_name: tx.category?.name ?? null,
    description: tx.description,
    amount: tx.amount,
    payment_method: tx.paymentMethod,
    payment_type: tx.paymentType,
    due_date: tx.dueDate,
    paid: tx.paid,
    is_installment: tx.isInstallment,
    installment_group_id: tx.installmentGroupId,
    installment_number: tx.installmentNumber,
    total_installments: tx.totalInstallments,
  };
}

function formatIncome(income) {
  if (!income) return null;
  return {
    id: income.id,
    month_id: income.fcMonthId,
    description: income.description,
    amount: income.amount,
    received: income.received,
  };
}

module.exports = {
  randomUUID,
  addMonths,
  getYearMonth,
  computeSummary,
  formatTransaction,
  formatIncome,
};