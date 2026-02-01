
const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldType: { type: String, default: 'string' },
  defaultValue: { type: String, default: '' },
  unit: { type: String, default: '' },
  range: { type: String, default: '' },
  category: {
    type: String,
  },
  // ✅ NEW: Special rendering mode
  specialRender: {
    enabled: { type: Boolean, default: false },
    description: { type: String, default: '' },
    scaleConfig: {
      thresholds: [Number],  // e.g., [100, 200]
      labels: [String]        // e.g., ["Low", "Normal", "High"]
    }
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
  testType: {
    type: String,
    enum: ["routine", "special"],
    required: true,
    default: "routine"  // existing tests will default to routine until admin updates them
  },

  // ✅ NEW: Flag for diagnostic tests (ECG, X-Ray, etc.)
  isDiagnosticTest: {
    type: Boolean,
    default: false
  },

  // ✅ NEW: Flag for narrative/descriptive format (no table)
  isNarrativeFormat: {
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