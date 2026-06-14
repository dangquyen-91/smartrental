import * as reviewService from '../services/review.service.js';
import * as R from '../utils/response.js';

// ─── POST /api/reviews ────────────────────────────────────────────────────────
// Tenant: can review 'property' or 'landlord'
// Landlord: can review 'tenant'

const createReview = async (req, res, next) => {
  try {
    const review = await reviewService.createReview(
      req.user.id,
      req.user.role, // derived from JWT — 'tenant' or 'landlord'
      req.body,
    );
    return R.created(res, { review }, 'Review submitted successfully');
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews/property/:id ───────────────────────────────────────────
// Public — reviews for a specific property

const getPropertyReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getPropertyReviews(req.params.id, req.query);
    return res.status(200).json({ success: true, message: 'Success', ...result });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews/user/:id ────────────────────────────────────────────────
// Public — reviews about a user (as landlord and/or tenant)
// ?targetType=landlord  →  only landlord reviews
// ?targetType=tenant    →  only tenant reviews
// (no targetType)       →  all

const getUserReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getUserReviews(req.params.id, req.query);
    return res.status(200).json({ success: true, message: 'Success', ...result });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews/booking/:id ─────────────────────────────────────────────
// Auth — all reviews tied to a specific booking (tenant + landlord can see own booking reviews)

const getBookingReviews = async (req, res, next) => {
  try {
    const reviews = await reviewService.getBookingReviews(
      req.params.id,
      req.user.id,
      req.user.role,
    );
    return R.success(res, { reviews });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews/mine ────────────────────────────────────────────────────
// Auth — reviews I have written

const getMyReviews = async (req, res, next) => {
  try {
    const { reviews, pagination } = await reviewService.getMyReviews(req.user.id, req.query);
    return R.paginated(res, reviews, pagination);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews/about-me ────────────────────────────────────────────────
// Auth — reviews written about me (as landlord or tenant)

const getReviewsAboutMe = async (req, res, next) => {
  try {
    const result = await reviewService.getUserReviews(req.user.id, req.query);
    return res.status(200).json({ success: true, message: 'Success', ...result });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews/landlord/my-properties ─────────────────────────────────
// Landlord — all reviews across all properties they own

const getMyPropertiesReviews = async (req, res, next) => {
  try {
    const result = await reviewService.getMyPropertiesReviews(req.user.id, req.query);
    return res.status(200).json({ success: true, message: 'Success', ...result });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/reviews (admin) ─────────────────────────────────────────────────

const getAllReviews = async (req, res, next) => {
  try {
    const { data, pagination } = await reviewService.getAllReviews(req.query);
    return R.paginated(res, data, pagination);
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/reviews/:id (admin) ─────────────────────────────────────────

const deleteReview = async (req, res, next) => {
  try {
    const review = await reviewService.deleteReview(req.params.id, req.user.id);
    return R.success(res, { review }, 'Review deleted successfully');
  } catch (err) {
    next(err);
  }
};

export {
  createReview,
  getPropertyReviews,
  getUserReviews,
  getBookingReviews,
  getMyReviews,
  getMyPropertiesReviews,
  getReviewsAboutMe,
  getAllReviews,
  deleteReview,
};
