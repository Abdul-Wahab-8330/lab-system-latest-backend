const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const {
  // Public endpoints
  submitReview,
  getPublicReviews,
  canReview,
  
  // Admin endpoints
  getAllReviews,
  updateReviewStatus,
  deleteReview,
  getReviewSettings,
  updateReviewSettings
} = require('../controller/reviewController');

// ===================================
// PUBLIC ROUTES (No Authentication)
// ===================================
router.post('/submit', submitReview);
router.get('/public', getPublicReviews);
router.get('/can-review/:patientRefNo', canReview);

// ===================================
// ADMIN ROUTES (Require Authentication)
// ===================================
router.get('/admin', verifyToken, getAllReviews);
router.patch('/admin/:id/status', verifyToken, updateReviewStatus);
router.delete('/admin/:id', verifyToken, deleteReview);
router.get('/admin/settings', verifyToken, getReviewSettings);
router.put('/admin/settings', verifyToken, updateReviewSettings);

module.exports = router;