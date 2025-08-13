// models/RefCounter.js
const mongoose = require("mongoose");

const RefCounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g. "patient_ref"
  seq: { type: Number, default: 100000 } // start at 100000 -> 6 digits
});

module.exports = mongoose.model("RefCounter", RefCounterSchema);
