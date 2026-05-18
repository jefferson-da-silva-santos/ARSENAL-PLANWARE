'use strict';

const prisma = require('../../db/client');

// ── Clientes ──────────────────────────────────────────────────

async function findAllClientes(tenantId, search = '') {
  const clientes = await prisma.fiadoCliente.findMany({
    where: {
      tenantId,
      ...(search && {
        OR: [
          { nome:     { contains: search, mode: 'insensitive' } },
          { telefone: { contains: search, mode: 'insensitive' } },
        ],
      }),
    },
    include: { contas: { include: { parcelas: true } } },
    orderBy: { nome: 'asc' },
    take: search ? 30 : undefined,
  });
  return clientes.map(enrichCliente);
}

async function findClienteById(tenantId, id) {
  return prisma.fiadoCliente.findFirst({ where: { id, tenantId } });
}

async function createCliente(tenantId, { nome, telefone, email, observacao }) {
  return prisma.fiadoCliente.create({
    data: { tenantId, nome, telefone: telefone || null, email: email || null, observacao: observacao || null },
  });
}

async function updateCliente(tenantId, id, { nome, telefone, email, observacao }) {
  return prisma.fiadoCliente.updateMany({
    where: { id, tenantId },
    data: { nome, telefone: telefone || null, email: email || null, observacao: observacao || null },
  });
}

async function deleteCliente(tenantId, id) {
  return prisma.fiadoCliente.deleteMany({ where: { id, tenantId } });
}

// ── Contas ────────────────────────────────────────────────────

async function findContasByCliente(clienteId) {
  const contas = await prisma.fiadoConta.findMany({
    where:   { clienteId },
    include: { parcelas: { orderBy: { numero: 'asc' } } },
    orderBy: { criadoEm: 'desc' },
  });
  return contas.map(enrichConta);
}

async function findContaById(id) {
  return prisma.fiadoConta.findUnique({ where: { id }, include: { parcelas: true } });
}

async function createContaWithParcelas(tenantId, clienteId, data) {
  const { descricao, valorTotal, numParcelas, dataPrimeira, observacao } = data;
  const valorParcela = Math.round((valorTotal / numParcelas) * 100) / 100;
  const datas = gerarDatasVencimento(dataPrimeira, numParcelas);

  return prisma.$transaction(async (tx) => {
    const conta = await tx.fiadoConta.create({
      data: { clienteId, descricao, valorTotal, numParcelas, dataPrimeira, observacao: observacao || null },
    });
    await tx.fiadoParcela.createMany({
      data: datas.map((venc, i) => ({
        contaId: conta.id, numero: i + 1, valor: valorParcela, vencimento: venc,
      })),
    });
    return tx.fiadoConta.findUnique({ where: { id: conta.id } });
  });
}

async function deleteConta(id) {
  return prisma.fiadoConta.delete({ where: { id } });
}

// ── Parcelas ──────────────────────────────────────────────────

async function findParcelasByContaId(contaId) {
  const today = new Date().toISOString().split('T')[0];
  const parcelas = await prisma.fiadoParcela.findMany({
    where: { contaId }, orderBy: { numero: 'asc' },
  });
  return parcelas.map(p => normalizeParcela(p, today));
}

async function findParcelaById(id) {
  return prisma.fiadoParcela.findUnique({ where: { id } });
}

async function pagarParcela(id, { dataPagamento, observacao }) {
  const updated = await prisma.fiadoParcela.update({
    where: { id, pago: false },
    data: {
      pago: true,
      dataPagamento: dataPagamento || new Date().toISOString().split('T')[0],
      observacao: observacao || null,
    },
  });
  return normalizeParcela(updated);
}

async function estornarParcela(id) {
  const updated = await prisma.fiadoParcela.update({
    where: { id, pago: true },
    data: { pago: false, dataPagamento: null, observacao: null },
  });
  return normalizeParcela(updated);
}

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(tenantId) {
  // vencimento é campo String no schema — usa strings YYYY-MM-DD para comparar
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysDate = new Date();
  sevenDaysDate.setDate(sevenDaysDate.getDate() + 7);
  const sevenDays = sevenDaysDate.toISOString().split('T')[0];

  const clientes = await prisma.fiadoCliente.findMany({
    where:   { tenantId },
    include: { contas: { include: { parcelas: true } } },
  });

  let total_clientes     = clientes.length;
  let total_recebido     = 0, total_pendente = 0;
  let parcelas_atrasadas = 0, valor_atrasado = 0;
  const inadimplentes    = [];

  for (const c of clientes) {
    let clienteAtrasadas = 0, clienteValorAtrasado = 0, vencMaisAntigo = null;
    for (const ct of c.contas) {
      for (const p of ct.parcelas) {
        // p.vencimento é String YYYY-MM-DD — comparação String < String funciona ✅
        if (p.pago) {
          total_recebido += p.valor;
        } else {
          total_pendente += p.valor;
          if (p.vencimento < today) {
            parcelas_atrasadas++;
            valor_atrasado += p.valor;
            clienteAtrasadas++;
            clienteValorAtrasado += p.valor;
            if (!vencMaisAntigo || p.vencimento < vencMaisAntigo) vencMaisAntigo = p.vencimento;
          }
        }
      }
    }
    if (clienteAtrasadas > 0) {
      inadimplentes.push({
        id: c.id, nome: c.nome, telefone: c.telefone,
        qtd_parcelas_atrasadas: clienteAtrasadas,
        valor_atrasado: clienteValorAtrasado,
        vencimento_mais_antigo: vencMaisAntigo,
      });
    }
  }

  inadimplentes.sort((a, b) => b.valor_atrasado - a.valor_atrasado);

  // FIX PRINCIPAL: usa strings YYYY-MM-DD no filtro, não new Date()
  const proximasRaw = await prisma.fiadoParcela.findMany({
    where: {
      pago: false,
      vencimento: { gte: today, lte: sevenDays }, // String vs String ✅
      conta: { cliente: { tenantId } },
    },
    include: {
      conta: { include: { cliente: { select: { id: true, nome: true, telefone: true } } } },
    },
    orderBy: { vencimento: 'asc' },
    take: 20,
  });

  return {
    stats: { total_clientes, total_pendente, total_recebido, valor_atrasado, parcelas_atrasadas },
    inadimplentes: inadimplentes.slice(0, 10),
    proximasVencer: proximasRaw.map(p => ({
      id: p.id, numero: p.numero, valor: p.valor, vencimento: p.vencimento,
      cliente_id:      p.conta.cliente.id,
      cliente_nome:    p.conta.cliente.nome,
      telefone:        p.conta.cliente.telefone,
      conta_descricao: p.conta.descricao,
    })),
  };
}

// ── Helpers ───────────────────────────────────────────────────

function gerarDatasVencimento(dataPrimeira, numParcelas) {
  const datas = [];
  const [ano, mes, dia] = dataPrimeira.split('-').map(Number);
  for (let i = 0; i < numParcelas; i++) {
    let m = mes + i;
    let a = ano + Math.floor((m - 1) / 12);
    m = ((m - 1) % 12) + 1;
    const diasNoMes = new Date(a, m, 0).getDate();
    const d = Math.min(dia, diasNoMes);
    datas.push(`${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  return datas;
}

function enrichCliente(c) {
  const today = new Date().toISOString().split('T')[0];
  let total_pendente = 0, total_pago = 0, parcelas_atrasadas = 0, total_contas = 0;
  for (const ct of c.contas || []) {
    total_contas++;
    for (const p of ct.parcelas || []) {
      if (p.pago) { total_pago += p.valor; }
      else {
        total_pendente += p.valor;
        if (p.vencimento < today) parcelas_atrasadas++; // String < String ✅
      }
    }
  }
  const { contas: _, ...rest } = c;
  return { ...rest, total_contas, total_pago, total_pendente, parcelas_atrasadas };
}

function enrichConta(ct) {
  const today = new Date().toISOString().split('T')[0];
  let total_parcelas = ct.parcelas.length, parcelas_pagas = 0, parcelas_atrasadas = 0, saldo_pendente = 0;
  for (const p of ct.parcelas) {
    if (p.pago) { parcelas_pagas++; }
    else {
      saldo_pendente += p.valor;
      if (p.vencimento < today) parcelas_atrasadas++; // String < String ✅
    }
  }
  const { parcelas: _, ...rest } = ct;
  return { ...rest, total_parcelas, parcelas_pagas, parcelas_atrasadas, saldo_pendente };
}

function normalizeParcela(p, today) {
  const t = today || new Date().toISOString().split('T')[0];
  return {
    id: p.id, conta_id: p.contaId, numero: p.numero, valor: p.valor,
    vencimento: p.vencimento, pago: p.pago,
    data_pagamento: p.dataPagamento || null,
    observacao: p.observacao || null,
    status: p.pago ? 'paga' : p.vencimento < t ? 'atrasada' : 'pendente',
  };
}

module.exports = {
  findAllClientes, findClienteById, createCliente, updateCliente, deleteCliente,
  findContasByCliente, findContaById, createContaWithParcelas, deleteConta,
  findParcelasByContaId, findParcelaById, pagarParcela, estornarParcela,
  getDashboard,
};