const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  filterType: {
    type: String,
    required: true,
    enum: ['registration', 'payment', 'results'],
    unique: true
  },
  daysLimit: {
    type: Number,
    default: null
  },
  isActive: {
    type: Boolean,
    default: false
  },
  updatedBy: {
    type: String,
    default: 'System'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);