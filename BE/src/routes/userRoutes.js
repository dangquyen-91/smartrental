const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { getUsers, getUserById, updateUser, deleteUser, changePassword } = require('../controllers/userController');
const { protect, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');

const mongoId = (field) =>
  param(field).isMongoId().withMessage(`${field} must be a valid ID`);

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

// Admin only
router.get('/', protect, authorizeRoles('admin'), getUsersValidation, getUsers);
router.delete('/:id', protect, authorizeRoles('admin'), validate([mongoId('id')]), deleteUser);

const changePasswordValidation = validate([
  mongoId('id'),
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
]);

// Self or admin
router.get('/:id', protect, validate([mongoId('id')]), getUserById);
router.put('/:id', protect, updateUserValidation, updateUser);

// Self only
router.put('/:id/password', protect, changePasswordValidation, changePassword);

module.exports = router;
