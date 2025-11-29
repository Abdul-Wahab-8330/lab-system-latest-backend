const SystemSettings = require('../models/SystemSettings');

// Get all 3 filters
const getAllFilters = async (req, res) => {
  try {
    const filters = await SystemSettings.find();
    
    // Ensure all 3 filter types exist
    const filterTypes = ['registration', 'payment', 'results'];
    const existingTypes = filters.map(f => f.filterType);
    
    // Create missing filters with default values
    for (const type of filterTypes) {
      if (!existingTypes.includes(type)) {
        await SystemSettings.create({
          filterType: type,
          daysLimit: null,
          isActive: false,
          updatedBy: 'System'
        });
      }
    }
    
    // Fetch again after creation
    const allFilters = await SystemSettings.find();
    res.json(allFilters);
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
};

// Get specific filter
const getFilter = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['registration', 'payment', 'results'].includes(type)) {
      return res.status(400).json({ error: 'Invalid filter type' });
    }
    
    let filter = await SystemSettings.findOne({ filterType: type });
    
    // Create if doesn't exist
    if (!filter) {
      filter = await SystemSettings.create({
        filterType: type,
        daysLimit: null,
        isActive: false,
        updatedBy: 'System'
      });
    }
    
    res.json(filter);
  } catch (error) {
    console.error('Error fetching filter:', error);
    res.status(500).json({ error: 'Failed to fetch filter' });
  }
};

// Set/Update filter
const setFilter = async (req, res) => {
  try {
    const { type } = req.params;
    const { daysLimit, updatedBy } = req.body;

    if (!['registration', 'payment', 'results'].includes(type)) {
      return res.status(400).json({ error: 'Invalid filter type' });
    }

    if (!daysLimit || daysLimit < 1) {
      return res.status(400).json({ error: 'Days limit must be at least 1' });
    }

    const filter = await SystemSettings.findOneAndUpdate(
      { filterType: type },
      {
        daysLimit: parseInt(daysLimit),
        isActive: true,
        updatedBy: updatedBy || 'Admin',
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );

    // Emit socket event for real-time updates
    if (global.io) {
      global.io.emit('filterUpdated', {
        filterType: type,
        daysLimit: filter.daysLimit,
        isActive: filter.isActive
      });
    }

    res.json(filter);
  } catch (error) {
    console.error('Error setting filter:', error);
    res.status(500).json({ error: 'Failed to set filter' });
  }
};

// Reset filter
const resetFilter = async (req, res) => {
  try {
    const { type } = req.params;

    if (!['registration', 'payment', 'results'].includes(type)) {
      return res.status(400).json({ error: 'Invalid filter type' });
    }

    const filter = await SystemSettings.findOneAndUpdate(
      { filterType: type },
      {
        daysLimit: null,
        isActive: false,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Emit socket event
    if (global.io) {
      global.io.emit('filterUpdated', {
        filterType: type,
        daysLimit: null,
        isActive: false
      });
    }

    res.json(filter);
  } catch (error) {
    console.error('Error resetting filter:', error);
    res.status(500).json({ error: 'Failed to reset filter' });
  }
};

module.exports = { 
  getAllFilters, 
  getFilter, 
  setFilter, 
  resetFilter 
};