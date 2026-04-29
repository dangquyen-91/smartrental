import express from 'express';
import {
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
} from '../controllers/booking.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { mongoId } from '../validators/common.validator.js';
import {
  createBookingValidation,
  rejectBookingValidation,
  cancelBookingValidation,
  getBookingsValidation,
} from '../validators/booking.validator.js';

const router = express.Router();

// All booking routes require authentication
router.use(protect);

// Tenant: create a booking request
router.post('/', authorizeRoles('tenant'), createBookingValidation, createBooking);

// Tenant: view own bookings
router.get('/my', authorizeRoles('tenant'), getBookingsValidation, getMyBookings);

// Landlord: view bookings for their properties
router.get('/landlord', authorizeRoles('landlord'), getBookingsValidation, getLandlordBookings);

// Admin: view all bookings
router.get('/', authorizeRoles('admin'), getBookingsValidation, getAllBookings);

// Any authenticated party: view a single booking (service enforces ownership check)
router.get('/:id', validate([mongoId('id')]), getBookingById);

// Landlord: confirm a pending booking
router.put('/:id/confirm', authorizeRoles('landlord'), validate([mongoId('id')]), confirmBooking);

// Landlord: reject a pending booking
router.put('/:id/reject', authorizeRoles('landlord'), validate([mongoId('id')]), rejectBookingValidation, rejectBooking);

// Landlord / Admin: mark check-in (confirmed → active)
router.put('/:id/activate', authorizeRoles('landlord', 'admin'), validate([mongoId('id')]), activateBooking);

// Landlord / Admin: mark rental period ended (active → completed)
router.put('/:id/complete', authorizeRoles('landlord', 'admin'), validate([mongoId('id')]), completeBooking);

// Tenant / Landlord / Admin: cancel a booking
router.put('/:id/cancel', authorizeRoles('tenant', 'landlord', 'admin'), validate([mongoId('id')]), cancelBookingValidation, cancelBooking);

// Admin: mark a cancelled+paid booking as refunded
router.patch('/:id/mark-refunded', authorizeRoles('admin'), validate([mongoId('id')]), markRefunded);

// Admin: xác nhận đã chuyển 90% cho landlord
router.patch('/:id/payout', authorizeRoles('admin'), validate([mongoId('id')]), markBookingPayout);


export default router;
