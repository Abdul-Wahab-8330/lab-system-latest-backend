const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldType: { type: String, default: 'string' },
  defaultValue: { type: String, default: '' },
  unit: { type: String, default: '' },
  range: { type: String, default: '' },
});

const TestTemplateSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: true,
    unique: true,
  },
  testPrice: {
    type: Number,
    required: true,
  },
  fields: [FieldSchema],
}, { timestamps: true });

module.exports = mongoose.model('TestTemplate', TestTemplateSchema);
