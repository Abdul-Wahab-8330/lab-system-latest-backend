const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'senior_receptionist', 'junior_receptionist', 'senior_lab_tech', 'junior_lab_tech'],
    default: "junior_receptionist"
  },
  // ============================================
  // Permission System Fields
  // ============================================
  // Array of permission IDs user can access
  // Auto-assigned on creation, editable by admin
  permissions: {
    type: [String],
    default: []
  },

  // Tracks last permission modification
  lastModifiedBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    date: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
