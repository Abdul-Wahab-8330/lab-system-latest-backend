const Patient = require('../models/Patient');

exports.getPublicReports = async (req, res) => {
    try {
        const { name, patientNumber, phone } = req.body;

        if (!patientNumber || !phone) {
            return res.status(400).json({
                success: false,
                message: 'Patient number and phone are required'
            });
        }

        const query = {
            refNo: patientNumber,
            phone: phone
        };

        if (name && name.trim()) {
            query.name = { $regex: new RegExp(`^${name.trim()}$`, 'i') };
        }

        // ✅ Fetch current patient
        const patient = await Patient.findOne(query).populate({
            path: 'tests.testId',
            model: 'TestTemplate',
            select: 'testName testCode specimen performed reported fields category reportExtras isDiagnosticTest visualScale scaleConfig isNarrativeFormat'
        }).lean();

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'No matching patient found. Please check your details.'
            });
        }

        // Prepare registration report
        const registrationReport = {
            refNo: patient.refNo,
            caseNo: patient.caseNo,
            name: patient.name,
            age: patient.age,
            ageUnit: patient.ageUnit || 'Years',
            gender: patient.gender,
            phone: patient.phone,
            fatherHusbandName: patient.fatherHusbandName,
            nicNo: patient.nicNo,
            specimen: patient.specimen,
            referencedBy: patient.referencedBy,
            createdAt: patient.createdAt,
            tests: patient.tests.map(t => ({
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

        // Prepare final report with history
        let finalReport = null;
        if (patient.resultStatus === 'Added' && patient.results && patient.results.length > 0) {
            const nonDiagnosticTests = patient.tests.filter(test =>
                test.testId?.isDiagnosticTest !== true
            );

            // ✅ Merge template fields with result fields to get category
            const testsWithResults = nonDiagnosticTests.map(test => {
                const result = patient.results.find(r =>
                    r.testId.toString() === test.testId._id.toString()
                );

                if (result) {
                    const fieldsWithCategory = result.fields.map(resultField => {
                        const templateField = test.testId?.fields?.find(
                            tf => tf.fieldName === resultField.fieldName
                        );

                        return {
                            fieldName: resultField.fieldName,
                            defaultValue: resultField.defaultValue,
                            unit: resultField.unit,
                            range: resultField.range,
                            category: templateField?.category || resultField.category
                        };
                    });

                    return {
                        testName: test.testName,
                        testId: test.testId,
                        testCode: test.testId?.testCode,
                        category: test.testId?.category,
                        specimen: test.testId?.specimen,
                        performed: test.testId?.performed,
                        reported: test.testId?.reported,
                        reportExtras: test.testId?.reportExtras,
                        scaleConfig: test.testId?.scaleConfig,
                        visualScale: test.testId?.visualScale,
                        fields: fieldsWithCategory
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
                    ageUnit: patient.ageUnit || 'Years',
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

                // ✅ Fetch and attach history
                try {
                    const SystemSettings = require('../models/SystemSettings');
                    const settings = await SystemSettings.findOne({ filterType: 'results' });
                    const historyCount = settings?.historyResultsCount || 4;

                    console.log('🔍 Fetching history for phone:', patient.phone);
                    console.log('📊 History count limit:', historyCount);

                    const historicalPatients = await Patient.find({
                        phone: patient.phone,
                        _id: { $ne: patient._id },
                        resultStatus: 'Added'
                    })
                        .sort({ createdAt: -1 })
                        .limit(historyCount)
                        .populate({
                            path: 'tests.testId',
                            model: 'TestTemplate',
                            select: 'testName fields'
                        })
                        .lean();

                    console.log('📦 Historical patients found:', historicalPatients.length);

                    if (historicalPatients && historicalPatients.length > 0) {
                        finalReport.historicalPatients = historicalPatients.map(hp => ({
                            refNo: hp.refNo,
                            caseNo: hp.caseNo,
                            createdAt: hp.createdAt,
                            tests: hp.tests,
                            results: hp.results
                        }));
                        console.log('✅ History attached to finalReport');
                    } else {
                        console.log('⚠️ No historical patients found');
                    }
                } catch (historyError) {
                    console.error('❌ Error fetching history:', historyError);
                    // Continue without history if it fails
                }
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