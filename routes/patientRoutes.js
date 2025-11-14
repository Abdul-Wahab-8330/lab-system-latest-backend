const express = require("express");
const router = express.Router();
const {getPatients, searchPatients, createPatient, updatePaymentStatus, deletePatients, getPatientById} = require("../controller/patientController");

router.post("/", createPatient);
router.get("/", getPatients);
router.patch("/:id/payment", updatePaymentStatus);
router.delete("/delete/:id", deletePatients);
// Add this to your patient routes
router.get('/search', searchPatients);

router.get('/:id', getPatientById);

module.exports = router;
