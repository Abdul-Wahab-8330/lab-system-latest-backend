const express = require('express');
const router = express.Router();
const { 
  getAllFilters, 
  getFilter, 
  setFilter, 
  resetFilter 
} = require('../controller/systemSettingsController');

// Get all filters
router.get('/', getAllFilters);

// Get specific filter
router.get('/:type', getFilter);

// Set/update filter
router.put('/:type', setFilter);

// Reset filter
router.delete('/:type', resetFilter);

module.exports = router;