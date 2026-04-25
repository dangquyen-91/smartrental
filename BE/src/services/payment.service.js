import { randomInt } from 'crypto';
import mongoose from 'mongoose';
import payos from '../config/payos.js';
import ServiceOrder from '../models/service-order.model.js';
import Booking from '../models/booking.model.js';
import Subscription from '../models/subscription.model.js';
import AppError from '../utils/app-error.js';
import { activateSubscription } from './subscription.service.js';

const PLATFORM_FEE_RATE = 0.10;
const DEPOSIT_RATE      = 1;

const calcFees = (price) => ({
  platformFee:    Math.round(price * PLATFORM_FEE_RATE),
  providerPayout: Math.round(price * (1 - PLATFORM_FEE_RATE)),
});

// ─── Huỷ link PayOS cũ trước khi tạo link mới ────────────────────────────────

const cancelOldPayosLink = async (oldCode) => {
  if (!oldCode) return;
  try {
    await payos.paymentRequests.cancel(oldCode, 'Replaced by new payment link');
  } catch {
    // Bỏ qua nếu link cũ đã expired
  }
};

// ─── SERVICE ORDER — Tạo link thanh toán ─────────────────────────────────────

const createServicePaymentLink = async (orderId, tenantId) => {
  const order = await ServiceOrder.findOne({ _id: orderId, tenant: tenantId })
    .populate('tenant', 'name email phone');
  if (!order) throw new AppError('Service order not found', 404);
  if (order.paymentStatus === 'paid')   throw new AppError('Order already paid', 400);
  if (order.status === 'cancelled')     throw new AppError('Cannot pay for a cancelled order', 400);

  await cancelOldPayosLink(order.paymentCode);

  const orderCode = randomInt(1, 281474976710655);

  const response = await payos.paymentRequests.create({
    orderCode,
    amount:      order.price,
    description: `SR-${order.type.toUpperCase()}`.slice(0, 25),
    returnUrl:   process.env.PAYOS_RETURN_URL,
    cancelUrl:   process.env.PAYOS_CANCEL_URL,
    expiredAt:   Math.floor(Date.now() / 1000) + 15 * 60,
    buyerName:   order.tenant.name,
    buyerEmail:  order.tenant.email,
    buyerPhone:  order.tenant.phone || undefined,
    items: [{ name: order.type, quantity: 1, price: order.price }],
  });

  order.paymentCode = orderCode;
  await order.save();

  return { checkoutUrl: response.checkoutUrl, orderCode, amount: order.price };
};

// ─── SERVICE ORDER — Kiểm tra trạng thái ─────────────────────────────────────

const getServicePaymentStatus = async (orderId, tenantId) => {
  const order = await ServiceOrder.findOne({ _id: orderId, tenant: tenantId });
  if (!order)             throw new AppError('Service order not found', 404);
  if (!order.paymentCode) throw new AppError('Payment not initiated yet', 400);

  const info = await payos.paymentRequests.get(order.paymentCode);

  return {
    orderCode:     info.orderCode,
    status:        info.status,
    amount:        info.amount,
    transactions:  info.transactions,
    paymentStatus: order.paymentStatus,
  };
};

// ─── BOOKING — Tạo link thanh toán ───────────────────────────────────────────

const createBookingPaymentLink = async (bookingId, tenantId) => {
  const booking = await Booking.findOne({ _id: bookingId, tenant: tenantId })
    .populate('tenant', 'name email phone')
    .populate('property', 'title price');
  if (!booking) throw new AppError('Booking not found', 404);

  if (booking.status !== 'confirmed') {
    throw new AppError('Booking must be confirmed by landlord before payment', 400);
  }
  if (booking.paymentStatus === 'paid') {
    throw new AppError('Booking already paid', 400);
  }

  await cancelOldPayosLink(booking.paymentCode);

  const depositAmount = booking.property.price * DEPOSIT_RATE;
  const firstMonth    = booking.property.price;
  const amount        = depositAmount + firstMonth;
  const orderCode     = randomInt(1, 281474976710655);

  const response = await payos.paymentRequests.create({
    orderCode,
    amount,
    description: 'SR-BOOKING',
    returnUrl:   process.env.PAYOS_RETURN_URL,
    cancelUrl:   process.env.PAYOS_CANCEL_URL,
    expiredAt:   Math.floor(Date.now() / 1000) + 15 * 60,
    buyerName:   booking.tenant.name,
    buyerEmail:  booking.tenant.email,
    buyerPhone:  booking.tenant.phone || undefined,
    items: [
      { name: 'Tien coc',       quantity: 1, price: depositAmount },
      { name: 'Thang dau tien', quantity: 1, price: firstMonth },
    ],
  });

  booking.paymentCode   = orderCode;
  booking.depositAmount = depositAmount;
  await booking.save();

  return { checkoutUrl: response.checkoutUrl, orderCode, amount, depositAmount, firstMonth };
};

// ─── BOOKING — Kiểm tra trạng thái ───────────────────────────────────────────

const getBookingPaymentStatus = async (bookingId, tenantId) => {
  const booking = await Booking.findOne({ _id: bookingId, tenant: tenantId });
  if (!booking)             throw new AppError('Booking not found', 404);
  if (!booking.paymentCode) throw new AppError('Payment not initiated yet', 400);

  const info = await payos.paymentRequests.get(booking.paymentCode);

  return {
    orderCode:     info.orderCode,
    status:        info.status,
    amount:        info.amount,
    transactions:  info.transactions,
    paymentStatus: booking.paymentStatus,
    depositAmount: booking.depositAmount,
  };
};

// ─── WEBHOOK — Xử lý callback từ PayOS ───────────────────────────────────────

const handleWebhook = async (body) => {
  let data;
  try {
    data = await payos.webhooks.verify(body);
  } catch {
    return { rspCode: '97', message: 'Invalid signature' };
  }

  const { orderCode, code } = data;
  if (code !== '00') {
    return { rspCode: '00', message: `Payment not successful — code: ${code}` };
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const serviceOrder = await ServiceOrder.findOne({ paymentCode: orderCode }).session(session);
    if (serviceOrder) {
      const { platformFee, providerPayout } = calcFees(serviceOrder.price);
      // $ne filter + modifiedCount check = idempotent even under concurrent webhook calls
      const result = await ServiceOrder.updateOne(
        { _id: serviceOrder._id, paymentStatus: { $ne: 'paid' } },
        { $set: { paymentStatus: 'paid', platformFee, providerPayout, payoutStatus: 'pending' } },
        { session },
      );
      await session.commitTransaction();
      if (result.modifiedCount === 0) return { rspCode: '02', message: 'Already paid' };
      return { rspCode: '00', message: 'Service order payment confirmed' };
    }

    const booking = await Booking.findOne({ paymentCode: orderCode }).session(session);
    if (booking) {
      // Fee chỉ tính trên firstMonth, không tính trên tiền cọc
      const firstMonth     = booking.depositAmount; // DEPOSIT_RATE=1 → deposit = firstMonth
      const platformFee    = Math.round(firstMonth * PLATFORM_FEE_RATE);
      const landlordPayout = booking.depositAmount + firstMonth - platformFee;
      const result = await Booking.updateOne(
        { _id: booking._id, paymentStatus: { $ne: 'paid' } },
        { $set: { paymentStatus: 'paid', paidDate: new Date(), platformFee, landlordPayout, payoutStatus: 'pending' } },
        { session },
      );
      await session.commitTransaction();
      if (result.modifiedCount === 0) return { rspCode: '02', message: 'Already paid' };
      return { rspCode: '00', message: 'Booking payment confirmed' };
    }

    const subscription = await Subscription.findOne({ paymentCode: orderCode }).session(session);
    if (subscription) {
      const activated = await activateSubscription(orderCode, session);
      await session.commitTransaction();
      if (!activated) return { rspCode: '02', message: 'Subscription already activated' };
      return { rspCode: '00', message: 'Subscription activated' };
    }

    await session.abortTransaction();
    return { rspCode: '01', message: 'Order not found' };

  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── SUBSCRIPTION — Tạo link thanh toán ──────────────────────────────────────

const createSubscriptionPaymentLink = async (subscriptionId, landlordId) => {
  const sub = await Subscription.findOne({ _id: subscriptionId, landlord: landlordId })
    .populate('plan')
    .populate('landlord', 'name email phone');
  if (!sub) throw new AppError('Subscription not found', 404);
  if (sub.paymentStatus === 'paid')    throw new AppError('Subscription already paid', 400);
  if (sub.status === 'cancelled')     throw new AppError('Subscription has been cancelled', 400);

  await cancelOldPayosLink(sub.paymentCode);

  const orderCode = randomInt(1, 281474976710655);

  const response = await payos.paymentRequests.create({
    orderCode,
    amount:      sub.plan.price,
    description: `SR-SUB-${sub.plan.slug.toUpperCase()}`.slice(0, 25),
    returnUrl:   process.env.PAYOS_RETURN_URL,
    cancelUrl:   process.env.PAYOS_CANCEL_URL,
    expiredAt:   Math.floor(Date.now() / 1000) + 30 * 60,
    buyerName:   sub.landlord.name,
    buyerEmail:  sub.landlord.email,
    buyerPhone:  sub.landlord.phone || undefined,
    items: [{ name: sub.plan.name, quantity: 1, price: sub.plan.price }],
  });

  sub.paymentCode = orderCode;
  await sub.save();

  return { checkoutUrl: response.checkoutUrl, orderCode, amount: sub.plan.price };
};

// ─── SUBSCRIPTION — Kiểm tra trạng thái ──────────────────────────────────────

const getSubscriptionPaymentStatus = async (subscriptionId, landlordId) => {
  const sub = await Subscription.findOne({ _id: subscriptionId, landlord: landlordId })
    .populate('plan');
  if (!sub)             throw new AppError('Subscription not found', 404);
  if (!sub.paymentCode) throw new AppError('Payment not initiated yet', 400);

  const info = await payos.paymentRequests.get(sub.paymentCode);

  return {
    orderCode:     info.orderCode,
    status:        info.status,
    amount:        info.amount,
    transactions:  info.transactions,
    paymentStatus: sub.paymentStatus,
    plan:          sub.plan,
  };
};

export {
  createServicePaymentLink,
  getServicePaymentStatus,
  createBookingPaymentLink,
  getBookingPaymentStatus,
  handleWebhook,
  createSubscriptionPaymentLink,
  getSubscriptionPaymentStatus,
};
