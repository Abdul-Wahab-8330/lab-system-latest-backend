const express = require("express");
const router = express.Router();
const {getPatients, searchPatients, createPatient, updatePaymentStatus, deletePatients, getPatientById, updatePatient, deletePatientTest} = require("../controller/patientController");
const verifyToken = require("../middleware/verifyToken");

router.post("/", verifyToken, createPatient);
router.get("/", verifyToken, getPatients);
router.patch("/:id/payment", verifyToken, updatePaymentStatus);
router.delete("/delete/:id", verifyToken, deletePatients);
// Add this to your patient routes
router.get('/search', verifyToken, searchPatients);

router.get('/:id', verifyToken, getPatientById);

router.patch("/update/:id", verifyToken, updatePatient);
router.delete("/:patientId/test/:testId", verifyToken, deletePatientTest);

module.exports = router;
