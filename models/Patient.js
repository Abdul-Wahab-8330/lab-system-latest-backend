

const mongoose = require("mongoose");

// Each test result entry for a patient
const PatientResultSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TestTemplate",
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  fields: [
    {
      fieldName: {
        type: String,
        required: true
      },
      defaultValue: {
        type: String,
      },
      unit: {
        type: String
      },
      range: {
        type: String
      }
    }
  ]
});

// The ordered tests when registering patient
const PatientTestSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TestTemplate",
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  testType: {
    type: String,
    enum: ["routine", "special"],
    default: "routine"
  }
});

const PatientSchema = new mongoose.Schema(
  {
    refNo: {
      type: String,
      required: true,
      unique: true
    },
    caseNo: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    age: {
      type: Number,
      required: true
    },
    ageUnit: {
      type: String,
      enum: ["years", "months", "days"],
      default: "years",
      required: true
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    fatherHusbandName: {
      type: String,
      trim: true
    },
    nicNo: {
      type: String,
      trim: true
    },
    specimen: {
      type: String,
      default: "Taken in Lab"
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["Paid", "Not Paid", "Partially Paid"]
    },
    resultStatus: {
      type: String,
      required: true,
      enum: ["Pending", "Added"]
    },
    referencedBy: {
      type: String,
      required: true
    },
    // Snapshot of doctor's commission % at the time of patient registration
    // This ensures old records stay accurate even if doctor's % changes later
    doctorCommissionSnapshot: {
      routine: { type: Number, default: 0 },
      special: { type: Number, default: 0 }
    },
    resultAddedBy: {
      type: String
    },
    paymentStatusUpdatedBy: {
      type: String,
      required: true
    },
    patientRegisteredBy: {
      type: String
    },
    finalReportApprovedBy: {
      type: String
    },
    tests: [PatientTestSchema],
    results: [PatientResultSchema],
    total: {
      type: Number,
      required: true
    },
    discountPercentage: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    netTotal: {
      type: Number,
      required: true
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    dueAmount: {
      type: Number,
      default: 0
    },
    // ========== PAYMENT METHOD TRACKING (Cash vs Bank) ==========
    cashAmount: {
      type: Number,
      default: 0
    },
    bankAmount: {
      type: Number,
      default: 0
    }
    // ============================================================
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Patient", PatientSchema);