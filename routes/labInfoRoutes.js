const express = require("express");
const router = express.Router();
const { saveLabInfo, getLabInfo } = require("../controller/labInfoController");

router.get("/", getLabInfo);
router.post("/", saveLabInfo);

module.exports = router;
