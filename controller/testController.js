const TestTemplate = require('../models/TestTemplate');
const createDynamicModel = require('../utils/dynamicModel');

const CreateTestTemplate = async (req, res) => {
const { testCode, testName, testPrice, category, specimen, performed, reported, fields } = req.body;
  try {
const existing = await TestTemplate.findOne({ $or: [{ testName }, { testCode }] });

if (existing) return res.status(400).json({ message: 'Test already exists' });

const savedSchema = new TestTemplate({ testCode, testName, testPrice, category, specimen, performed, reported, fields });
    await savedSchema.save();

    // createDynamicModel(testName, fields); // create the model dynamically

    res.status(201).json({success:true, message: 'Test created successfully' });
    console.log('Test created successfully')
  } catch (error) {
  console.error("CreateTestTemplate Error:", error);
    res.status(500).json({success:false, message: error.message });
  }
};


const GetAllTests = async (req, res) => {
  try {
    const tests = await TestTemplate.find({});
    res.status(200).json({ success: true, tests });
  } catch (error) {
    console.error("GetAllTests Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a test
const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    await TestTemplate.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Test deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a test
const updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { testCode, testName, testPrice, category, specimen, performed, reported, fields } = req.body;
    const updated = await TestTemplate.findByIdAndUpdate(id, { testCode, testName, testPrice, category, specimen, performed, reported, fields }, { new: true });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




module.exports = { CreateTestTemplate, GetAllTests, deleteTest, updateTest };
