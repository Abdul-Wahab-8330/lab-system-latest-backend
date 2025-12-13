const Patient = require('../models/Patient');

exports.getPublicReports = async (req, res) => {
    try {
        const { name, patientNumber, phone } = req.body;

        // Validation (name is optional)
        if (!patientNumber || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Patient number and phone are required'
            });
        }

        // Clean patient number (remove dashes for matching)
        // const cleanPatientNumber = patientNumber.replace(/-/g, '');

        // Build query - name is optional
        const query = {
            refNo: patientNumber,
            phone: phone
        };

        // Add name to query only if provided
        if (name && name.trim()) {
            query.name = { $regex: new RegExp(`^${name.trim()}$`, 'i') }; // Case-insensitive exact match
        }

        // Find patient matching criteria
        const patient = await Patient.findOne(query).populate({
            path: 'tests.testId',
            model: 'TestTemplate',
            select: 'testName testCode specimen performed reported fields category reportExtras isDiagnosticTest'
        }).lean();

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'No matching patient found. Please check your details.'
            });
        }

        // ✅ Filter out diagnostic tests from public view
        const filteredTests = patient.tests.filter(test =>
            test.testId?.isDiagnosticTest !== true
        );

        // Prepare registration report data
        const registrationReport = {
            refNo: patient.refNo,
            caseNo: patient.caseNo,
            name: patient.name,
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone,
            fatherHusbandName: patient.fatherHusbandName,
            nicNo: patient.nicNo,
            specimen: patient.specimen,
            referencedBy: patient.referencedBy,
            createdAt: patient.createdAt,
            tests: filteredTests.map(t => ({
                testName: t.testName,
                price: t.price,
                testCode: t.testId?.testCode,
                specimen: t.testId?.specimen
            })),
            total: patient.total,
            discountPercentage: patient.discountPercentage,
            discountAmount: patient.discountAmount,
            netTotal: patient.netTotal,
            paidAmount: patient.paidAmount,
            dueAmount: patient.dueAmount
        };

        // Prepare final report data (if results exist)
        let finalReport = null;
        if (patient.resultStatus === 'Added' && patient.results && patient.results.length > 0) {
            // Merge tests with results
            const testsWithResults = filteredTests.map(test => {
                const result = patient.results.find(r =>
                    r.testId.toString() === test.testId._id.toString()
                );

                if (result) {
                    return {
                        testName: test.testName,
                        testCode: test.testId?.testCode,
                        category: test.testId?.category,
                        specimen: test.testId?.specimen,
                        performed: test.testId?.performed,
                        reported: test.testId?.reported,
                        reportExtras: test.testId?.reportExtras,
                        fields: result.fields.map(f => ({
                            fieldName: f.fieldName,
                            defaultValue: f.defaultValue,
                            unit: f.unit,
                            range: f.range,
                            category: f.category
                        }))
                    };
                }
                return null;
            }).filter(Boolean);

            if (testsWithResults.length > 0) {
                finalReport = {
                    refNo: patient.refNo,
                    caseNo: patient.caseNo,
                    name: patient.name,
                    age: patient.age,
                    gender: patient.gender,
                    phone: patient.phone,
                    fatherHusbandName: patient.fatherHusbandName,
                    nicNo: patient.nicNo,
                    specimen: patient.specimen,
                    referencedBy: patient.referencedBy,
                    resultAddedBy: patient.resultAddedBy,
                    createdAt: patient.createdAt,
                    updatedAt: patient.updatedAt,
                    tests: testsWithResults
                };
            }
        }

        res.status(200).json({
            success: true,
            registrationReport,
            finalReport,
            hasResults: finalReport !== null
        });

    } catch (error) {
        console.error('Public report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};