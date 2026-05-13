import express from 'express';
import {
  upsertProfile,
  getMyProfile,
  getUserProfile,
  deleteMyProfile,
  getMatches,
  explainMatch,
  sendRequest,
  respondRequest,
  cancelRequest,
  getMyRequests,
} from '../controllers/roommate.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { mongoId } from '../validators/common.validator.js';
import validate from '../middleware/validate.middleware.js';
import {
  upsertProfileValidation,
  sendRequestValidation,
  respondRequestValidation,
  getRequestsValidation,
  getMatchesValidation,
} from '../validators/roommate.validator.js';

const router = express.Router();

// All roommate routes require authentication
router.use(protect);

// ─── Profile ─────────────────────────────────────────────────────────────────

// Create or update roommate profile
router.post('/profile', upsertProfileValidation, upsertProfile);

// Get own roommate profile
router.get('/profile/me', getMyProfile);

// Get another user's roommate profile (for accepted matches)
router.get('/profile/:userId', validate([mongoId('userId')]), getUserProfile);

// Delete own roommate profile
router.delete('/profile/me', deleteMyProfile);

// ─── Matching ─────────────────────────────────────────────────────────────────

// Get suggested roommate matches (scored algorithm)
router.get('/matches', getMatchesValidation, getMatches);

// Get AI explanation of compatibility with a specific user
router.get('/matches/:userId/explain', validate([mongoId('userId')]), explainMatch);

// ─── Requests ────────────────────────────────────────────────────────────────

// Get sent or received requests
router.get('/requests', getRequestsValidation, getMyRequests);

// Send a roommate request to another user
router.post('/request/:userId', sendRequestValidation, sendRequest);

// Accept or reject a received request
router.patch('/request/:id/respond', respondRequestValidation, respondRequest);

// Cancel a sent request
router.patch('/request/:id/cancel', validate([mongoId('id')]), cancelRequest);

export default router;
