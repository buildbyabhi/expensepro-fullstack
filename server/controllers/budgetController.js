const Budget      = require('../models/Budget');
const Transaction = require('../models/Transaction');

// ── Get Budget for a month ────────────────────────────────────────────────────
const getBudget = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year  = parseInt(req.query.year)  || new Date().getFullYear();

    let budget = await Budget.findOne({ user: req.user._id, month, year });
    if (!budget) budget = { totalBudget: 0, categoryBudgets: [], month, year };

    // Get actual spending for this month
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'expense',
      date: { $gte: start, $lte: end },
    });

    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Spending per category
    const spentByCategory = {};
    transactions.forEach(t => {
      spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.amount;
    });

    res.json({ success: true, budget, totalSpent, spentByCategory });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Set / Update Budget ───────────────────────────────────────────────────────
const setBudget = async (req, res) => {
  try {
    const { month, year, totalBudget, categoryBudgets } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, month, year },
      { totalBudget, categoryBudgets },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBudget, setBudget };
