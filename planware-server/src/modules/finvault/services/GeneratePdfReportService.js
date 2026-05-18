'use strict';

const PDFDocument = require('pdfkit');
const repo = require('../FinVaultRepository');

const brl = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);

async function execute(tenantId, res) {
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

  const [transactions, summary] = await Promise.all([
    repo.findAllTransactions(tenantId, { limit: 500 }),
    repo.getSummaryByMonth(tenantId, currentMonth),
  ]);

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Envia direto para o response — sem gravar em disco
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="finvault-report.pdf"');
  doc.pipe(res);

  // ── Header ──────────────────────────────────────────────
  doc.rect(0, 0, doc.page.width, 90).fill('#080c14');
  doc.fillColor('#d4a853').font('Helvetica-Bold').fontSize(22).text('◈  FINVAULT', 50, 30);
  doc.fillColor('#64748b').font('Helvetica').fontSize(10).text(
    `Relatório gerado em ${new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })}`,
    50, 60
  );

  // ── Stats ────────────────────────────────────────────────
  const mx = 50;
  let y = 110;
  const colW = (doc.page.width - mx * 2) / 3;

  doc.fillColor('#111827').roundedRect(mx, y, doc.page.width - mx * 2, 80, 10).fill();

  const drawStat = (label, value, color, col) => {
    const x = mx + col * colW + 20;
    doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(label, x, y + 14);
    doc.fillColor(color).font('Helvetica-Bold').fontSize(16).text(value, x, y + 30);
  };

  drawStat('ENTRADAS DO MÊS', brl(summary.income), '#10b981', 0);
  drawStat('SAÍDAS DO MÊS', brl(summary.expense), '#f43f5e', 1);
  drawStat('SALDO DO MÊS', brl(summary.balance),
    summary.balance >= 0 ? '#d4a853' : '#f43f5e', 2);

  // ── Tabela de transações ─────────────────────────────────
  y += 100;
  const cols = { date: 50, type: 130, category: 210, desc: 320, amount: 460 };

  doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(8);
  doc.text('DATA', cols.date, y);
  doc.text('TIPO', cols.type, y);
  doc.text('CATEGORIA', cols.category, y);
  doc.text('DESCRIÇÃO', cols.desc, y);
  doc.text('VALOR', cols.amount, y);

  y += 6;
  doc.strokeColor('#1e293b').lineWidth(0.5)
    .moveTo(50, y).lineTo(doc.page.width - 50, y).stroke();
  y += 10;

  for (const t of transactions) {
    if (y > doc.page.height - 80) { doc.addPage(); y = 50; }

    const isIncome = t.type === 'INCOME';
    doc.fillColor('#0d1320').rect(50, y - 4, doc.page.width - 100, 20).fill();

    const dateStr = t.date instanceof Date
      ? t.date.toLocaleDateString('pt-BR')
      : new Date(t.date).toLocaleDateString('pt-BR');

    doc.fillColor('#94a3b8').font('Helvetica').fontSize(9);
    doc.text(dateStr, cols.date, y, { width: 75 });
    doc.text(isIncome ? 'Entrada' : 'Saída', cols.type, y, { width: 75 });
    doc.text(t.category || '—', cols.category, y, { width: 100 });
    doc.text(t.description || '—', cols.desc, y, { width: 130 });

    doc.fillColor(isIncome ? '#10b981' : '#f43f5e')
      .font('Helvetica-Bold')
      .text(`${isIncome ? '+' : '−'} ${brl(t.amount)}`,
        cols.amount, y, { width: 90, align: 'right' });

    y += 22;
  }

  // ── Footer ───────────────────────────────────────────────
  doc.fillColor('#334155').font('Helvetica').fontSize(8)
    .text('Finvault — Relatório confidencial',
      50, doc.page.height - 40, { align: 'center' });

  doc.end();
}

module.exports = { execute };