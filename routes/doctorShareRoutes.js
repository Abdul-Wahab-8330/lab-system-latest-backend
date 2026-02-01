const express = require("express");
const router = express.Router();
const { getDoctorStatement, getDoctorTestBreakdown, getLabReferralSummary, getDoctorPatients, getLabReferralPatients } = require("../controller/doctorShareController");
const verifyToken = require("../middleware/verifyToken");

// A) Doctor Statement (Summary)
router.get("/doctor-statement", verifyToken, getDoctorStatement);

// B) Doctor Test Breakdown (Detailed)
router.get("/doctor-breakdown", verifyToken, getDoctorTestBreakdown);

// C) Lab Referral Summary (All doctors combined)
router.get("/lab-referral-summary", verifyToken, getLabReferralSummary);

router.get("/doctor-patients", verifyToken, getDoctorPatients);

router.get("/lab-referral-patients", verifyToken, getLabReferralPatients);

module.exports = router;