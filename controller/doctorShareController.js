const Patient = require("../models/Patient");
const TestTemplate = require("../models/TestTemplate");

// ============================================================
// HELPER: Calculate per-test final amounts and doctor share
// for a single patient. Used by all three reports.
// ============================================================
function calculatePatientShare(patient) {
  const total = patient.total || 0;
  if (total === 0) return { tests: [], totalBilling: 0, totalDoctorShare: 0 };

  // Convert discount to a uniform percentage regardless of how it was entered
  const discountPercent = total > 0 ? ((patient.discountAmount || 0) / total) * 100 : 0;

  const tests = (patient.tests || []).map((test) => {
    const originalPrice = test.price || 0;
    // Apply the same discount % to each test individually
    const discountedAmount = originalPrice - (originalPrice * discountPercent / 100);
    const finalTestAmount = Math.round(discountedAmount * 100) / 100;

    // Pick routine or special percentage from the snapshot
    const snapshot = patient.doctorCommissionSnapshot || { routine: 0, special: 0 };
    const testType = test.testType || "routine"; // fallback to routine
    const commissionPercent = testType === "special" ? snapshot.special : snapshot.routine;

    // Doctor share for this test
    const doctorShare = Math.round((finalTestAmount * commissionPercent / 100) * 100) / 100;

    return {
      testId: test.testId,
      testName: test.testName,
      testType,
      originalPrice,
      finalTestAmount,
      commissionPercent,
      doctorShare
    };
  });

  const totalBilling = Math.round(tests.reduce((sum, t) => sum + t.finalTestAmount, 0) * 100) / 100;
  const totalDoctorShare = Math.round(tests.reduce((sum, t) => sum + t.doctorShare, 0) * 100) / 100;

  return { tests, totalBilling, totalDoctorShare };
}

// ============================================================
// A) DOCTOR STATEMENT (Summary)
// For a selected doctor + date range:
//   - Total routine tests, total special tests
//   - Total billing, doctor share, lab revenue
// ============================================================
const getDoctorStatement = async (req, res) => {
  try {
    const { doctorName, startDate, endDate } = req.query;
    if (!doctorName || !startDate || !endDate) {
      return res.status(400).json({ error: "doctorName, startDate, and endDate are required" });
    }

    // Fetch patients referred by this doctor within date range
    const patients = await Patient.find({
      referencedBy: doctorName,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate + "T23:59:59.999Z") }
    });

    let totalRoutineTests = 0;
    let totalSpecialTests = 0;
    let totalBilling = 0;
    let totalDoctorShare = 0;

    patients.forEach((patient) => {
      const { tests, totalBilling: patientBilling, totalDoctorShare: patientShare } = calculatePatientShare(patient);
      tests.forEach((t) => {
        if (t.testType === "special") totalSpecialTests++;
        else totalRoutineTests++;
      });
      totalBilling += patientBilling;
      totalDoctorShare += patientShare;
    });

    totalBilling = Math.round(totalBilling * 100) / 100;
    totalDoctorShare = Math.round(totalDoctorShare * 100) / 100;
    const labRevenue = Math.round((totalBilling - totalDoctorShare) * 100) / 100;

    res.json({
      doctorName,
      startDate,
      endDate,
      totalRoutineTests,
      totalSpecialTests,
      totalBilling,
      totalDoctorShare,
      labRevenue
    });
  } catch (error) {
    console.error("getDoctorStatement error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ============================================================
// B) DOCTOR TEST BREAKDOWN (Detailed)
// For a selected doctor + date range:
//   - Per test: name, times referred, final billed amount, commission
// ============================================================
const getDoctorTestBreakdown = async (req, res) => {
  try {
    const { doctorName, startDate, endDate } = req.query;
    if (!doctorName || !startDate || !endDate) {
      return res.status(400).json({ error: "doctorName, startDate, and endDate are required" });
    }

    const patients = await Patient.find({
      referencedBy: doctorName,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate + "T23:59:59.999Z") }
    });

    // Aggregate by test name
    const testMap = {};

    patients.forEach((patient) => {
      const { tests } = calculatePatientShare(patient);
      tests.forEach((t) => {
        if (!testMap[t.testName]) {
          testMap[t.testName] = {
            testName: t.testName,
            testType: t.testType,
            timesReferred: 0,
            totalFinalAmount: 0,
            totalCommission: 0
          };
        }
        testMap[t.testName].timesReferred += 1;
        testMap[t.testName].totalFinalAmount += t.finalTestAmount;
        testMap[t.testName].totalCommission += t.doctorShare;
      });
    });

    // Convert map to array and round
    const breakdown = Object.values(testMap).map((item) => ({
      ...item,
      totalFinalAmount: Math.round(item.totalFinalAmount * 100) / 100,
      totalCommission: Math.round(item.totalCommission * 100) / 100
    }));

    // Totals
    const totalBilling = Math.round(breakdown.reduce((sum, t) => sum + t.totalFinalAmount, 0) * 100) / 100;
    const totalDoctorShare = Math.round(breakdown.reduce((sum, t) => sum + t.totalCommission, 0) * 100) / 100;
    const labRevenue = Math.round((totalBilling - totalDoctorShare) * 100) / 100;

    res.json({
      doctorName,
      startDate,
      endDate,
      breakdown,
      totalBilling,
      totalDoctorShare,
      labRevenue
    });
  } catch (error) {
    console.error("getDoctorTestBreakdown error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// ============================================================
// C) LAB REFERRAL SUMMARY (Combined — all doctors)
// For a date range:
//   - Each doctor: total billing, doctor share, lab revenue
// Supports optional doctorName filter for single-doctor print
// ============================================================
const getLabReferralSummary = async (req, res) => {
  try {
    const { startDate, endDate, doctorName } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }

    // Build query — if doctorName provided, filter to single doctor
    const query = {
      referencedBy: { $ne: "Self" }, // Exclude "Self" referrals — no commission on those
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate + "T23:59:59.999Z") }
    };
    if (doctorName) {
      query.referencedBy = doctorName;
    }

    const patients = await Patient.find(query);

    // Aggregate by doctor name
    const doctorMap = {};

    patients.forEach((patient) => {
      const name = patient.referencedBy;
      if (!doctorMap[name]) {
        doctorMap[name] = { doctorName: name, totalBilling: 0, totalDoctorShare: 0, totalPatients: 0 };
      }
      const { totalBilling, totalDoctorShare } = calculatePatientShare(patient);
      doctorMap[name].totalBilling += totalBilling;
      doctorMap[name].totalDoctorShare += totalDoctorShare;
      doctorMap[name].totalPatients += 1;
    });

    // Convert and round
    const summary = Object.values(doctorMap).map((d) => ({
      ...d,
      totalBilling: Math.round(d.totalBilling * 100) / 100,
      totalDoctorShare: Math.round(d.totalDoctorShare * 100) / 100,
      labRevenue: Math.round((d.totalBilling - d.totalDoctorShare) * 100) / 100
    }));

    // Grand totals
    const grandTotalBilling = Math.round(summary.reduce((s, d) => s + d.totalBilling, 0) * 100) / 100;
    const grandTotalDoctorShare = Math.round(summary.reduce((s, d) => s + d.totalDoctorShare, 0) * 100) / 100;
    const grandLabRevenue = Math.round((grandTotalBilling - grandTotalDoctorShare) * 100) / 100;

    res.json({
      startDate,
      endDate,
      summary,
      grandTotalBilling,
      grandTotalDoctorShare,
      grandLabRevenue
    });
  } catch (error) {
    console.error("getLabReferralSummary error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get raw patients for a specific doctor — frontend renders the tables
const getDoctorPatients = async (req, res) => {
  try {
    const { doctorName, startDate, endDate } = req.query;
    if (!doctorName || !startDate || !endDate) {
      return res.status(400).json({ error: "doctorName, startDate, and endDate are required" });
    }
    const patients = await Patient.find({
      referencedBy: doctorName,
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate + "T23:59:59.999Z") }
    }).sort({ createdAt: 1 });
    res.json({ patients });
  } catch (error) {
    console.error("getDoctorPatients error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get raw patients for ALL doctors (excludes Self) — used by Lab Referral Summary
const getLabReferralPatients = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: "startDate and endDate are required" });
    }
    const patients = await Patient.find({
      referencedBy: { $ne: "Self" },
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate + "T23:59:59.999Z") }
    }).sort({ createdAt: 1 });
    res.json({ patients });
  } catch (error) {
    console.error("getLabReferralPatients error:", error);
    res.status(500).json({ error: "Server error" });
  }
};


module.exports = { getDoctorStatement, getDoctorTestBreakdown, getLabReferralSummary, getDoctorPatients, getLabReferralPatients };