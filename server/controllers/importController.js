const Transaction = require('../models/Transaction');
const multer      = require('multer');
const PDFParser   = require('pdf2json');

// Safely execute PDF parsing using modern pdf2json parser
const executePDFParse = (buffer) => {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();

    parser.on('pdfParser_dataError', (errData) => {
      reject(errData.parserError || new Error('Failed to parse PDF data'));
    });

    parser.on('pdfParser_dataReady', (pdfData) => {
      try {
        let extractedText = '';
        const pages = pdfData.Pages || [];
        
        for (const page of pages) {
          const texts = page.Texts || [];
          let lastY = -1;
          let lineText = '';

          for (const textItem of texts) {
            const decoded = decodeURIComponent(textItem.R[0].T);
            
            // Reconstruct rows based on vertical positioning (Y coordinate)
            // If the item has a different Y, it's generally a new segment or line
            if (lastY !== -1 && Math.abs(textItem.y - lastY) > 0.4) {
              extractedText += lineText.trim() + '\n';
              lineText = '';
            }
            
            lineText += decoded + ' ';
            lastY = textItem.y;
          }
          
          if (lineText) {
            extractedText += lineText.trim() + '\n';
          }
        }
        
        resolve({ text: extractedText });
      } catch (err) {
        reject(err);
      }
    });

    parser.parseBuffer(buffer);
  });
};

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
  // Matches type indicator +/- and amount figures (e.g. +₹50,000 or -₹350)
  const amountMatch = line.match(/([+-])[₹]?([\d,]+(?:\.\d+)?)/);
  if (!amountMatch) return null;

  const type   = amountMatch[1] === '+' ? 'income' : 'expense';
  const amount = parseFloat(amountMatch[2].replace(/,/g, ''));
  if (!amount || amount <= 0) return null;

  // Extract date formatted as DD/MM/YYYY
  const dateMatch = line.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  let date = new Date();
  if (dateMatch) {
    date = new Date(`${dateMatch[3]}-${dateMatch[2].padStart(2,'0')}-${dateMatch[1].padStart(2,'0')}`);
    if (isNaN(date.getTime())) date = new Date();
  }

  let category = 'Other';
  for (const cat of VALID_CATEGORIES) {
    if (line.includes(cat)) { category = cat; break; }
  }

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

      // Execute pdf parsing safely using modern pdf2json
      const pdfData = await executePDFParse(req.file.buffer);
      const lines   = pdfData.text.split('\n').map((l) => l.trim()).filter((l) => l.length > 5);

      const parsed = [];
      for (const line of lines) {
        if (/date|title|type|category|note|amount|expensepro|xpensepro|report|balance|income|expense|page \d/i.test(line) && !/₹/.test(line)) continue;
        if (/generated|report for|total records/i.test(line)) continue;

        const tx = parseLineToTransaction(line);
        if (tx) parsed.push(tx);
      }

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
