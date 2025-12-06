const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

const {
  addExpense,
  getAllExpenses,
  getExpensesByDateRange,
  deleteExpense,
  updateExpense
} = require('../controller/expenseController');

router.post('/', verifyToken, addExpense);
router.get('/', verifyToken, getAllExpenses);
router.get('/date-range', verifyToken, getExpensesByDateRange);
router.delete('/:id', verifyToken, deleteExpense);
router.put('/:id', verifyToken, updateExpense);

module.exports = router;