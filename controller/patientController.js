const Patient = require("../models/Patient");
const RefCounter = require("../models/RefCounter");
const TestTemplate = require("../models/TestTemplate"); // your existing test schema
const mongoose = require("mongoose");
const Doctor = require('../models/Doctor');


async function ensureDoctorExists(doctorName) {
  if (!doctorName || doctorName.trim() === '' || doctorName.toLowerCase() === 'self') {
    return doctorName; // Don't create doctor for "Self" or empty
  }

  try {
    // Check if doctor exists (case-insensitive)
    let doctor = await Doctor.findOne({ 
      name: { $regex: new RegExp(`^${doctorName.trim()}$`, 'i') } 
    });

    // If doesn't exist, create it
    if (!doctor) {
      doctor = new Doctor({ name: doctorName.trim() });
      await doctor.save();
      console.log(`✅ Auto-created new doctor: ${doctorName}`);
    }

    return doctor.name; // Return the properly formatted name from DB
  } catch (error) {
    console.error('Error ensuring doctor exists:', error);
    return doctorName; // Return original name if error
  }
}


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
  const centerCode = "9101";
  return `${centerCode}-${year}-${number}`;

}

function generateCaseNo() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const centerCode = "9101";

  return `${centerCode}-${day}-${month}`;
}

const createPatient = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      phone,
      fatherHusbandName,
      nicNo,
      specimen,
      paymentStatus,
      paymentStatusUpdatedBy,
      patientRegisteredBy,
      referencedBy,
      selectedTests,
      resultStatus
    } = req.body;
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

    // Extract discount data from request body
    const {
      discountPercentage = 0,
      discountAmount = 0,
      paidAmount = 0
    } = req.body;

    // Calculate netTotal and dueAmount
    const netTotal = Math.max(0, total - discountAmount); // Prevent negative
    const dueAmount = Math.max(0, netTotal - paidAmount); // Prevent negative


    // Auto-correct payment status and paidAmount
    let finalPaymentStatus = paymentStatus || 'Not Paid';
    let finalPaidAmount = paidAmount;
    let finalDueAmount = dueAmount;

    // Check if discount panel was used
    const hasPaymentData = discountPercentage > 0 || discountAmount > 0 || paidAmount > 0;

    if (hasPaymentData) {
      // Discount panel was used - auto-calculate based on actual payment
      if (paidAmount >= netTotal) {
        finalPaymentStatus = 'Paid';
        finalPaidAmount = netTotal;
        finalDueAmount = 0;
      } else if (paidAmount > 0) {
        finalPaymentStatus = 'Partially Paid';
        finalDueAmount = netTotal - paidAmount;
      } else {
        finalPaymentStatus = 'Not Paid';
        finalDueAmount = netTotal;
      }
    } else {
      // Discount panel NOT used - set values based on manual payment status
      if (finalPaymentStatus === 'Paid') {
        finalPaidAmount = netTotal;
        finalDueAmount = 0;
      } else if (finalPaymentStatus === 'Not Paid') {
        finalPaidAmount = 0;
        finalDueAmount = netTotal;
      }
      // For 'Partially Paid' without discount panel, keep user's paidAmount
    }

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
      fatherHusbandName: fatherHusbandName || '',
      nicNo: nicNo || '',
      specimen: specimen || 'Taken in Lab',
      paymentStatus: finalPaymentStatus,
      resultStatus: resultStatus || 'Pending',
      referencedBy: await ensureDoctorExists(referencedBy || 'Self'),
      paymentStatusUpdatedBy,
      patientRegisteredBy,
      tests: testsForPatient,
      total,
      discountPercentage,
      discountAmount,
      netTotal,
      paidAmount: finalPaidAmount,
      dueAmount: finalDueAmount
    });

    await patient.save();

    // Emit socket event for real-time updates
    if (global.io) {
      global.io.emit('patientRegistered', {
        patient: patient
      });
    }

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
    }).select('name age phone gender referencedBy refNo caseNo fatherHusbandName nicNo specimen')

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

    if (global.io) {
      global.io.emit('patientDeleted', {
        patientId: id,
        patientName: patient.name
      });
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
  const { paymentStatus, paymentStatusUpdatedBy, paidAmount, dueAmount } = req.body;

  if (!paymentStatus || !paymentStatusUpdatedBy) {
    return res.status(400).json({ message: "Payment status and updater name required" });
  }

  try {
    const updateData = {
      paymentStatus,
      paymentStatusUpdatedBy
    };

    // If paidAmount and dueAmount are provided, update them too
    if (paidAmount !== undefined) {
      updateData.paidAmount = paidAmount;
    }
    if (dueAmount !== undefined) {
      updateData.dueAmount = dueAmount;
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (global.io) {
      global.io.emit('paymentStatusUpdated', {
        patientId: id,
        patientName: updatedPatient.name,
        paymentStatus: updatedPatient.paymentStatus,
        paidAmount: updatedPatient.paidAmount,
        dueAmount: updatedPatient.dueAmount
      });
    }

    res.json({ success: true, updatedPatient });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPatients, createPatient, searchPatients, updatePaymentStatus, deletePatients, getPatientById };