const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { getGeneralSettings, updateGeneralSettings } = require('../controller/generalSettingsController');

// Get general settings
router.get('/', verifyToken, getGeneralSettings);

// Update general settings
router.put('/', verifyToken, updateGeneralSettings);

module.exports = router;