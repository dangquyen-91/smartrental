/**
 * Review Routes
 *
 * Public:
 *   GET /api/reviews/property/:id              → Reviews for a property
 *
 * Authenticated (tenant only):
 *   POST /api/reviews                          → Submit a property review (booking must be completed)
 *   GET  /api/reviews/mine                     → Reviews I have written
 *   GET  /api/reviews/booking/:id              → All reviews for a specific booking
 *
 * Authenticated (landlord only):
 *   GET  /api/reviews/landlord/my-properties   → All reviews across landlord's properties
 *
 * Admin:
 *   GET    /api/reviews                        → List all reviews (with filters)
 *   DELETE /api/reviews/:id                    → Soft-delete a review
 */
import { Router } from 'express';
import * as reviewController from '../controllers/review.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  createReviewValidation,
  idParamValidation,
  getReviewsValidation,
} from '../validators/review.validator.js';

const router = Router();

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/property/:id', idParamValidation, getReviewsValidation, reviewController.getPropertyReviews);

// ── Protected ─────────────────────────────────────────────────────────────────
router.use(protect);

router.post(
  '/',
  authorizeRoles('tenant'),
  createReviewValidation,
  reviewController.createReview,
);

router.get('/mine',        getReviewsValidation, reviewController.getMyReviews);
router.get('/booking/:id', idParamValidation,    reviewController.getBookingReviews);

// Landlord: all reviews across all their properties (must be before /:id)
router.get(
  '/landlord/my-properties',
  authorizeRoles('landlord'),
  getReviewsValidation,
  reviewController.getMyPropertiesReviews,
);

// ── Admin ─────────────────────────────────────────────────────────────────────
router.get(
  '/',
  authorizeRoles('admin'),
  getReviewsValidation,
  reviewController.getAllReviews,
);

router.delete(
  '/:id',
  authorizeRoles('admin'),
  idParamValidation,
  reviewController.deleteReview,
);

export default router;
