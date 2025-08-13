const LabInfo = require("../models/LabInfo");

// Create or update Lab Info (upsert)
const saveLabInfo = async (req, res) => {
  try {
    const { labName, phoneNumber, email, address, logoUrl, website, description } = req.body;

    let labInfo = await LabInfo.findOne();
    if (labInfo) {
      // Update
      labInfo.labName = labName;
      labInfo.phoneNumber = phoneNumber;
      labInfo.email = email;
      labInfo.address = address;
      labInfo.logoUrl = logoUrl;
      labInfo.website = website;
      labInfo.description = description;
      await labInfo.save();
      return res.status(200).json({ success: true, message: "Lab info updated", labInfo });
    }

    // Create new
    labInfo = new LabInfo({ labName, phoneNumber, email, address, logoUrl, website, description });
    await labInfo.save();
    res.status(201).json({ success: true, message: "Lab info created", labInfo });

  } catch (err) {
    console.error("Error saving lab info:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Lab Info
const getLabInfo = async (req, res) => {
  try {
    const labInfo = await LabInfo.findOne();
    res.status(200).json(labInfo || {});
  } catch (err) {
    console.error("Error fetching lab info:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { saveLabInfo, getLabInfo };
