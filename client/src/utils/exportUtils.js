import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate } from './formatCurrency';

// ─── PDF EXPORT ──────────────────────────────────────────────────────────────
export const exportToPDF = (transactions, summary, userName = 'User') => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();

  // ── Header Background ──
  doc.setFillColor(15, 15, 30);
  doc.rect(0, 0, pageW, 45, 'F');

  // ── Logo / Title ──
  doc.setTextColor(129, 140, 248);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('XpensePro', 14, 18);

  doc.setTextColor(200, 200, 220);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Smart Expense Tracker', 14, 25);

  // ── Report Info ──
  doc.setTextColor(180, 180, 200);
  doc.setFontSize(9);
  doc.text(`Report for: ${userName}`, 14, 33);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 39);

  // ── Total transactions badge ──
  doc.setFillColor(40, 40, 80);
  doc.roundedRect(pageW - 60, 10, 46, 26, 4, 4, 'F');
  doc.setTextColor(129, 140, 248);
  doc.setFontSize(8);
  doc.text('TOTAL RECORDS', pageW - 37, 19, { align: 'center' });
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(String(transactions.length), pageW - 37, 30, { align: 'center' });

  // ── Summary Cards ──
  const cardY = 52;
  const cards = [
    { label: 'Balance', value: summary.balance, color: summary.balance >= 0 ? [34, 197, 94] : [239, 68, 68] },
    { label: 'Total Income', value: summary.totalIncome, color: [34, 197, 94] },
    { label: 'Total Expense', value: summary.totalExpense, color: [239, 68, 68] },
  ];

  const cardW = (pageW - 28 - 8) / 3;
  cards.forEach((card, i) => {
    const x = 14 + i * (cardW + 4);
    doc.setFillColor(25, 25, 50);
    doc.roundedRect(x, cardY, cardW, 22, 3, 3, 'F');
    doc.setDrawColor(...card.color);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, cardY, cardW, 22, 3, 3, 'S');
    doc.setTextColor(...card.color);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label.toUpperCase(), x + cardW / 2, cardY + 7, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(Math.abs(card.value)), x + cardW / 2, cardY + 16, { align: 'center' });
  });

  // ── Transactions Table ──
  doc.setTextColor(180, 180, 200);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction History', 14, cardY + 32);

  const rows = transactions.map((t) => [
    formatDate(t.date),
    t.title,
    t.type === 'income' ? 'Income' : 'Expense',
    t.category,
    t.note || '-',
    (t.type === 'income' ? '+' : '-') + formatCurrency(t.amount),
  ]);

  autoTable(doc, {
    startY: cardY + 36,
    head: [['Date', 'Title', 'Type', 'Category', 'Note', 'Amount']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 30, 60],
      textColor: [129, 140, 248],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
    },
    bodyStyles: {
      fillColor: [18, 18, 35],
      textColor: [200, 200, 220],
      fontSize: 8,
      cellPadding: 3,
    },
    alternateRowStyles: { fillColor: [22, 22, 45] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 26 },
      2: { halign: 'center', cellWidth: 20 },
      5: { halign: 'right', cellWidth: 28, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        const val = data.cell.raw;
        data.cell.styles.textColor = val.startsWith('+') ? [34, 197, 94] : [239, 68, 68];
      }
      if (data.section === 'body' && data.column.index === 2) {
        const val = data.cell.raw;
        data.cell.styles.textColor = val === 'Income' ? [34, 197, 94] : [239, 68, 68];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // ── Footer ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 130);
    doc.text(`XpensePro — Page ${i} of ${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }

  doc.save(`XpensePro_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ─── EXCEL EXPORT ─────────────────────────────────────────────────────────────
export const exportToExcel = (transactions, summary) => {
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Transactions ──
  const txData = [
    ['Date', 'Title', 'Type', 'Category', 'Amount (₹)', 'Note'],
    ...transactions.map((t) => [
      new Date(t.date).toLocaleDateString('en-IN'),
      t.title,
      t.type,
      t.category,
      t.amount,
      t.note || '',
    ]),
  ];
  const txSheet = XLSX.utils.aoa_to_sheet(txData);

  // Column widths
  txSheet['!cols'] = [
    { wch: 14 }, { wch: 30 }, { wch: 10 }, { wch: 22 }, { wch: 14 }, { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, txSheet, 'Transactions');

  // ── Sheet 2: Summary ──
  const summaryData = [
    ['XpensePro — Financial Summary'],
    ['Generated', new Date().toLocaleDateString('en-IN')],
    [],
    ['Metric', 'Amount (₹)'],
    ['Total Income', summary.totalIncome],
    ['Total Expense', summary.totalExpense],
    ['Net Balance', summary.balance],
    ['Total Transactions', transactions.length],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 22 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  XLSX.writeFile(wb, `XpensePro_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// ─── EXCEL IMPORT ─────────────────────────────────────────────────────────────
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (rows.length < 2) {
          return reject(new Error('File is empty or has no data rows'));
        }

        // Auto-detect header row (find row with "Title" or "Amount")
        let headerIdx = 0;
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          const r = rows[i].map((c) => String(c || '').toLowerCase());
          if (r.some((c) => c.includes('title') || c.includes('amount'))) {
            headerIdx = i;
            break;
          }
        }

        const headers = rows[headerIdx].map((h) => String(h || '').toLowerCase().trim());
        const getCol = (...keys) => {
          for (const k of keys) {
            const idx = headers.findIndex((h) => h.includes(k));
            if (idx !== -1) return idx;
          }
          return -1;
        };

        const colDate     = getCol('date');
        const colTitle    = getCol('title', 'description', 'name', 'particulars');
        const colType     = getCol('type');
        const colCategory = getCol('category', 'cat');
        const colAmount   = getCol('amount', 'amt', 'value');
        const colNote     = getCol('note', 'remarks', 'description');

        if (colTitle === -1 || colAmount === -1) {
          return reject(new Error('Could not find "Title" and "Amount" columns. Please use our Excel template.'));
        }

        const VALID_CATEGORIES = [
          'Game', 'Snacks', 'Online Shopping', 'Washing Machine', 'Miscellaneous', 'Pocket Money',
          'Food & Dining','Groceries','Transportation','Shopping','Entertainment','Bills & Utilities',
          'Healthcare','Education','Travel','Personal Care','Rent & Housing',
          'EMI & Loans','Salary','Freelance','Business','Investment','Gift','Bonus','Other',
        ];

        const parsed = [];
        for (let i = headerIdx + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[colAmount]) continue;

          const rawAmount = parseFloat(String(row[colAmount]).replace(/[^0-9.-]/g, ''));
          if (isNaN(rawAmount) || rawAmount <= 0) continue;

          const rawType = colType !== -1 ? String(row[colType] || '').toLowerCase() : '';
          const type = rawType.includes('income') ? 'income' : 'expense';

          let category = colCategory !== -1 ? String(row[colCategory] || '').trim() : '';
          if (!VALID_CATEGORIES.includes(category)) {
            category = type === 'income' ? 'Other' : 'Other';
          }

          let date = new Date();
          if (colDate !== -1 && row[colDate]) {
            const d = new Date(row[colDate]);
            if (!isNaN(d.getTime())) date = d;
          }

          parsed.push({
            title: String(row[colTitle] || 'Imported').trim().slice(0, 100),
            amount: rawAmount,
            type,
            category,
            note: colNote !== -1 ? String(row[colNote] || '').trim().slice(0, 200) : 'Imported from Excel',
            date: date.toISOString(),
          });
        }

        if (parsed.length === 0) {
          return reject(new Error('No valid transactions found. Check your file format.'));
        }

        resolve(parsed);
      } catch (err) {
        reject(new Error('Failed to read file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

// ─── EXCEL TEMPLATE DOWNLOAD ─────────────────────────────────────────────────
export const downloadExcelTemplate = () => {
  const data = [
    ['Date', 'Title', 'Type', 'Category', 'Amount (₹)', 'Note'],
    ['25/05/2026', 'Monthly Salary', 'income', 'Salary', 50000, 'May salary'],
    ['24/05/2026', 'Zomato Order', 'expense', 'Food & Dining', 350, 'Dinner'],
    ['23/05/2026', 'Metro Card', 'expense', 'Transportation', 200, ''],
    ['22/05/2026', 'Freelance Project', 'income', 'Freelance', 15000, 'Website project'],
  ];
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 10 }, { wch: 22 }, { wch: 14 }, { wch: 30 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  XLSX.writeFile(wb, 'XpensePro_Import_Template.xlsx');
};
