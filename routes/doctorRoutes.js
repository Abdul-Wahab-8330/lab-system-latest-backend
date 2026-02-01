const express = require("express");
const router = express.Router();
const doctorController = require("../controller/doctorController");
const verifyToken = require('../middleware/verifyToken');

router.get("/", verifyToken, doctorController.getDoctors);
router.post("/", verifyToken, doctorController.addDoctor);
router.put("/:id", verifyToken, doctorController.updateDoctor);  // new update route
router.delete("/:id", verifyToken, doctorController.deleteDoctor);

module.exports = router;