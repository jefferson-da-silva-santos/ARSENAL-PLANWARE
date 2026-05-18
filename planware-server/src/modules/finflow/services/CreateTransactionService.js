'use strict';

const repo = require('../FinFlowRepository');
const {
  validateCategory,
  normalizeCategoryToDb,
  addMonths,
  getYearMonth,
  generateGroupId,
} = require('../FinFlowUtils');

async function execute(tenantId, body) {
  const {
    year, month, description, amount, payment_method,
    payment_type, category, due_date, paid,
    is_installment, installment_count, first_payment_date,
  } = body;

  if (!description?.trim()) throw Object.assign(new Error('Descrição obrigatória'), { status: 400 });
  if (!amount || amount <= 0) throw Object.assign(new Error('Valor deve ser positivo'), { status: 400 });
  if (!validateCategory(category)) throw Object.assign(new Error('Categoria inválida. Use: essential, personal, savings'), { status: 400 });
  if (!year || !month) throw Object.assign(new Error('Ano e mês obrigatórios'), { status: 400 });

  const dbCategory = normalizeCategoryToDb(category);

  // ── Parcelado ──────────────────────────────────────────────
  if (is_installment && installment_count > 1 && first_payment_date) {
    if (installment_count > 48) throw Object.assign(new Error('Máximo de 48 parcelas'), { status: 400 });

    const groupId = generateGroupId();
    const installAmt = parseFloat((amount / installment_count).toFixed(2));
    const dataArray = [];

    for (let i = 0; i < installment_count; i++) {
      const dueStr = addMonths(first_payment_date, i);
      const { year: y, month: m } = getYearMonth(dueStr);
      const monthRow = await repo.findOrCreateMonth(tenantId, y, m);

      dataArray.push({
        flowMonthId: monthRow.id,
        description: `${description.trim()} (${i + 1}/${installment_count})`,
        amount: installAmt,
        paymentMethod: payment_method || 'credit',
        paymentType: 'installment',
        category: dbCategory,
        dueDate: new Date(dueStr),
        paid: false,
        isInstallment: true,
        installmentGroupId: groupId,
        installmentNumber: i + 1,
        installmentTotal: installment_count,
      });
    }

    await repo.createManyTransactions(dataArray);
    return { message: `${installment_count} parcelas criadas`, group_id: groupId };
  }

  // ── À vista ────────────────────────────────────────────────
  const monthRow = await repo.findOrCreateMonth(tenantId, year, month);

  const tx = await repo.createTransaction({
    flowMonthId: monthRow.id,
    description: description.trim(),
    amount: parseFloat(amount),
    paymentMethod: payment_method || 'money',
    paymentType: 'cash',
    category: dbCategory,
    dueDate: due_date ? new Date(due_date) : null,
    paid: paid ? true : false,
    isInstallment: false,
  });

  return tx;
}

module.exports = { execute };