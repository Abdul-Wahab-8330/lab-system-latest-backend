const mongoose = require('mongoose');

const DailyExpenseSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('DailyExpense', DailyExpenseSchema);