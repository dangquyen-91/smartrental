import * as paymentService from '../services/payment.service.js';
import * as subService from '../services/subscription.service.js';
import User from '../models/user.model.js';
import * as R from '../utils/response.js';

// ─── Service Order ────────────────────────────────────────────────────────────

const createServicePaymentLink = async (req, res, next) => {
  try {
    const result = await paymentService.createServicePaymentLink(
      req.params.orderId,
      req.user.id,
    );
    return R.success(res, result, 'Payment link created');
  } catch (err) {
    next(err);
  }
};

const getServicePaymentStatus = async (req, res, next) => {
  try {
    const result = await paymentService.getServicePaymentStatus(
      req.params.orderId,
      req.user.id,
    );
    return R.success(res, result);
  } catch (err) {
    next(err);
  }
};

// ─── Booking ──────────────────────────────────────────────────────────────────

const createBookingPaymentLink = async (req, res, next) => {
  try {
    const result = await paymentService.createBookingPaymentLink(
      req.params.bookingId,
      req.user.id,
    );
    return R.success(res, result, 'Booking payment link created');
  } catch (err) {
    next(err);
  }
};

const getBookingPaymentStatus = async (req, res, next) => {
  try {
    const result = await paymentService.getBookingPaymentStatus(
      req.params.bookingId,
      req.user.id,
    );
    return R.success(res, result);
  } catch (err) {
    next(err);
  }
};

// ─── Webhook ──────────────────────────────────────────────────────────────────

const handleWebhook = async (req, res) => {
  try {
    const result = await paymentService.handleWebhook(req.body);
    return res.json(result);
  } catch (err) {
    return res.json({ rspCode: '99', message: err.message });
  }
};

const createSubscriptionPaymentLink = async (req, res, next) => {
  try {
    await subService.getOrCreateSubscription(req.user.id);
    const landlord = await User.findById(req.user.id).select('name email phone');
    const result = await paymentService.createSubscriptionPaymentLink(
      req.params.planKey,
      req.user.id,
      { name: landlord.name, email: landlord.email, phone: landlord.phone },
    );
    return R.success(res, result, 'Subscription payment link created');
  } catch (err) { next(err); }
};

const getSubscriptionPaymentStatus = async (req, res, next) => {
  try {
    const result = await paymentService.getSubscriptionPaymentStatus(req.user.id);
    return R.success(res, result);
  } catch (err) { next(err); }
};

export {
  createServicePaymentLink,
  getServicePaymentStatus,
  createBookingPaymentLink,
  getBookingPaymentStatus,
  createSubscriptionPaymentLink,
  getSubscriptionPaymentStatus,
  handleWebhook,
};
