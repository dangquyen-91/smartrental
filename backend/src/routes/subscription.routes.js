import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { getPlans, getMySubscription, subscribeToPlan } from '../controllers/subscription.controller.js';

const router = express.Router();

// ─── Plans — public ───────────────────────────────────────────────────────────
router.get('/plans', getPlans);

// ─── Landlord ─────────────────────────────────────────────────────────────────
router.get('/my',                  protect, authorizeRoles('landlord', 'admin'), getMySubscription);
router.post('/subscribe/:planId',  protect, authorizeRoles('landlord'), subscribeToPlan);

export default router;
