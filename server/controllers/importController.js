const Transaction = require('../models/Transaction');
const multer      = require('multer');
let pdfParse = require('pdf-parse');
if (typeof pdfParse !== 'function') {
  if (pdfParse.default && typeof pdfParse.default === 'function') {
    pdfParse = pdfParse.default;
  } else if (pdfParse.pdfParse && typeof pdfParse.pdfParse === 'function') {
    pdfParse = pdfParse.pdfParse;
  }
}

// Multer — memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are accepted'), false);
  },
});

const VALID_CATEGORIES = [
  'Game', 'Snacks', 'Online Shopping', 'Washing Machine', 'Miscellaneous', 'Pocket Money',
  'Food & Dining','Transportation','Shopping','Entertainment','Bills & Utilities',
  'Healthcare','Education','Travel','Personal Care','Rent & Housing',
  'EMI & Loans','Salary','Freelance','Business','Investment','Gift','Bonus','Other',
];

// ─── Parse a raw PDF text line into a transaction object ─────────────────────
const parseLineToTransaction = (line) => {
  // Expected row format from our exported PDF (autotable):
  // "25/05/2026  Monthly Salary  Income  Salary  -  +₹50,000"
  // Try to extract amount first
  const amountMatch = line.match(/([+-])[₹]?([\d,]+(?:\.\d+)?)/);
  if (!amountMatch) return null;

  const type   = amountMatch[1] === '+' ? 'income' : 'expense';
  const amount = parseFloat(amountMatch[2].replace(/,/g, ''));
  if (!amount || amount <= 0) return null;

  // Extract date
  const dateMatch = line.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  let date = new Date();
  if (dateMatch) {
    date = new Date(`${dateMatch[3]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[1].padStart(2,'0')}`);
    if (isNaN(date.getTime())) date = new Date();
  }

  // Extract category
  let category = 'Other';
  for (const cat of VALID_CATEGORIES) {
    if (line.includes(cat)) { category = cat; break; }
  }

  // Title: take text between date and type keyword, cleaned
  let title = line
    .replace(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, '')
    .replace(/[+-][₹]?[\d,]+(?:\.\d+)?/, '')
    .replace(/income|expense/i, '')
    .replace(category, '')
    .replace(/[^\w\s&'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);

  if (!title || title.length < 2) title = 'Imported from PDF';

  return { title, amount, type, category, date: date.toISOString(), note: 'Imported from PDF' };
};

// @desc    Import transactions from PDF (our exported format)
// @route   POST /api/transactions/import/pdf
// @access  Private
const importFromPDF = [
  upload.single('pdf'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a PDF file' });
      }

      const pdfData = await pdfParse(req.file.buffer);
      const lines   = pdfData.text.split('\n').map((l) => l.trim()).filter((l) => l.length > 5);

      const parsed = [];
      for (const line of lines) {
        // Skip header lines, summary lines, page footers
        if (/date|title|type|category|note|amount|expensepro|xpensepro|report|balance|income|expense|page \d/i.test(line) && !/₹/.test(line)) continue;
        if (/generated|report for|total records/i.test(line)) continue;

        const tx = parseLineToTransaction(line);
        if (tx) parsed.push(tx);
      }

      // Deduplicate by title+amount+date
      const seen   = new Set();
      const unique = parsed.filter((t) => {
        const key = `${t.title}-${t.amount}-${t.date}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      res.json({ success: true, count: unique.length, data: unique });
    } catch (err) {
      console.error('PDF import error:', err.message);
      res.status(500).json({ success: false, message: 'Failed to parse PDF: ' + err.message });
    }
  },
];

module.exports = { importFromPDF };
