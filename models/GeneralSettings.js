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

  // Future settings can be added here
  // Example: 
  // defaultLanguage: { type: String, default: 'en' },
  // timezone: { type: String, default: 'UTC' },

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