const Patient = require("../models/Patient");
const RefCounter = require("../models/RefCounter");
const TestTemplate = require("../models/TestTemplate"); // your existing test schema
const mongoose = require("mongoose");

// Generate unique 6-digit ref no (atomic)
async function generateRefNo() {
  // findOneAndUpdate with upsert to increment atomically
  const counter = await RefCounter.findOneAndUpdate(
    { name: "patient_ref" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  // Ensure 6 digits — pad if necessary
  const number = String(counter.seq).padStart(6, "0");
  return number;
}

const createPatient = async (req, res) => {
  try {
    const { name, age, gender, phone, paymentStatus, paymentStatusUpdatedBy , patientRegisteredBy , referencedBy, selectedTests, resultStatus } = req.body;
    // validation (basic)
    if (!name || !age || !gender || !phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // selectedTests should be array of { testId } or { testId, ... }
    if (!Array.isArray(selectedTests) || selectedTests.length === 0) {
      return res.status(400).json({ error: "Please select at least one test" });
    }

    // Fetch prices and names from DB to avoid client manipulation
    const testIds = selectedTests.map(t => new mongoose.Types.ObjectId(t.testId));
    const testsFromDb = await TestTemplate.find({ _id: { $in: testIds } });

    // Build tests array with authoritative price/name
    const testsForPatient = testsFromDb.map(t => ({
      testId: t._id,
      testName: t.testName,
      price: t.testPrice
    }));

    // total
    const total = testsForPatient.reduce((s, t) => s + (t.price || 0), 0);

    // generate refNo
    const refNo = await generateRefNo();

    const patient = new Patient({
      refNo,
      name,
      age,
      gender,
      phone,
      paymentStatus: paymentStatus || 'Not Paid',
      resultStatus: resultStatus || 'Pending',
      referencedBy: referencedBy || 'Self',
      paymentStatusUpdatedBy,
      patientRegisteredBy,
      tests: testsForPatient,
      total
    });

    await patient.save();
    return res.status(201).json(patient);
  } catch (err) {
    console.error("createPatient err:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

const getPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
    res.json(patients);
  } catch (err) {
    console.error("getPatients err:", err);
    res.status(500).json({ error: "Server error" });
  }
};



const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    console.log('Search query:', q); // Debug log
    
    const patients = await Patient.find({
      name: { $regex: q, $options: 'i' }
    }).select('name age phone gender referencedBy').limit(10);
    
    console.log('Found patients:', patients.length); // Debug log
    res.json(patients);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}


const deletePatients = async (req, res) => {
  try {
    const {id} = req.params;
    const patient = await Patient.findByIdAndDelete(id)
    if(!patient){
      res.status(404).json({
        success:false,
        message:'patient not found'
      })}
    res.json({
      success: true,
      message: 'Patient deleted successfully'
    })
    
  } catch (err) {
    console.error("delete patient err:", err);
    res.status(500).json({ error: "Server error" });
  }
};


//Update payment status
const updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, paymentStatusUpdatedBy } = req.body;

  if (!paymentStatus || !paymentStatusUpdatedBy) {
    return res.status(400).json({ message: "Payment status and updater name required" });
  }

  try {
    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { paymentStatus, paymentStatusUpdatedBy },
      { new: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.json({success:true, updatedPatient});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {getPatients, createPatient, searchPatients, updatePaymentStatus, deletePatients}