const Transaction = require('../models/Transaction');

// @desc    Get all transactions for logged-in user
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, limit = 100, page = 1 } = req.query;

    const filter = { user: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Transaction.countDocuments(filter);

    // Calculate summary
    const allFiltered = await Transaction.find(filter);
    const totalIncome = allFiltered
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = allFiltered
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
      },
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, note, date } = req.body;

    if (!title || !amount || !type || !category) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      title,
      amount: parseFloat(amount),
      type,
      category,
      note: note || '',
      date: date ? new Date(date) : new Date(),
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    // Ensure user owns transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await transaction.deleteOne();

    res.status(200).json({ success: true, message: 'Transaction deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monthly chart data for the current year
// @route   GET /api/transactions/stats/monthly
// @access  Private
const getMonthlyStats = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const stats = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i).toLocaleString('default', { month: 'short' }),
      income: 0,
      expense: 0,
    }));

    stats.forEach(({ _id, total }) => {
      const m = months[_id.month - 1];
      if (_id.type === 'income') m.income = total;
      else m.expense = total;
    });

    res.status(200).json({ success: true, data: months });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get category-wise breakdown
// @route   GET /api/transactions/stats/categories
// @access  Private
const getCategoryStats = async (req, res) => {
  try {
    const { type = 'expense' } = req.query;

    const stats = await Transaction.aggregate([
      { $match: { user: req.user._id, type } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTransactions,
  addTransaction,
  deleteTransaction,
  getMonthlyStats,
  getCategoryStats,
};
