import Booking from '../models/booking.model.js';
import Property from '../models/property.model.js';
import AppError from '../utils/app-error.js';

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
  const booking = await Booking.findById(id);
  if (!booking) throw new AppError('Booking not found', 404);

  if (booking.landlord.toString() !== landlordId) {
    throw new AppError('Access denied', 403);
  }

  if (booking.status !== 'pending') {
    throw new AppError(`Cannot confirm a booking with status "${booking.status}"`, 400);
  }

  booking.status = 'confirmed';
  await booking.save();

  // Auto-reject all other pending bookings for the same property
  await Booking.updateMany(
    { property: booking.property, status: 'pending', _id: { $ne: booking._id } },
    { status: 'rejected', rejectionReason: 'Another booking has been confirmed by the landlord' },
  );

  // Mark property as rented
  await Property.findByIdAndUpdate(booking.property, { status: 'rented' });

  return booking;
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
  const booking = await Booking.findById(id);
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

  booking.status = 'cancelled';
  booking.cancelledBy = cancelledBy;
  booking.cancelReason = reason || null;
  await booking.save();

  // Revert property to available if booking was confirmed or active
  if (wasConfirmedOrActive) {
    await Property.findByIdAndUpdate(booking.property, { status: 'available' });
  }

  return booking;
};

// ─── Complete Booking (landlord / admin) ────────────────────────────────────

const completeBooking = async (id, userId, userRole) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new AppError('Booking not found', 404);

  const isLandlord = booking.landlord.toString() === userId;
  if (userRole !== 'admin' && !isLandlord) {
    throw new AppError('Access denied', 403);
  }

  if (booking.status !== 'active') {
    throw new AppError(`Cannot complete a booking with status "${booking.status}"`, 400);
  }

  booking.status = 'completed';
  await booking.save();

  // Revert property to available
  await Property.findByIdAndUpdate(booking.property, { status: 'available' });

  return booking;
};

// ─── Activate Booking (landlord / admin) ────────────────────────────────────

const activateBooking = async (id, userId, userRole) => {
  const booking = await Booking.findById(id);
  if (!booking) throw new AppError('Booking not found', 404);

  const isLandlord = booking.landlord.toString() === userId;
  if (userRole !== 'admin' && !isLandlord) {
    throw new AppError('Access denied', 403);
  }

  if (booking.status !== 'confirmed') {
    throw new AppError(`Cannot activate a booking with status "${booking.status}"`, 400);
  }

  booking.status = 'active';
  await booking.save();

  return booking;
};

export {
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
};
