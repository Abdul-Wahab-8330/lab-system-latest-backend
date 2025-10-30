const InventoryItem = require('../models/InventoryItem');
const InventoryTransaction = require('../models/InventoryTransaction');

// ============================================
// INVENTORY ITEMS CRUD
// ============================================

// Create new inventory item
const createItem = async (req, res) => {
  try {
    const { itemId, itemName, description } = req.body;

    // Check if itemId already exists
    const existing = await InventoryItem.findOne({ itemId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Item ID already exists' });
    }

    const newItem = new InventoryItem({ itemId, itemName, description });
    await newItem.save();

    res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    console.error('createItem error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all inventory items
const getAllItems = async (req, res) => {
  try {
    const items = await InventoryItem.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, items });
  } catch (error) {
    console.error('getAllItems error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update inventory item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemId, itemName, description } = req.body;

    // Check if new itemId conflicts with another item
    if (itemId) {
      const existing = await InventoryItem.findOne({ itemId, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Item ID already exists' });
      }
    }

    const updated = await InventoryItem.findByIdAndUpdate(
      id,
      { itemId, itemName, description },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, item: updated });
  } catch (error) {
    console.error('updateItem error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete inventory item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item has transactions
    const hasTransactions = await InventoryTransaction.findOne({ itemId: id });
    if (hasTransactions) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete item with existing transactions'
      });
    }

    const deleted = await InventoryItem.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.status(200).json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    console.error('deleteItem error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// INVENTORY TRANSACTIONS
// ============================================

// Add stock (addition transaction)
const addStock = async (req, res) => {
  try {
    const { date, itemId, quantity, remarks } = req.body;

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const transaction = new InventoryTransaction({
      date,
      itemId,
      itemName: item.itemName,
      quantity,
      transactionType: 'addition',
      remarks
    });

    await transaction.save();
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error('addStock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove stock (removal transaction)
const removeStock = async (req, res) => {
  try {
    const { date, itemId, quantity, remarks } = req.body;

    const item = await InventoryItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Check current stock
    const currentStock = await getCurrentStockForItem(itemId);
    if (quantity > currentStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available: ${currentStock}`
      });
    }

    const transaction = new InventoryTransaction({
      date,
      itemId,
      itemName: item.itemName,
      quantity,
      transactionType: 'removal',
      remarks
    });

    await transaction.save();
    res.status(201).json({ success: true, transaction });
  } catch (error) {
    console.error('removeStock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all transactions
const getAllTransactions = async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find({})
      .populate('itemId')
      .sort({ date: -1, createdAt: -1 });
    res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('getAllTransactions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get transactions by date range (for reports)
const getTransactionsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const transactions = await InventoryTransaction.find(query)
      .populate('itemId')
      .sort({ date: 1, createdAt: 1 });

    res.status(200).json({ success: true, transactions });
  } catch (error) {
    console.error('getTransactionsByDateRange error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current stock levels for all items
const getCurrentStock = async (req, res) => {
  try {
    const items = await InventoryItem.find({});

    const stockLevels = await Promise.all(
      items.map(async (item) => {
        const stock = await getCurrentStockForItem(item._id);
        return {
          itemId: item._id,
          itemIdCode: item.itemId,
          itemName: item.itemName,
          description: item.description,
          currentStock: stock
        };
      })
    );

    res.status(200).json({ success: true, stockLevels });
  } catch (error) {
    console.error('getCurrentStock error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to calculate current stock for an item
const getCurrentStockForItem = async (itemId) => {
  const mongoose = require('mongoose');

  // Ensure itemId is ObjectId type
  const objectId = mongoose.Types.ObjectId.isValid(itemId)
    ? new mongoose.Types.ObjectId(itemId)
    : itemId;

  const additions = await InventoryTransaction.aggregate([
    { $match: { itemId: objectId, transactionType: 'addition' } },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ]);

  const removals = await InventoryTransaction.aggregate([
    { $match: { itemId: objectId, transactionType: 'removal' } },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ]);

  const totalAdditions = additions.length > 0 ? additions[0].total : 0;
  const totalRemovals = removals.length > 0 ? removals[0].total : 0;

  return totalAdditions - totalRemovals;
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await InventoryTransaction.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('deleteTransaction error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  // Items
  createItem,
  getAllItems,
  updateItem,
  deleteItem,
  // Transactions
  addStock,
  removeStock,
  getAllTransactions,
  getTransactionsByDateRange,
  getCurrentStock,
  deleteTransaction
};