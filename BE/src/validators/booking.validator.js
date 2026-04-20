import { body, query } from 'express-validator';
import validate from '../middleware/validate.middleware.js';

const createBookingValidation = validate([
  body('property')
    .notEmpty().withMessage('Property is required')
    .isMongoId().withMessage('Property must be a valid ID'),

  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date (YYYY-MM-DD)')
    .custom((value) => {
      const start = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (start < today) throw new Error('Start date must be today or in the future');
      return true;
    }),

  body('duration')
    .notEmpty().withMessage('Duration is required')
    .isInt({ min: 1, max: 24 }).withMessage('Duration must be between 1 and 24 months'),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Note must not exceed 500 characters'),
]);

const rejectBookingValidation = validate([
  body('reason')
    .trim()
    .notEmpty().withMessage('Rejection reason is required')
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters'),
]);

const cancelBookingValidation = validate([
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters'),
]);

const getBookingsValidation = validate([
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'rejected', 'cancelled', 'active', 'completed'])
    .withMessage('Invalid status'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
]);

export {
  createBookingValidation,
  rejectBookingValidation,
  cancelBookingValidation,
  getBookingsValidation,
};
