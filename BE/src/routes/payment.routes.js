import express from 'express';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import {
  createServicePaymentLink,
  getServicePaymentStatus,
  createBookingPaymentLink,
  getBookingPaymentStatus,
  handleWebhook,
} from '../controllers/payment.controller.js';

const router = express.Router();

// ─── Service Order ────────────────────────────────────────────────────────────
router.post('/service/:orderId',        protect, authorizeRoles('tenant'), createServicePaymentLink);
router.get('/service/:orderId/status',  protect, authorizeRoles('tenant'), getServicePaymentStatus);

// ─── Booking ──────────────────────────────────────────────────────────────────
router.post('/booking/:bookingId',       protect, authorizeRoles('tenant'), createBookingPaymentLink);
router.get('/booking/:bookingId/status', protect, authorizeRoles('tenant'), getBookingPaymentStatus);

// ─── PayOS Webhook — không cần auth ──────────────────────────────────────────
router.post('/webhook', handleWebhook);

export default router;
