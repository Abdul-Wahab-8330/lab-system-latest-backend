const express = require("express");
const router = express.Router();
const {
  getPendingPatients,
  getPatientTestsWithFields,
  addResultsToPatient,
  getAddedPatients,
  resetPatientResults,
  deletePatientTest,
  getPatientHistoryByPhone
} = require("../controller/patientResultsController");
const verifyToken = require("../middleware/verifyToken");

router.get("/pending", verifyToken, getPendingPatients);
router.get("/added", verifyToken, getAddedPatients);
router.get("/:id/tests", verifyToken, getPatientTestsWithFields);
router.patch("/:id/results", verifyToken, addResultsToPatient);
router.patch("/:id/reset", verifyToken, resetPatientResults);
router.delete('/patients/:patientId/tests/:testId', verifyToken, deletePatientTest);

router.get("/history/:phone", verifyToken, getPatientHistoryByPhone);

module.exports = router;
