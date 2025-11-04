const DailyExpense = require('../models/DailyExpense');

// Add new expense
const addExpense = async (req, res) => {
  try {
    const { date, description, amount } = req.body;

    const newExpense = new DailyExpense({
      date,
      description,
      amount: Number(amount)
    });

    await newExpense.save();
    res.status(201).json({ success: true, expense: newExpense });
  } catch (error) {
    console.error('addExpense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all expenses
const getAllExpenses = async (req, res) => {
  try {
    const expenses = await DailyExpense.find({}).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, expenses });
  } catch (error) {
    console.error('getAllExpenses error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get expenses by date range
const getExpensesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await DailyExpense.find(query).sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, expenses });
  } catch (error) {
    console.error('getExpensesByDateRange error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await DailyExpense.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('deleteExpense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update expense
const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, amount } = req.body;

    const updated = await DailyExpense.findByIdAndUpdate(
      id,
      { date, description, amount: Number(amount) },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.status(200).json({ success: true, expense: updated });
  } catch (error) {
    console.error('updateExpense error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addExpense,
  getAllExpenses,
  getExpensesByDateRange,
  deleteExpense,
  updateExpense
};