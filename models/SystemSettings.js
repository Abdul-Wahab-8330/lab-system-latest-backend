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
  // ✅ NEW FIELDS FOR HISTORY RESULTS
  historyResultsCount: {
    type: Number,
    default: 4,
    min: 0,
    max: 10,
    validate: {
      validator: Number.isInteger,
      message: 'History results count must be an integer'
    }
  },
  historyResultsDirection: {
    type: String,
    default: 'left-to-right',
    enum: ['left-to-right', 'right-to-left']
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