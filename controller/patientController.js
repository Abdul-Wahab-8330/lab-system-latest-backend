const Patient = require("../models/Patient");
const RefCounter = require("../models/RefCounter");
const TestTemplate = require("../models/TestTemplate"); // your existing test schema
const mongoose = require("mongoose");

// Generate unique 6-digit ref no (atomic)
async function generateRefNo() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const year = String(today.getFullYear()).slice(-2);
  const yearKey = today.getFullYear();

  const counter = await RefCounter.findOneAndUpdate(
    { name: `patient_ref_${yearKey}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const number = String(counter.seq).padStart(4, "0");
  return `${number}-${month}-${year}`;
}

async function generateCaseNo() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const dateKey = `${today.getFullYear()}-${month}-${day}`;

  const counter = await RefCounter.findOneAndUpdate(
    { name: `case_ref_${dateKey}` },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const caseNumber = 9100 + counter.seq;
  return `${caseNumber}-${day}-${month}`;
}

const createPatient = async (req, res) => {
  try {
    const { name, age, gender, phone, paymentStatus, paymentStatusUpdatedBy, patientRegisteredBy, referencedBy, selectedTests, resultStatus } = req.body;
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
    const caseNo = await generateCaseNo();

    const patient = new Patient({
      refNo,
      caseNo,
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
      .populate({
        path: 'tests.testId',
        model: 'TestTemplate'
      });
    res.json(patients);
  } catch (err) {
    console.error("getPatients err:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(id)
      .populate({
        path: 'tests.testId',
        model: 'TestTemplate',
        select: 'specimen testName testPrice' 
      });
    
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    
    res.json(patient);
  } catch (err) {
    console.error("getPatientById err:", err);
    res.status(500).json({ error: "Server error" });
  }
};


const searchPatients = async (req, res) => {
  try {
    const { q } = req.query;
    console.log('Search query:', q); // Debug log

    const patients = await Patient.find({
      $or: [
  { name: { $regex: q, $options: 'i' } },
  { phone: { $regex: q, $options: 'i' } },
  { refNo: { $regex: q, $options: 'i' } },
  { caseNo: { $regex: q, $options: 'i' } }
]
    }).select('name age phone gender referencedBy refNo caseNo')

    console.log('Found patients:', patients.length); // Debug log
    res.json(patients);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
}


const deletePatients = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByIdAndDelete(id)
    if (!patient) {
      res.status(404).json({
        success: false,
        message: 'patient not found'
      })
    }
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

    res.json({ success: true, updatedPatient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPatients, createPatient, searchPatients, updatePaymentStatus, deletePatients, getPatientById };