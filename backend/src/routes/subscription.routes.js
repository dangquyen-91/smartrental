import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { getPlans, getMySummary } from '../controllers/subscription.controller.js';

const router = express.Router();

// Public: danh sách gói
router.get('/plans', getPlans);

// Landlord: subscription hiện tại + listing count + days left
router.get('/my', protect, authorizeRoles('landlord'), getMySummary);

export default router;
