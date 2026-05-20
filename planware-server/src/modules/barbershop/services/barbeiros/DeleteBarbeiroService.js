'use strict';

const prisma = require('../../../../db/client');
const repo = require('../../BarbershopRepository');
const utils = require('../../BarbershopUtils');

/**
 * Desativa um barbeiro.
 * Bloqueia se houver agendamentos futuros confirmados — devem ser
 * reagendados ou cancelados antes de desativar.
 */
async function execute(tenantId, id) {
  const barbeiro = await repo.findBarbeiro(tenantId, id);
  if (!barbeiro) throw utils.notFound('Barbeiro não encontrado');
  if (!barbeiro.ativo) throw utils.badRequest('Barbeiro já está inativo');

  // Verifica agendamentos futuros ativos
  const agendamentosFuturos = await prisma.barberAgendamento.count({
    where: {
      barbeiroId: id,
      dataHora: { gt: new Date() },
      status: { in: ['AGENDADO', 'CONFIRMADO'] },
    },
  });

  if (agendamentosFuturos > 0) {
    throw utils.badRequest(
      `Barbeiro possui ${agendamentosFuturos} agendamento(s) futuro(s). ` +
      'Cancele ou reagende-os antes de desativar.'
    );
  }

  await repo.toggleBarbeiro(tenantId, id, false);
  return { id, ativo: false };
}

module.exports = { execute };