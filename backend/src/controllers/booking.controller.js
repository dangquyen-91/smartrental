import * as bookingService from '../services/booking.service.js';
import * as R from '../utils/response.js';

const createBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.body, req.user.id);
    return R.created(res, { booking }, 'Booking request submitted successfully');
  } catch (err) {
    next(err);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const { bookings, pagination } = await bookingService.getAllBookings(req.query);
    return R.paginated(res, bookings, pagination);
  } catch (err) {
    next(err);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const { bookings, pagination } = await bookingService.getMyBookings(req.user.id, req.query);
    return R.paginated(res, bookings, pagination);
  } catch (err) {
    next(err);
  }
};

const getLandlordBookings = async (req, res, next) => {
  try {
    const { bookings, pagination } = await bookingService.getLandlordBookings(req.user.id, req.query);
    return R.paginated(res, bookings, pagination);
  } catch (err) {
    next(err);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user.id, req.user.role);
    return R.success(res, { booking });
  } catch (err) {
    next(err);
  }
};

const confirmBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.confirmBooking(req.params.id, req.user.id);
    return R.success(res, { booking }, 'Booking confirmed successfully');
  } catch (err) {
    next(err);
  }
};

const rejectBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.rejectBooking(req.params.id, req.user.id, req.body.reason);
    return R.success(res, { booking }, 'Booking rejected');
  } catch (err) {
    next(err);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body?.reason,
    );
    return R.success(res, { booking }, 'Booking cancelled');
  } catch (err) {
    next(err);
  }
};

const markRefunded = async (req, res, next) => {
  try {
    const booking = await bookingService.markRefunded(req.params.id);
    return R.success(res, { booking }, 'Booking marked as refunded');
  } catch (err) {
    next(err);
  }
};

const activateBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.activateBooking(req.params.id, req.user.id, req.user.role);
    return R.success(res, { booking }, 'Booking activated — tenant has moved in');
  } catch (err) {
    next(err);
  }
};

const completeBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.completeBooking(req.params.id, req.user.id, req.user.role);
    return R.success(res, { booking }, 'Booking completed');
  } catch (err) {
    next(err);
  }
};

const markBookingPayout = async (req, res, next) => {
  try {
    const booking = await bookingService.markBookingPayout(req.params.id);
    return R.success(res, { booking }, 'Booking payout marked as paid');
  } catch (err) {
    next(err);
  }
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
  activateBooking,
  completeBooking,
  markRefunded,
  markBookingPayout,
};
