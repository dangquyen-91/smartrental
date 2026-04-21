import { body, query, param } from 'express-validator';
import validate from '../middleware/validate.middleware.js';

const upsertProfileValidation = validate([
  body('budget.min')
    .notEmpty().withMessage('budget.min is required')
    .isInt({ min: 0 }).withMessage('budget.min must be a non-negative integer'),

  body('budget.max')
    .notEmpty().withMessage('budget.max is required')
    .isInt({ min: 0 }).withMessage('budget.max must be a non-negative integer')
    .custom((max, { req }) => {
      if (parseInt(max) < parseInt(req.body.budget?.min)) {
        throw new Error('budget.max must be >= budget.min');
      }
      return true;
    }),

  body('gender')
    .notEmpty().withMessage('gender is required')
    .isIn(['male', 'female', 'any']).withMessage('gender must be male, female, or any'),

  body('schedule')
    .notEmpty().withMessage('schedule is required')
    .isIn(['early_bird', 'night_owl', 'flexible']).withMessage('schedule must be early_bird, night_owl, or flexible'),

  body('lifestyle')
    .notEmpty().withMessage('lifestyle is required')
    .isIn(['quiet', 'social', 'mixed']).withMessage('lifestyle must be quiet, social, or mixed'),

  body('pets')
    .notEmpty().withMessage('pets is required')
    .isBoolean().withMessage('pets must be a boolean'),

  body('smoking')
    .notEmpty().withMessage('smoking is required')
    .isBoolean().withMessage('smoking must be a boolean'),

  body('looking')
    .optional()
    .isBoolean().withMessage('looking must be a boolean'),

  body('property')
    .optional()
    .isMongoId().withMessage('property must be a valid ID'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('bio must not exceed 500 characters'),
]);

const sendRequestValidation = validate([
  param('userId')
    .isMongoId().withMessage('userId must be a valid ID'),

  body('message')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('message must not exceed 300 characters'),
]);

const respondRequestValidation = validate([
  param('id')
    .isMongoId().withMessage('id must be a valid ID'),

  body('action')
    .notEmpty().withMessage('action is required')
    .isIn(['accepted', 'rejected']).withMessage('action must be accepted or rejected'),
]);

const getRequestsValidation = validate([
  query('type')
    .optional()
    .isIn(['sent', 'received']).withMessage('type must be sent or received'),

  query('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected', 'cancelled']).withMessage('Invalid status'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
]);

const getMatchesValidation = validate([
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be >= 1'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
]);

export {
  upsertProfileValidation,
  sendRequestValidation,
  respondRequestValidation,
  getRequestsValidation,
  getMatchesValidation,
};
