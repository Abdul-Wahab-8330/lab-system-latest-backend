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
    enum: ['user', 'admin', 'receptionist', 'lab_technologist'],
    default: "user"
  }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
