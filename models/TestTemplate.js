
const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  fieldName: { type: String, required: true },
  fieldType: { type: String, default: 'string' },
  defaultValue: { type: String, default: '' },
  unit: { type: String, default: '' },
  range: { type: String, default: '' },
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
}, { timestamps: true });

module.exports = mongoose.model('TestTemplate', TestTemplateSchema);