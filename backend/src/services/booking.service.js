import mongoose from 'mongoose';
import Booking from '../models/booking.model.js';
import Property from '../models/property.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';

// ─── Auto-expire unpaid confirmed bookings ───────────────────────────────────

const PAYMENT_DEADLINE_HOURS = 24;

const autoExpireBookings = async () => {
  const expired = await Booking.find({
    status: 'confirmed',
    paymentStatus: 'unpaid',
    paymentDeadline: { $lt: new Date(), $ne: null },
  }).select('_id property');

  if (!expired.length) return;

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const ids = expired.map((b) => b._id);
    const propertyIds = [...new Set(expired.map((b) => b.property.toString()))];

    await Booking.updateMany(
      { _id: { $in: ids } },
      { $set: { status: 'cancelled', cancelledBy: 'admin', cancelReason: 'Payment deadline exceeded' } },
      { session },
    );

    await Property.updateMany(
      { _id: { $in: propertyIds }, status: 'rented' },
      { $set: { status: 'available' } },
      { session },
    );

    await session.commitTransaction();
  } catch (err) {
    await session.abortTransaction();
    console.error('[autoExpireBookings]', err.message);
  } finally {
    session.endSession();
  }
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const buildPagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

// ─── Create Booking ──────────────────────────────────────────────────────────

const createBooking = async ({ property: propertyId, startDate, duration, note }, tenantId) => {
  const property = await Property.findOne({ _id: propertyId, isActive: true });
  if (!property) throw new AppError('Property not found', 404);

  if (property.owner.toString() === tenantId) {
    throw new AppError('You cannot book your own property', 400);
  }

  if (property.status !== 'available') {
    throw new AppError('Property is not available for booking', 400);
  }

  // Block only if a confirmed or active booking already exists
  const conflict = await Booking.findOne({
    property: propertyId,
    status: { $in: ['confirmed', 'active'] },
  });
  if (conflict) {
    throw new AppError('Property is already booked', 409);
  }

  const start = new Date(startDate);
  const end = addMonths(start, duration);
  const totalPrice = property.price * duration;

  return Booking.create({
    property: propertyId,
    tenant: tenantId,
    landlord: property.owner,
    startDate: start,
    endDate: end,
    duration,
    totalPrice,
    note: note || null,
  });
};

// ─── Get All Bookings (admin) ────────────────────────────────────────────────

const getAllBookings = async ({ status, page = 1, limit = 10 }) => {
  const filter = {};
  if (status) filter.status = status;

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('property', 'title address price type')
      .populate('tenant', 'name email phone avatar')
      .populate('landlord', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get My Bookings (tenant) ────────────────────────────────────────────────

const getMyBookings = async (tenantId, { status, page = 1, limit = 10 }) => {
  await autoExpireBookings();
  const filter = { tenant: tenantId };
  if (status) filter.status = status;

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('property', 'title address price type images')
      .populate('landlord', 'name phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get Landlord Bookings ───────────────────────────────────────────────────

const getLandlordBookings = async (landlordId, { status, page = 1, limit = 10 }) => {
  await autoExpireBookings();
  const filter = { landlord: landlordId };
  if (status) filter.status = status;

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('property', 'title address price type images')
      .populate('tenant', 'name phone avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments(filter),
  ]);

  return {
    bookings,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get Booking By ID ───────────────────────────────────────────────────────

const getBookingById = async (id, userId, userRole) => {
  const booking = await Booking.findById(id)
    .populate('property', 'title address price type images')
    .populate('tenant', 'name email phone avatar')
    .populate('landlord', 'name email phone avatar');

  if (!booking) throw new AppError('Booking not found', 404);

  const isOwner =
    booking.tenant._id.toString() === userId ||
    booking.landlord._id.toString() === userId;

  if (userRole !== 'admin' && !isOwner) {
    throw new AppError('Access denied', 403);
  }

  return booking;
};

// ─── Confirm Booking (landlord) ──────────────────────────────────────────────

const confirmBooking = async (id, landlordId) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Atomic status transition — only succeeds if booking is still 'pending'
    const paymentDeadline = new Date(Date.now() + PAYMENT_DEADLINE_HOURS * 60 * 60 * 1000);

    const booking = await Booking.findOneAndUpdate(
      { _id: id, landlord: landlordId, status: 'pending' },
      { $set: { status: 'confirmed', paymentDeadline } },
      { new: true, session },
    );

    if (!booking) {
      const exists = await Booking.findById(id).session(session);
      if (!exists) throw new AppError('Booking not found', 404);
      if (exists.landlord.toString() !== landlordId) throw new AppError('Access denied', 403);
      throw new AppError(`Cannot confirm a booking with status "${exists.status}"`, 400);
    }

    await Booking.updateMany(
      { property: booking.property, status: 'pending', _id: { $ne: booking._id } },
      { $set: { status: 'rejected', rejectionReason: 'Another booking has been confirmed by the landlord' } },
      { session },
    );

    await Property.findByIdAndUpdate(booking.property, { $set: { status: 'rented' } }, { session });

    await session.commitTransaction();
    return booking;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Reject Booking (landlord) ───────────────────────────────────────────────

const rejectBooking = async (id, landlordId, reason) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new AppError('Booking not found', 404);

  if (booking.landlord.toString() !== landlordId) {
    throw new AppError('Access denied', 403);
  }

  if (booking.status !== 'pending') {
    throw new AppError(`Cannot reject a booking with status "${booking.status}"`, 400);
  }

  booking.status = 'rejected';
  booking.rejectionReason = reason;
  await booking.save();

  return booking;
};

// ─── Cancel Booking (tenant / landlord / admin) ──────────────────────────────

const cancelBooking = async (id, userId, userRole, reason) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const booking = await Booking.findById(id).session(session);
    if (!booking) throw new AppError('Booking not found', 404);

    const isTenant = booking.tenant.toString() === userId;
    const isLandlord = booking.landlord.toString() === userId;

    if (userRole !== 'admin' && !isTenant && !isLandlord) {
      throw new AppError('Access denied', 403);
    }

    const cancellableStatuses = ['pending', 'confirmed'];
    if (userRole === 'admin') cancellableStatuses.push('active');

    if (!cancellableStatuses.includes(booking.status)) {
      throw new AppError(`Cannot cancel a booking with status "${booking.status}"`, 400);
    }

    const cancelledBy = isTenant ? 'tenant' : isLandlord ? 'landlord' : 'admin';
    const wasConfirmedOrActive = ['confirmed', 'active'].includes(booking.status);

    // Atomic update with status pre-condition to prevent double-cancel
    const updated = await Booking.findOneAndUpdate(
      { _id: id, status: { $in: cancellableStatuses } },
      { $set: { status: 'cancelled', cancelledBy, cancelReason: reason || null } },
      { new: true, session },
    );
    if (!updated) throw new AppError(`Cannot cancel a booking with status "${booking.status}"`, 409);

    if (wasConfirmedOrActive) {
      await Property.findByIdAndUpdate(booking.property, { $set: { status: 'available' } }, { session });
    }

    await session.commitTransaction();
    return updated;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Complete Booking (landlord / admin) ────────────────────────────────────

const completeBooking = async (id, userId, userRole) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const booking = await Booking.findById(id).session(session);
    if (!booking) throw new AppError('Booking not found', 404);

    const isLandlord = booking.landlord.toString() === userId;
    if (userRole !== 'admin' && !isLandlord) throw new AppError('Access denied', 403);
    if (booking.status !== 'active') {
      throw new AppError(`Cannot complete a booking with status "${booking.status}"`, 400);
    }

    // Atomic update with pre-condition
    const updated = await Booking.findOneAndUpdate(
      { _id: id, status: 'active' },
      { $set: { status: 'completed' } },
      { new: true, session },
    );
    if (!updated) throw new AppError(`Cannot complete a booking with status "${booking.status}"`, 409);

    await Property.findByIdAndUpdate(booking.property, { $set: { status: 'available' } }, { session });

    await session.commitTransaction();
    return updated;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Activate Booking (landlord / admin) ────────────────────────────────────

const activateBooking = async (id, userId, userRole) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const booking = await Booking.findById(id).session(session);
    if (!booking) throw new AppError('Booking not found', 404);

    const isLandlord = booking.landlord.toString() === userId;
    if (userRole !== 'admin' && !isLandlord) throw new AppError('Access denied', 403);
    if (booking.status !== 'confirmed') {
      throw new AppError(`Cannot activate a booking with status "${booking.status}"`, 400);
    }
    if (booking.paymentStatus !== 'paid') {
      throw new AppError('Tenant has not completed payment yet', 400);
    }

    // Atomic update — requires both status=confirmed AND paymentStatus=paid
    const updated = await Booking.findOneAndUpdate(
      { _id: id, status: 'confirmed', paymentStatus: 'paid' },
      { $set: { status: 'active' } },
      { new: true, session },
    );
    if (!updated) throw new AppError('Booking state changed before activation could complete', 409);

    await session.commitTransaction();
    return updated;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

// ─── Mark Refunded (admin) ───────────────────────────────────────────────────

const markRefunded = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);

  if (booking.status !== 'cancelled') {
    throw new AppError('Booking must be cancelled before marking as refunded', 400);
  }
  if (booking.paymentStatus !== 'paid') {
    throw new AppError('Booking has not been paid', 400);
  }
  if (booking.paymentStatus === 'refunded') {
    throw new AppError('Booking is already marked as refunded', 400);
  }

  booking.paymentStatus = 'refunded';
  await booking.save();
  return booking;
};

// ─── Mark Booking Payout (admin) ─────────────────────────────────────────────

const markBookingPayout = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);

  if (booking.paymentStatus !== 'paid') {
    throw new AppError('Booking has not been paid yet', 400);
  }
  if (booking.payoutStatus === 'paid') {
    throw new AppError('Payout already marked as paid', 400);
  }

  const landlord = await User.findById(booking.landlord).select('bankAccount');
  if (!landlord?.bankAccount?.accountNumber) {
    throw new AppError('Landlord has not set up bank account yet', 400);
  }

  booking.payoutStatus = 'paid';
  booking.payoutDate   = new Date();
  await booking.save();

  return booking;
};

export {
  autoExpireBookings,
  createBooking,
  getAllBookings,
  getMyBookings,
  getLandlordBookings,
  getBookingById,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  activateBooking,
  markRefunded,
  markBookingPayout,
};
