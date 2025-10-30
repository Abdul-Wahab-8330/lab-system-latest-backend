const express = require('express');
const router = express.Router();
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
  deleteTransaction
} = require('../controller/inventoryController');

// Inventory Items Routes
router.post('/items', createItem);
router.get('/items', getAllItems);
router.put('/items/:id', updateItem);
router.delete('/items/:id', deleteItem);

// Transaction Routes
router.post('/transactions/add', addStock);
router.post('/transactions/remove', removeStock);
router.get('/transactions', getAllTransactions);
router.get('/transactions/report', getTransactionsByDateRange);
router.delete('/transactions/:id', deleteTransaction);

// Stock Level Route
router.get('/stock', getCurrentStock);

module.exports = router;