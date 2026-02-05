const GeneralSettings = require('../models/GeneralSettings');

// Get general settings (creates default if doesn't exist)
const getGeneralSettings = async (req, res) => {
  try {
    let settings = await GeneralSettings.findOne();

    // Create default settings if none exist
    if (!settings) {
      settings = await GeneralSettings.create({
        printShowHeader: true,
        printShowFooter: true,
        updatedBy: 'System'
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching general settings:', error);
    res.status(500).json({ error: 'Failed to fetch general settings' });
  }
};

// Update general settings
const updateGeneralSettings = async (req, res) => {
  try {
    const { printShowHeader, printShowFooter, updatedBy } = req.body;

    const updateData = {
      updatedBy: updatedBy || 'Admin',
      updatedAt: new Date()
    };

    // Only update fields that are provided
    if (printShowHeader !== undefined) {
      updateData.printShowHeader = printShowHeader;
    }

    if (printShowFooter !== undefined) {
      updateData.printShowFooter = printShowFooter;
    }

    const settings = await GeneralSettings.findOneAndUpdate(
      {}, // Match any document (there should only be one)
      updateData,
      { new: true, upsert: true }
    );

    res.json(settings);
  } catch (error) {
    console.error('Error updating general settings:', error);
    res.status(500).json({ error: 'Failed to update general settings' });
  }
};

module.exports = {
  getGeneralSettings,
  updateGeneralSettings
};