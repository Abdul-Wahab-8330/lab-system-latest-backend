const mongoose = require('mongoose');

const generalSettingsSchema = new mongoose.Schema({
  // Print Settings
  printShowHeader: {
    type: Boolean,
    default: true
  },
  printShowFooter: {
    type: Boolean,
    default: true
  },

  headerTopMargin: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Reasonable max limit
  },

  // ✅ NEW: Table Width Mode
  tableWidthMode: {
    type: String,
    enum: ['smart', 'full'],
    default: 'smart' // 83% for smart, 100% for full
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

module.exports = mongoose.model('GeneralSettings', generalSettingsSchema);