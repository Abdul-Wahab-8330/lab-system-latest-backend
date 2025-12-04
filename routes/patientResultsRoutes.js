const express = require("express");
const router = express.Router();
const {
  getPendingPatients,
  getPatientTestsWithFields,
  addResultsToPatient,
  getAddedPatients,
  resetPatientResults,
  deletePatientTest
} = require("../controller/patientResultsController");

router.get("/pending", getPendingPatients);
router.get("/added", getAddedPatients);
router.get("/:id/tests", getPatientTestsWithFields);
router.patch("/:id/results", addResultsToPatient);
router.patch("/:id/reset", resetPatientResults);
router.delete('/patients/:patientId/tests/:testId', deletePatientTest);


module.exports = router;
