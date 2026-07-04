const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  cycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  nextBillingDate: {
    type: Date,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
