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
        const patient = await Patient.findById(req.params.id).lean();
        if (!patient) return res.status(404).json({ message: "Patient not found" });

        // Fetch fields for each test from TestTemplate, merging with any saved results
        const testsWithFields = await Promise.all(
            patient.tests.map(async (t) => {
                const template = await TestTemplate.findById(t.testId).lean();

                // Find saved result for this test (if exists)
                const savedResult = patient.results?.find(
                    r => r.testId.toString() === t.testId.toString()
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
        const { tests, resultAddedBy } = req.body; // 'tests' = changed tests only

        const patient = await Patient.findById(req.params.id);
        if (!patient) {
            return res.status(404).json({ message: "Patient not found" });
        }

        // Convert to map for quick lookup
        const existingResults = patient.results || [];

        tests.forEach(t => {
            const idx = existingResults.findIndex(r => r.testId.toString() === t.testId.toString());
            if (idx > -1) {
                // Update existing test results
                existingResults[idx] = {
                    ...existingResults[idx],
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
                    testId: t.testId,
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

        // Check if all tests have results filled
        const allTestsHaveResults =
            patient.results.length === patient.tests.length &&
            patient.results.every(r => r.fields.every(f => f.defaultValue && f.defaultValue.trim() !== ""));

        patient.resultStatus = allTestsHaveResults ? "Added" : "Pending";
        patient.resultAddedBy = resultAddedBy;

        await patient.save();

        res.json({ message: "Results saved successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
