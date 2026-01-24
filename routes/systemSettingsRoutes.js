const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');

const { 
  getAllFilters, 
  getFilter, 
  setFilter, 
  resetFilter,
  updateHistorySettings
} = require('../controller/systemSettingsController');

// Get all filters
router.get('/', verifyToken, getAllFilters);

// Get specific filter
router.get('/:type', verifyToken, getFilter);

// Set/update filter
router.put('/:type', verifyToken, setFilter);

// Reset filter
router.delete('/:type', verifyToken, resetFilter);

// ✅ NEW: Update history settings
router.patch('/:type/history', verifyToken, updateHistorySettings);

module.exports = router;