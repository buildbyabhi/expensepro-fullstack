const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a category name'],
      unique: true,
      trim: true,
      maxlength: [30, 'Category name cannot exceed 30 characters'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Please specify category type'],
    },
    color: {
      type: String,
      default: '#818cf8',
    },
    icon: {
      type: String,
      default: 'tag',
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Category', CategorySchema);
