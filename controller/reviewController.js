const Review = require('../models/Review');
const SystemSettings = require('../models/SystemSettings');
const Patient = require('../models/Patient');

// ===================================
// PUBLIC ENDPOINTS (No Auth Required)
// ===================================

// Submit a review
exports.submitReview = async (req, res) => {
  try {
    const { patientRefNo, patientPhone, patientName, rating, reviewText } = req.body;

    // Validate required fields
    if (!patientRefNo || !patientPhone || !patientName || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Patient number, phone, name, and rating are required'
      });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Get review settings
    let settings = await SystemSettings.findOne({ filterType: 'results' });
    if (!settings) {
      settings = await SystemSettings.create({ filterType: 'results' });
    }

    // Check if reviews are enabled
    if (!settings.reviewsEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Reviews are currently disabled'
      });
    }

    // Verify patient exists (security check)
    const patient = await Patient.findOne({
      refNo: patientRefNo,
      phone: patientPhone
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Invalid patient details'
      });
    }

    // Check if patient already submitted a review
    const existingReview = await Review.findOne({ patientRefNo });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this visit'
      });
    }

    // Create review
    const review = await Review.create({
      patientRefNo,
      patientPhone,
      patientName,
      rating,
      reviewText: reviewText || '',
      status: settings.reviewsRequireApproval ? 'pending' : 'approved'
    });

    res.status(201).json({
      success: true,
      message: settings.reviewsRequireApproval 
        ? 'Thank you! Your review is pending approval.' 
        : 'Thank you for your review!',
      requiresApproval: settings.reviewsRequireApproval
    });

  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review. Please try again.'
    });
  }
};

// Get reviews for public display
exports.getPublicReviews = async (req, res) => {
  try {
    const { sort = 'newest', limit = 10 } = req.query;

    // Get settings
    const settings = await SystemSettings.findOne({ filterType: 'results' });
    if (!settings || !settings.reviewsEnabled) {
      return res.json({
        success: true,
        reviews: [],
        stats: {
          averageRating: 0,
          totalReviews: 0
        },
        settings: {
          enabled: false,
          showReviewerName: false
        }
      });
    }

    // Build sort criteria
    let sortCriteria = {};
    switch (sort) {
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      case 'highest':
        sortCriteria = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortCriteria = { rating: 1, createdAt: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }

    // Fetch approved reviews
    const reviews = await Review.find({ status: 'approved' })
      .select(`rating reviewText ${settings.reviewsShowReviewerName ? 'patientName' : ''} createdAt`)
      .sort(sortCriteria)
      .limit(Math.min(parseInt(limit), 50))
      .lean();

    // Calculate statistics
    const stats = await Review.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          fiveStars: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          fourStars: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          threeStars: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          twoStars: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          oneStar: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }
        }
      }
    ]);

    const statsResult = stats[0] || {
      averageRating: 0,
      totalReviews: 0,
      fiveStars: 0,
      fourStars: 0,
      threeStars: 0,
      twoStars: 0,
      oneStar: 0
    };

    res.json({
      success: true,
      reviews,
      stats: {
        averageRating: Math.round(statsResult.averageRating * 10) / 10,
        totalReviews: statsResult.totalReviews,
        distribution: {
          5: statsResult.fiveStars,
          4: statsResult.fourStars,
          3: statsResult.threeStars,
          2: statsResult.twoStars,
          1: statsResult.oneStar
        }
      },
      settings: {
        enabled: settings.reviewsEnabled,
        showReviewerName: settings.reviewsShowReviewerName
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

// Check if patient can review (hasn't reviewed yet)
exports.canReview = async (req, res) => {
  try {
    const { patientRefNo } = req.params;

    const settings = await SystemSettings.findOne({ filterType: 'results' });
    if (!settings || !settings.reviewsEnabled) {
      return res.json({
        success: true,
        canReview: false,
        reason: 'Reviews are currently disabled'
      });
    }

    const existingReview = await Review.findOne({ patientRefNo });

    res.json({
      success: true,
      canReview: !existingReview,
      reason: existingReview ? 'Already reviewed' : null
    });

  } catch (error) {
    console.error('Can review check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check review status'
    });
  }
};

// ===================================
// ADMIN ENDPOINTS (Auth Required)
// ===================================

// Get all reviews (admin)
exports.getAllReviews = async (req, res) => {
  try {
    const { 
      status, 
      rating, 
      sort = 'newest', 
      search,
      page = 1,
      limit = 20 
    } = req.query;

    // Build filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (rating) {
      filter.rating = parseInt(rating);
    }
    
    if (search) {
      filter.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { patientRefNo: { $regex: search, $options: 'i' } },
        { reviewText: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    let sortCriteria = {};
    switch (sort) {
      case 'newest':
        sortCriteria = { createdAt: -1 };
        break;
      case 'oldest':
        sortCriteria = { createdAt: 1 };
        break;
      case 'highest':
        sortCriteria = { rating: -1, createdAt: -1 };
        break;
      case 'lowest':
        sortCriteria = { rating: 1, createdAt: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }

    const limitNum = parseInt(limit);
    const skip = (parseInt(page) - 1) * limitNum;

    const reviews = await Review.find(filter)
      .sort(sortCriteria)
      .limit(limitNum)
      .skip(skip)
      .lean();

    const totalReviews = await Review.countDocuments(filter);

    // Get counts by status
    const statusCounts = await Review.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      approved: 0,
      pending: 0,
      rejected: 0
    };

    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    // Get average rating
    const stats = await Review.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    res.json({
      success: true,
      reviews,
      totalReviews,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / limitNum),
      counts,
      averageRating: stats[0]?.averageRating 
        ? Math.round(stats[0].averageRating * 10) / 10 
        : 0
    });

  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews'
    });
  }
};

// Update review status (approve/reject)
exports.updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "approved" or "rejected"'
      });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: req.user?.name || 'Admin',
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Emit socket event
    if (global.io) {
      global.io.emit('reviewStatusUpdated', {
        reviewId: review._id,
        status: review.status
      });
    }

    res.json({
      success: true,
      message: `Review ${status} successfully`,
      review
    });

  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review'
    });
  }
};

// Delete review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Emit socket event
    if (global.io) {
      global.io.emit('reviewDeleted', { reviewId: id });
    }

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
};

// Get review settings
exports.getReviewSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne({ filterType: 'results' });
    
    if (!settings) {
      settings = await SystemSettings.create({ filterType: 'results' });
    }

    res.json({
      success: true,
      settings: {
        reviewsEnabled: settings.reviewsEnabled,
        reviewsRequireApproval: settings.reviewsRequireApproval,
        reviewsShowReviewerName: settings.reviewsShowReviewerName
      }
    });

  } catch (error) {
    console.error('Get review settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
};

// Update review settings
exports.updateReviewSettings = async (req, res) => {
  try {
    const { reviewsEnabled, reviewsRequireApproval, reviewsShowReviewerName } = req.body;

    const updateData = {
      updatedBy: req.user?.name || 'Admin',
      updatedAt: new Date()
    };

    if (reviewsEnabled !== undefined) {
      updateData.reviewsEnabled = reviewsEnabled;
    }

    if (reviewsRequireApproval !== undefined) {
      updateData.reviewsRequireApproval = reviewsRequireApproval;
    }

    if (reviewsShowReviewerName !== undefined) {
      updateData.reviewsShowReviewerName = reviewsShowReviewerName;
    }

    const settings = await SystemSettings.findOneAndUpdate(
      { filterType: 'results' },
      updateData,
      { new: true, upsert: true }
    );

    // Emit socket event
    if (global.io) {
      global.io.emit('reviewSettingsUpdated', {
        reviewsEnabled: settings.reviewsEnabled,
        reviewsRequireApproval: settings.reviewsRequireApproval,
        reviewsShowReviewerName: settings.reviewsShowReviewerName
      });
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: {
        reviewsEnabled: settings.reviewsEnabled,
        reviewsRequireApproval: settings.reviewsRequireApproval,
        reviewsShowReviewerName: settings.reviewsShowReviewerName
      }
    });

  } catch (error) {
    console.error('Update review settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};