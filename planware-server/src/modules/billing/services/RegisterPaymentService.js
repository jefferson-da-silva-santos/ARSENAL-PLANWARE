'use strict';
const repo = require('../BillingRepository');

const VALID_METHODS = ['PIX', 'TRANSFER', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'OTHER'];

async function execute(chargeId, { amount, method, paidAt, reference, notes }) {
  if (!chargeId) throw Object.assign(new Error('chargeId é obrigatório'), { status: 400 });
  if (!amount || isNaN(amount) || parseFloat(amount) <= 0)
    throw Object.assign(new Error('amount deve ser um valor positivo'), { status: 400 });
  if (!method || !VALID_METHODS.includes(method))
    throw Object.assign(new Error(`method inválido. Válidos: ${VALID_METHODS.join(', ')}`), { status: 400 });

  const charge = await repo.findChargeById(chargeId);
  if (!charge) throw Object.assign(new Error('Cobrança não encontrada'), { status: 404 });
  if (charge.status === 'CANCELLED')
    throw Object.assign(new Error('Não é possível registrar pagamento em cobrança cancelada'), { status: 400 });

  const paidSoFar = charge.payments.reduce((s, p) => s + p.amount, 0);
  const newTotal  = paidSoFar + parseFloat(amount);

  if (newTotal > charge.amount + 0.01) {
    throw Object.assign(
      new Error(`Pagamento ultrapassa o valor da cobrança. Em aberto: R$ ${(charge.amount - paidSoFar).toFixed(2)}`),
      { status: 400 }
    );
  }

  return repo.createPayment(chargeId, {
    amount:    parseFloat(amount),
    method,
    paidAt,
    reference: reference || null,
    notes:     notes     || null,
  });
}
module.exports = { execute };
