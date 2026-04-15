import { body } from 'express-validator';
import validate from '../middleware/validate.middleware.js';

const registerValidation = validate([
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone')
    .optional()
    .matches(/^(0|\+84)[0-9]{9}$/).withMessage('Invalid Vietnamese phone number'),
]);

const loginValidation = validate([
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
]);

const refreshValidation = validate([
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
]);

const otpValidation = validate([
  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
]);

export { registerValidation, loginValidation, refreshValidation, otpValidation };
