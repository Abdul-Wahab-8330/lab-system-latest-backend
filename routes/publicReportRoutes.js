const express = require('express');
const router = express.Router();
const { getPublicReports } = require('../controller/publicReportController');

// ❌ NO JWT MIDDLEWARE ON THIS ROUTE
// Public endpoint for QR code report viewing
router.post('/get-reports', getPublicReports);

module.exports = router;