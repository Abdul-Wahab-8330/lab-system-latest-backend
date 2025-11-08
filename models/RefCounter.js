const mongoose = require("mongoose");

const RefCounterSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  }, // e.g. "patient_ref_2025" or "case_ref_2025-11-08"
  seq: { 
    type: Number, 
    default: 0 
  } // starts at 0, will increment to 1, 2, 3...
});

module.exports = mongoose.model("RefCounter", RefCounterSchema);