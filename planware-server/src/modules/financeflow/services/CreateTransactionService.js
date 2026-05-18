'use strict';

const repo = require('../FinanceFlowRepository');
const { randomUUID, addMonths, getYearMonth } = require('../FinanceFlowUtils');

async function execute(tenantId, body) {
  const {
    year, month, description, amount, payment_method,
    payment_type, category_id, due_date, paid, installments,
  } = body;

  if (!description || !amount || !year || !month) {
    throw Object.assign(
      new Error('Campos obrigatórios: description, amount, year, month'),
      { status: 400 }
    );
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    throw Object.assign(new Error('Valor inválido'), { status: 400 });
  }

  const created = [];

  // ── Parcelado ──────────────────────────────────────────────
  if (payment_type === 'parcelado' && installments && parseInt(installments) > 1) {
    const total = parseInt(installments);
    const groupId = randomUUID();
    const installmentAmount = parsedAmount / total;

    for (let i = 0; i < total; i++) {
      const installmentDueDate = due_date ? addMonths(due_date, i) : null;
      const { year: iYear, month: iMonth } = installmentDueDate
        ? getYearMonth(installmentDueDate)
        : { year, month };

      const monthRow = await repo.findOrCreateMonth(tenantId, iYear, iMonth);

      const tx = await repo.createTransaction({
        fcMonthId: monthRow.id,
        description: `${description} (${i + 1}/${total})`,
        amount: installmentAmount,
        paymentMethod: payment_method || '',
        paymentType: 'parcelado',
        categoryId: category_id || null,
        dueDate: installmentDueDate,
        paid: i === 0 ? Boolean(paid) : false,
        isInstallment: true,
        installmentGroupId: groupId,
        installmentNumber: i + 1,
        totalInstallments: total,
      });

      created.push({ id: tx.id, installment: i + 1 });
    }

    return { created };
  }

  // ── À vista ────────────────────────────────────────────────
  const monthRow = await repo.findOrCreateMonth(tenantId, parseInt(year), parseInt(month));

  const tx = await repo.createTransaction({
    fcMonthId: monthRow.id,
    description,
    amount: parsedAmount,
    paymentMethod: payment_method || '',
    paymentType: 'avista',
    categoryId: category_id || null,
    dueDate: due_date || null,
    paid: Boolean(paid),
    isInstallment: false,
  });

  return { created: [{ id: tx.id }] };
}

module.exports = { execute };