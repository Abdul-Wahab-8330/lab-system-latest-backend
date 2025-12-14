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
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
