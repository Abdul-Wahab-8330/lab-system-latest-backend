
const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldType: { type: String, default: 'string' },
  defaultValue: { type: String, default: '' },
  unit: { type: String, default: '' },
  range: { type: String, default: '' },
  category: {
    type: String,
  }
});

const TestTemplateSchema = new mongoose.Schema({
  testCode: {
    type: Number,
    required: true,
    unique: true,
  },
  testName: {
    type: String,
    required: true,
    unique: true,
  },
  testPrice: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  specimen: {
    type: String,
    required: true,
  },
  performed: {
    type: String,
    required: true,
  },
  reported: {
    type: String,
    required: true,
  },
  fields: [FieldSchema],

  // ✅ NEW: Flag for diagnostic tests (ECG, X-Ray, etc.)
  isDiagnosticTest: {
    type: Boolean,
    default: false
  },

  // ✅ NEW: Optional narrative sections
  reportExtras: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    required: false
  },
  scaleConfig: {
    thresholds: [Number],  // e.g., [4, 7]
    labels: [String]       // e.g., ["Low", "Moderate", "High"]
  },

  // ✅ NEW: Vertical visual scale config
  visualScale: {
    thresholds: [Number],      // e.g., [200, 240] for cholesterol
    labels: [String],          // e.g., ["Desirable", "Borderline High", "High"]
    colors: [String],          // e.g., ["#10b981", "#f59e0b", "#ef4444"] (green, yellow, red)
    rangeTexts: [String]       // e.g., ["<200", "200-240", ">240"] - shown in legend
  }

}, { timestamps: true });

module.exports = mongoose.model('TestTemplate', TestTemplateSchema);