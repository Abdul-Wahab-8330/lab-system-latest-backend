const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);