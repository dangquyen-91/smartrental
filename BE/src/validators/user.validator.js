import { body, query } from 'express-validator';
import validate from '../middleware/validate.middleware.js';
import { mongoId } from './common.validator.js';

const getUsersValidation = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
  query('role').optional().isIn(['tenant', 'landlord', 'admin']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
]);

const updateUserValidation = validate([
  mongoId('id'),
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('phone')
    .optional()
    .matches(/^(0|\+84)[0-9]{9}$/).withMessage('Invalid Vietnamese phone number'),
  body('avatar').optional().isURL().withMessage('avatar must be a valid URL'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('bio must be at most 300 characters'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('gender must be male, female, or other'),
  body('dateOfBirth')
    .optional()
    .isISO8601().withMessage('dateOfBirth must be a valid date (YYYY-MM-DD)')
    .custom((val) => {
      if (new Date(val) >= new Date()) throw new Error('dateOfBirth must be in the past');
      return true;
    }),
  body('address').optional().trim().isLength({ max: 200 }).withMessage('address must be at most 200 characters'),
  body('role').not().exists().withMessage('Role cannot be changed here'),
  body('isActive').not().exists().withMessage('isActive cannot be changed here'),
  body('password').not().exists().withMessage('Use /change-password to update password'),
  body('email').not().exists().withMessage('Email cannot be changed'),
]);

const changePasswordValidation = validate([
  mongoId('id'),
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
]);

export { getUsersValidation, updateUserValidation, changePasswordValidation };
