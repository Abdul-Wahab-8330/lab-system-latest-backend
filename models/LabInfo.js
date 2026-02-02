const mongoose = require("mongoose");

const labInfoSchema = new mongoose.Schema({
  labID: { type: String },
  labName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  address: { type: String },
  logoUrl: { type: String }, // User gives a direct link to the logo
  website: { type: String },
  description: { type: String }, // Any extra description
}, { timestamps: true });

module.exports = mongoose.model("LabInfo", labInfoSchema);
