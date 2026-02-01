const Doctor = require("../models/Doctor");

// Get all doctors
const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Add a doctor (only name is required, rest optional)
const addDoctor = async (req, res) => {
  try {
    const { name, clinicName, phone, email, address, specialty, cnic, notes, routinePercentage, specialPercentage } = req.body;
    if (!name) return res.status(400).json({ error: "Doctor name is required" });

    const newDoctor = new Doctor({
      name,
      clinicName: clinicName || "",
      phone: phone || "",
      email: email || "",
      address: address || "",
      specialty: specialty || "",
      cnic: cnic || "",
      notes: notes || "",
      routinePercentage: routinePercentage || 0,
      specialPercentage: specialPercentage || 0
    });

    await newDoctor.save();
    res.status(201).json(newDoctor);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Update a doctor
const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, clinicName, phone, email, address, specialty, cnic, notes, routinePercentage, specialPercentage } = req.body;

    if (!name) return res.status(400).json({ error: "Doctor name is required" });

    const updated = await Doctor.findByIdAndUpdate(id, {
      name,
      clinicName: clinicName || "",
      phone: phone || "",
      email: email || "",
      address: address || "",
      specialty: specialty || "",
      cnic: cnic || "",
      notes: notes || "",
      routinePercentage: routinePercentage || 0,
      specialPercentage: specialPercentage || 0
    }, { new: true });

    if (!updated) return res.status(404).json({ error: "Doctor not found" });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a doctor
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findByIdAndDelete(id);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });
    res.json({ success: true, message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getDoctors, addDoctor, updateDoctor, deleteDoctor };