const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');

const registerValidation = validate([
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
  body('role')
    .optional()
    .isIn(['tenant', 'landlord'])
    .withMessage('Role must be tenant or landlord'),
]);

const loginValidation = validate([
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]);

const refreshValidation = validate([
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
]);

module.exports = { registerValidation, loginValidation, refreshValidation };
