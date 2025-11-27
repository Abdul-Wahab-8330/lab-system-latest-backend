const Patient = require("../models/Patient");
const TestTemplate = require("../models/TestTemplate");

// Get pending patients with their tests
exports.getPendingPatients = async (req, res) => {
    try {
        const patients = await Patient.find({ resultStatus: "Pending" }).lean();
        res.json(patients);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
exports.getAddedPatients = async (req, res) => {
    try {
        const patients = await Patient.find({ resultStatus: "Added" }).lean();
        res.json(patients);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// Get test fields for a given patient (copies from TestTemplate)
exports.getPatientTestsWithFields = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate({
                path: 'tests.testId',
                model: 'TestTemplate',
                select: 'specimen testName testPrice fields category'
            })
            .lean();
        if (!patient) return res.status(404).json({ message: "Patient not found" });

        // Fetch fields for each test from TestTemplate, merging with any saved results
        const testsWithFields = await Promise.all(
            patient.tests.map(async (t) => {
                const template = t.testId;
                // Find saved result for this test (if exists)
                const savedResult = patient.results?.find(
                    r => r.testId.toString() === t.testId._id.toString()
                );

                // Merge saved values into template fields
                const mergedFields = template.fields.map(tf => {
                    const savedField = savedResult?.fields?.find(
                        sf => sf.fieldName === tf.fieldName
                    );
                    return {
                        ...tf,
                        defaultValue: savedField
                            ? savedField.defaultValue
                            : tf.defaultValue || ""
                    };
                });

                return {
                    ...t,
                    fields: mergedFields
                };
            })
        );

        res.json({ ...patient, tests: testsWithFields });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};


// Save patient-specific results
// PATCH /api/results/:id/results
exports.addResultsToPatient = async (req, res) => {
    try {
        const { tests, resultAddedBy, socketId } = req.body;

        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        const existingResults = patient.results || [];

        tests.forEach(t => {
            // ✅ FIX: Handle multiple formats of testId
            let testIdString;
            if (t.testId?._id) {
                // Case 1: Populated object { _id: '123', testName: 'CBC', ... }
                testIdString = t.testId._id.toString();
            } else if (t.testId) {
                // Case 2: Direct ObjectId or string
                testIdString = t.testId.toString();
            }

            // Skip if we couldn't extract a valid testId
            if (!testIdString) {
                console.error('Invalid testId format:', t);
                return;
            }

            const idx = existingResults.findIndex(r =>
                r.testId?.toString() === testIdString
            );

            if (idx > -1) {
                // Update existing result
                existingResults[idx] = {
                    testId: testIdString,
                    testName: t.testName,
                    fields: t.fields.map(f => ({
                        fieldName: f.fieldName,
                        defaultValue: f.defaultValue,
                        unit: f.unit,
                        range: f.range
                    }))
                };
            } else {
                // Add new result
                existingResults.push({
                    testId: testIdString,
                    testName: t.testName,
                    fields: t.fields.map(f => ({
                        fieldName: f.fieldName,
                        defaultValue: f.defaultValue,
                        unit: f.unit,
                        range: f.range
                    }))
                });
            }
        });

        patient.results = existingResults;

        // Check if ALL tests have results
        const allTestsCompleted = patient.results.length >= patient.tests.length &&
            patient.results.every(r =>
                r.fields.some(f => f.defaultValue && f.defaultValue.trim() !== "")
            );

        patient.resultStatus = allTestsCompleted ? "Added" : "Pending";
        patient.resultAddedBy = resultAddedBy;

        await patient.save();

        // Emit socket event
        if (global.io) {
            global.io.emit('resultAdded', {
                patientId: req.params.id,
                patientName: patient.name,
                resultStatus: patient.resultStatus,
                triggeredBySocketId: socketId
            });
        }

        res.json({ message: "Results saved successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


exports.resetPatientResults = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ message: "Patient not found" });

        patient.results = [];
        patient.resultStatus = "Pending";
        patient.resultAddedBy = null; // Optional: clear who added
        await patient.save();

        if (global.io) {
            global.io.emit('resultReset', {
                patientId: req.params.id,
                patientName: patient.name
            });
        }

        res.json({ message: "Results reset successfully", patient });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};