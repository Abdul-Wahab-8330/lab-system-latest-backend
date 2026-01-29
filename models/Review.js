const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    // Patient Identification (for validation & preventing duplicates)
    patientRefNo: {
        type: String,
        required: true,
        unique: true
    },
    patientPhone: {
        type: String,
        required: true
    },
    patientName: {
        type: String,
        required: true
    },

    // Review Content
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviewText: {
        type: String,
        trim: true,
        maxlength: 500,
        default: ''
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved'
    },

    // Admin who approved/rejected (if applicable)
    reviewedBy: {
        type: String
    },
    reviewedAt: {
        type: Date
    }
}, {
    timestamps: true // Adds createdAt and updatedAt automatically
});

// Compound index to ensure one review per patient number
reviewSchema.index({ patientRefNo: 1 }, { unique: true });

// Index for efficient queries
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);