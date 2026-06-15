import { body, param, query } from 'express-validator';
import validate from '../middleware/validate.middleware.js';

const createReviewValidation = validate([
  body('bookingId')
    .notEmpty().withMessage('bookingId is required')
    .isMongoId().withMessage('bookingId must be a valid ID'),

  body('targetType')
    .notEmpty().withMessage('targetType is required')
    .isIn(['property'])
    .withMessage('targetType must be: property'),

  body('rating')
    .notEmpty().withMessage('rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('rating must be an integer between 1 and 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('comment must not exceed 1000 characters'),
]);

const idParamValidation = validate([
  param('id')
    .isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
]);

const getReviewsValidation = validate([
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),

  query('targetType')
    .optional()
    .isIn(['landlord', 'tenant'])
    .withMessage('targetType must be landlord or tenant'),
]);

export { createReviewValidation, idParamValidation, getReviewsValidation };
