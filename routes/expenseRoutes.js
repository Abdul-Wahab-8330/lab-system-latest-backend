const express = require('express');
const router = express.Router();
const {
  addExpense,
  getAllExpenses,
  getExpensesByDateRange,
  deleteExpense,
  updateExpense
} = require('../controller/expenseController');

router.post('/', addExpense);
router.get('/', getAllExpenses);
router.get('/date-range', getExpensesByDateRange);
router.delete('/:id', deleteExpense);
router.put('/:id', updateExpense);

module.exports = router;