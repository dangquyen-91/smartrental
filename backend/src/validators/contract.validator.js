import { body, query } from 'express-validator';
import validate from '../middleware/validate.middleware.js';

const generateContractValidation = validate([
  body('bookingId')
    .notEmpty().withMessage('bookingId is required')
    .isMongoId().withMessage('bookingId must be a valid ID'),

  body('terms')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Terms must not exceed 2000 characters'),
]);

const getContractsValidation = validate([
  query('status')
    .optional()
    .isIn(['draft', 'awaiting_signatures', 'signed', 'cancelled'])
    .withMessage('Invalid status'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
]);

export { generateContractValidation, getContractsValidation };
