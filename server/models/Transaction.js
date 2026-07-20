const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Please provide an amount'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Please specify income or expense'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: [
        // Expense categories
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Education',
        'Travel',
        'Personal Care',
        'Groceries',
        'Rent & Housing',
        'EMI & Loans',
        'Game',
        'Snacks',
        'Online Shopping',
        'Washing Machine',
        'Miscellaneous',
        // Income categories
        'Salary',
        'Freelance',
        'Business',
        'Investment',
        'Gift',
        'Bonus',
        'Pocket Money',
        'Other',
      ],
    },
    note: {
      type: String,
      maxlength: [200, 'Note cannot exceed 200 characters'],
      default: '',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries by user and date
TransactionSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Transaction', TransactionSchema);
