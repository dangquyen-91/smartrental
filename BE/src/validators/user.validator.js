const { body, query } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const { mongoId } = require('./common.validator');

const getUsersValidation = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1–100'),
  query('role').optional().isIn(['tenant', 'landlord', 'admin']).withMessage('Invalid role'),
  query('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
]);

const updateUserValidation = validate([
  mongoId('id'),
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('phone').optional().trim().notEmpty().withMessage('phone cannot be empty'),
  body('avatar').optional().isURL().withMessage('avatar must be a valid URL'),
  body('role')
    .optional()
    .isIn(['tenant', 'landlord', 'admin'])
    .withMessage('Invalid role'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  body('password').not().exists().withMessage('Use /change-password to update password'),
  body('email').not().exists().withMessage('Email cannot be changed'),
]);

const changePasswordValidation = validate([
  mongoId('id'),
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
]);

module.exports = { getUsersValidation, updateUserValidation, changePasswordValidation };
