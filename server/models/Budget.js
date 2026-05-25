const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: Number, required: true }, // 1-12
    year:  { type: Number, required: true },
    totalBudget: { type: Number, required: true, default: 0 },
    categoryBudgets: [
      {
        category: { type: String, required: true },
        amount: { type: Number, required: true, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

// One budget per user per month/year
BudgetSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', BudgetSchema);
