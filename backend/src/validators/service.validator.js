import { body, query } from 'express-validator';
import validate from '../middleware/validate.middleware.js';

const SERVICE_TYPES = ['cleaning', 'repair', 'wifi', 'moving', 'painting', 'registration'];
const SERVICE_STATUSES = ['pending', 'confirmed', 'in_progress', 'done', 'cancelled'];

const createServiceOrderValidation = validate([
  body('property')
    .notEmpty().withMessage('Property is required')
    .isMongoId().withMessage('Property must be a valid ID'),

  body('type')
    .notEmpty().withMessage('Service type is required')
    .isIn(SERVICE_TYPES).withMessage(`Type must be one of: ${SERVICE_TYPES.join(', ')}`),

  body('scheduledAt')
    .notEmpty().withMessage('Scheduled date is required')
    .isISO8601().withMessage('scheduledAt must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Scheduled date must be in the future');
      }
      return true;
    }),

  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Note must not exceed 500 characters'),
]);

const assignProviderValidation = validate([
  body('providerId')
    .notEmpty().withMessage('providerId is required')
    .isMongoId().withMessage('providerId must be a valid ID'),
]);

const updateOrderStatusValidation = validate([
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(SERVICE_STATUSES).withMessage(`Status must be one of: ${SERVICE_STATUSES.join(', ')}`),

  body('cancelReason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Cancel reason must not exceed 500 characters'),
]);

const getOrdersValidation = validate([
  query('status')
    .optional()
    .isIn(SERVICE_STATUSES).withMessage('Invalid status'),

  query('type')
    .optional()
    .isIn(SERVICE_TYPES).withMessage('Invalid service type'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
]);

export {
  createServiceOrderValidation,
  assignProviderValidation,
  updateOrderStatusValidation,
  getOrdersValidation,
};
