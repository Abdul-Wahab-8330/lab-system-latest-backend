const express = require("express");
const router = express.Router();
const {
  getPendingPatients,
  getPatientTestsWithFields,
  addResultsToPatient,
  getAddedPatients
} = require("../controller/patientResultsController");

router.get("/pending", getPendingPatients);
router.get("/added", getAddedPatients);
router.get("/:id/tests", getPatientTestsWithFields);
router.patch("/:id/results", addResultsToPatient);

module.exports = router;
