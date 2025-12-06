const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

const {
  createItem,
  getAllItems,
  updateItem,
  deleteItem,
  addStock,
  removeStock,
  getAllTransactions,
  getTransactionsByDateRange,
  getCurrentStock,
  deleteTransaction,
  getStockLevelsWithTotals,
  getDailySummary
} = require('../controller/inventoryController');

// Inventory Items Routes
router.post('/items',  verifyToken, createItem);
router.get('/items',  verifyToken, getAllItems);
router.put('/items/:id',  verifyToken, updateItem);
router.delete('/items/:id',  verifyToken, deleteItem);

// Transaction Routes
router.post('/transactions/add',  verifyToken, addStock);
router.post('/transactions/remove',  verifyToken, removeStock);
router.get('/transactions',  verifyToken, getAllTransactions);
router.get('/transactions/report',  verifyToken, getTransactionsByDateRange);
router.delete('/transactions/:id',  verifyToken, deleteTransaction);

// Stock Level Route
router.get('/stock', verifyToken, getCurrentStock);

router.get('/stock-levels-with-totals',  verifyToken, getStockLevelsWithTotals);
router.get('/daily-summary',  verifyToken, getDailySummary);

module.exports = router;