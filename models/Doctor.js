const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema({
  // Mandatory
  name: {
    type: String,
    required: true,
    trim: true
  },

  // Optional profile fields
  clinicName: { type: String, trim: true, default: "" },
  phone: { type: String, trim: true, default: "" },
  email: { type: String, trim: true, default: "" },
  address: { type: String, trim: true, default: "" },
  specialty: { type: String, trim: true, default: "" },
  cnic: { type: String, trim: true, default: "" },
  notes: { type: String, trim: true, default: "" },

  // Commission percentages — set by lab admin
  routinePercentage: { type: Number, default: 0 },
  specialPercentage: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model("Doctor", DoctorSchema);