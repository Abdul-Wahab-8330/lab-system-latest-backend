const express = require("express");
const router = express.Router();
const { saveLabInfo, getLabInfo } = require("../controller/labInfoController");
const verifyToken = require('../middleware/verifyToken');

router.get("/", getLabInfo);
router.post("/", verifyToken, saveLabInfo);

module.exports = router;
