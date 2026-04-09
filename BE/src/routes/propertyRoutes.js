const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const {
  getProperties,
  getMyProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} = require('../controllers/propertyController');
const { protect, authorizeRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPropertyValidation, updatePropertyValidation } = require('../validators/propertyValidator');

const mongoId = (field) =>
  param(field).isMongoId().withMessage(`${field} must be a valid ID`);

const getPropertiesValidation = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
  query('type').optional().isIn(['room', 'apartment', 'house', 'studio']).withMessage('Invalid type'),
  query('status').optional().isIn(['available', 'rented', 'maintenance']).withMessage('Invalid status'),
  query('minPrice').optional().isFloat({ gt: 0 }).withMessage('minPrice must be a positive number'),
  query('maxPrice').optional().isFloat({ gt: 0 }).withMessage('maxPrice must be a positive number'),
  query('sort').optional().isIn(['newest', 'price_asc', 'price_desc']).withMessage('sort must be newest, price_asc, or price_desc'),
]);

// Public
router.get('/', getPropertiesValidation, getProperties);
router.get('/my', protect, authorizeRoles('landlord', 'admin'), getMyProperties);
router.get('/:id', validate([mongoId('id')]), getPropertyById);

// Landlord / admin only
router.post('/', protect, authorizeRoles('landlord', 'admin'), createPropertyValidation, createProperty);
router.put('/:id', protect, authorizeRoles('landlord', 'admin'), validate([mongoId('id')]), updatePropertyValidation, updateProperty);
router.delete('/:id', protect, authorizeRoles('landlord', 'admin'), validate([mongoId('id')]), deleteProperty);

module.exports = router;
