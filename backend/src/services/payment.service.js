import { randomInt } from 'crypto';
import mongoose from 'mongoose';
import payos from '../config/payos.js';
import ServiceOrder from '../models/service-order.model.js';
import Booking from '../models/booking.model.js';
import Subscription from '../models/subscription.model.js';
import Plan from '../models/plan.model.js';
import AppError from '../utils/app-error.js';
import { getLandlordCommissionRate, restoreHiddenListings, hideExcessListings } from './subscription.service.js';

const PLATFORM_FEE_RATE = 0.10;

const calcFees = (price) => ({
  platformFee:    Math.round(price * PLATFORM_FEE_RATE),
  providerPayout: Math.round(price * (1 - PLATFORM_FEE_RATE)),
});

// ─── Helpers PayOS ────────────────────────────────────────────────────────────

const cancelOldPayosLink = async (oldCode) => {
  if (!oldCode) return;
  try {
    await payos.paymentRequests.cancel(oldCode, 'Replaced by new payment link');
  } catch {
    // Bỏ qua nếu link cũ đã expired
  }
};

// Tạo PayOS payment request và trả về checkoutUrl.
// description tự động cắt ≤25 ký tự theo giới hạn PayOS.
const buildPayosLink = async ({ orderCode, amount, description, buyer, items, returnUrl, cancelUrl, ttlMinutes = 15 }) => {
  return payos.paymentRequests.create({
    orderCode,
    amount,
    description:  description.slice(0, 25),
    returnUrl,
    cancelUrl,
    expiredAt:    Math.floor(Date.now() / 1000) + ttlMinutes * 60,
    buyerName:    buyer.name,
    buyerEmail:   buyer.email,
    buyerPhone:   buyer.phone || undefined,
    items,
  });
};

const genOrderCode = () => randomInt(1, 281474976710655);

// ─── SERVICE ORDER — Tạo link thanh toán ─────────────────────────────────────

const createServicePaymentLink = async (orderId, tenantId) => {
  const order = await ServiceOrder.findOne({ _id: orderId, tenant: tenantId })
    .populate('tenant', 'name email phone');
  if (!order) throw new AppError('Service order not found', 404);
  if (order.paymentStatus === 'paid') throw new AppError('Order already paid', 400);
  if (order.status !== 'confirmed') {
    throw new AppError('Service order must be confirmed by landlord before payment', 400);
  }

  await cancelOldPayosLink(order.paymentCode);

  const orderCode = genOrderCode();
  const response  = await buildPayosLink({
    orderCode,
    amount:      order.price,
    description: `SR-${order.type.toUpperCase()}`,
    buyer:       order.tenant,
    items:       [{ name: order.type, quantity: 1, price: order.price }],
    returnUrl:   process.env.PAYOS_SERVICE_RETURN_URL || process.env.PAYOS_RETURN_URL,
    cancelUrl:   process.env.PAYOS_SERVICE_CANCEL_URL || process.env.PAYOS_CANCEL_URL,
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

  // Tự đồng bộ từ trạng thái thật của PayOS (phòng khi webhook không tới — vd backend chạy localhost).
  if (info.status === 'PAID' && order.paymentStatus !== 'paid') {
    const { platformFee, providerPayout } = calcFees(order.price);
    const result = await ServiceOrder.updateOne(
      { _id: order._id, paymentStatus: { $ne: 'paid' } },
      { $set: { paymentStatus: 'paid', platformFee, providerPayout, payoutStatus: 'pending' } },
    );
    if (result.modifiedCount > 0) order.paymentStatus = 'paid';
  }

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
    .populate('property', 'title price owner');
  if (!booking) throw new AppError('Booking not found', 404);

  if (booking.status !== 'active') {
    throw new AppError('Tenant can only pay after the landlord has done check-in', 400);
  }
  if (booking.paymentStatus === 'paid') {
    throw new AppError('Booking already paid', 400);
  }

  await cancelOldPayosLink(booking.paymentCode);

  const firstMonth     = booking.property.price;
  // Commission rate phụ thuộc vào gói subscription của landlord
  const commissionRate = await getLandlordCommissionRate(booking.property.owner.toString());
  const platformFee    = Math.round(firstMonth * commissionRate);
  const landlordPayout = firstMonth - platformFee;
  const orderCode      = genOrderCode();

  const response = await buildPayosLink({
    orderCode,
    amount:      firstMonth,
    description: 'SR-BOOKING',
    buyer:       booking.tenant,
    items:       [{ name: 'Thang dau tien', quantity: 1, price: firstMonth }],
    returnUrl:   process.env.PAYOS_RETURN_URL,
    cancelUrl:   process.env.PAYOS_CANCEL_URL,
  });

  booking.paymentCode    = orderCode;
  booking.platformFee    = platformFee;
  booking.landlordPayout = landlordPayout;
  await booking.save();

  return { checkoutUrl: response.checkoutUrl, orderCode, amount: firstMonth, platformFee, landlordPayout };
};

// ─── BOOKING — Kiểm tra trạng thái ───────────────────────────────────────────

const getBookingPaymentStatus = async (bookingId, tenantId) => {
  const booking = await Booking.findOne({ _id: bookingId, tenant: tenantId });
  if (!booking)             throw new AppError('Booking not found', 404);
  if (!booking.paymentCode) throw new AppError('Payment not initiated yet', 400);

  const info = await payos.paymentRequests.get(booking.paymentCode);

  // Tự đồng bộ từ trạng thái thật của PayOS (phòng khi webhook không tới — vd backend chạy localhost).
  // Idempotent: chỉ cập nhật khi PayOS đã PAID mà DB chưa paid và booking còn ở trạng thái thanh toán được.
  if (
    info.status === 'PAID' &&
    booking.paymentStatus !== 'paid' &&
    ['confirmed', 'active'].includes(booking.status)
  ) {
    const result = await Booking.updateOne(
      { _id: booking._id, paymentStatus: { $ne: 'paid' }, status: { $in: ['confirmed', 'active'] } },
      { $set: { paymentStatus: 'paid', paidDate: new Date(), payoutStatus: 'pending' } },
    );
    if (result.modifiedCount > 0) booking.paymentStatus = 'paid';
  }

  return {
    orderCode:      info.orderCode,
    status:         info.status,
    amount:         info.amount,
    transactions:   info.transactions,
    paymentStatus:  booking.paymentStatus,
    platformFee:    booking.platformFee,
    landlordPayout: booking.landlordPayout,
  };
};

// ─── WEBHOOK — Xử lý callback từ PayOS ───────────────────────────────────────

const handleWebhook = async (body) => {
  console.log('[webhook] raw body:', JSON.stringify(body));
  let data;
  try {
    data = await payos.webhooks.verify(body);
  } catch (err) {
    console.log('[webhook] verify failed:', err.message);
    return { rspCode: '97', message: 'Invalid signature' };
  }

  console.log('[webhook] verified data:', JSON.stringify(data));
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
      if (!['confirmed', 'active'].includes(booking.status)) {
        await session.abortTransaction();
        return { rspCode: '02', message: `Booking not payable — status: ${booking.status}` };
      }
      const result = await Booking.updateOne(
        { _id: booking._id, paymentStatus: { $ne: 'paid' }, status: { $in: ['confirmed', 'active'] } },
        { $set: { paymentStatus: 'paid', paidDate: new Date(), payoutStatus: 'pending' } },
        { session },
      );
      await session.commitTransaction();
      if (result.modifiedCount === 0) return { rspCode: '02', message: 'Already paid' };
      return { rspCode: '00', message: 'Booking payment confirmed' };
    }

    // Subscription payment
    const sub = await Subscription.findOne({ paymentCode: orderCode }).populate('landlord plan').session(session);
    if (sub) {
      // Ưu tiên planKey đã lưu (chính xác), fallback match theo giá
      const paidPlan = await Plan.findOne(
        sub.pendingPlanKey ? { key: sub.pendingPlanKey } : { price: data.amount },
      ).session(session);
      if (!paidPlan) {
        await session.abortTransaction();
        return { rspCode: '01', message: 'Plan not found for amount' };
      }

      const now     = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await Subscription.updateOne(
        { _id: sub._id },
        { $set: { plan: paidPlan._id, status: 'active', startDate: now, endDate, paymentCode: null, pendingPlanKey: null } },
        { session },
      );
      await session.commitTransaction();

      // Restore listings ẩn khi upgrade (ngoài transaction)
      await restoreHiddenListings(sub.landlord._id || sub.landlord);
      // Nếu limit mới nhỏ hơn số listing hiện tại (downgrade) → ẩn thừa
      if (paidPlan.listingLimit !== -1) {
        await hideExcessListings(sub.landlord._id || sub.landlord, paidPlan.listingLimit);
      }

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

// ─── SUBSCRIPTION — Tạo link thanh toán mua gói ─────────────────────────────

const createSubscriptionPaymentLink = async (planKey, landlordId, landlordUser) => {
  const plan = await Plan.findOne({ key: planKey });
  if (!plan) throw new AppError('Plan not found', 404);
  if (plan.price === 0) throw new AppError('Free plan does not require payment', 400);

  const orderCode = genOrderCode();
  const response  = await buildPayosLink({
    orderCode,
    amount:      plan.price,
    description: `SR-PLAN-${plan.key.toUpperCase()}`,
    buyer:       landlordUser,
    items:       [{ name: plan.name, quantity: 1, price: plan.price }],
    returnUrl:   process.env.PAYOS_PLAN_RETURN_URL || process.env.PAYOS_RETURN_URL,
    cancelUrl:   process.env.PAYOS_PLAN_CANCEL_URL || process.env.PAYOS_CANCEL_URL,
    ttlMinutes:  30,
  });

  // Lưu orderCode + planKey vào subscription (pending) để webhook/self-sync biết kích hoạt gói nào
  await Subscription.findOneAndUpdate(
    { landlord: landlordId },
    { paymentCode: orderCode, pendingPlanKey: plan.key },
    { upsert: false },
  );

  return { checkoutUrl: response.checkoutUrl, orderCode, planKey, amount: plan.price };
};

// ─── SUBSCRIPTION — Kiểm tra trạng thái + tự kích hoạt ──────────────────────
// Tự đồng bộ từ PayOS (phòng khi webhook không tới — vd backend chạy localhost).
// Idempotent: chỉ kích hoạt khi PayOS đã PAID và subscription còn paymentCode đang chờ.
const getSubscriptionPaymentStatus = async (landlordId) => {
  const sub = await Subscription.findOne({ landlord: landlordId });
  if (!sub) throw new AppError('Subscription not found', 404);
  if (!sub.paymentCode) {
    return { status: 'NO_PENDING', activated: false };
  }

  const info = await payos.paymentRequests.get(sub.paymentCode);
  let activated = false;

  if (info.status === 'PAID') {
    const paidPlan = await Plan.findOne(
      sub.pendingPlanKey ? { key: sub.pendingPlanKey } : { price: info.amount },
    );
    if (paidPlan) {
      const now     = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const result  = await Subscription.updateOne(
        { _id: sub._id, paymentCode: sub.paymentCode },
        { $set: { plan: paidPlan._id, status: 'active', startDate: now, endDate, paymentCode: null, pendingPlanKey: null } },
      );
      if (result.modifiedCount > 0) {
        activated = true;
        await restoreHiddenListings(landlordId);
        if (paidPlan.listingLimit !== -1) await hideExcessListings(landlordId, paidPlan.listingLimit);
      }
    }
  }

  return { orderCode: info.orderCode, status: info.status, amount: info.amount, activated };
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
