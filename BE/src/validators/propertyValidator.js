const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createPropertyValidation = validate([
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['room', 'apartment', 'house', 'studio']).withMessage('Type must be room, apartment, house, or studio'),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),

  body('address.city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('description')
    .optional()
    .trim(),

  body('area')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Area must be a positive number'),

  body('address.street')
    .optional()
    .trim(),

  body('address.ward')
    .optional()
    .trim(),

  body('address.district')
    .optional()
    .trim(),

  body('amenities')
    .optional()
    .isArray().withMessage('Amenities must be an array'),

  body('amenities.*')
    .optional()
    .isString().withMessage('Each amenity must be a string'),

  body('images')
    .optional()
    .isArray().withMessage('Images must be an array'),

  body('images.*')
    .optional()
    .isURL().withMessage('Each image must be a valid URL'),
]);

const updatePropertyValidation = validate([
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('type')
    .optional()
    .isIn(['room', 'apartment', 'house', 'studio']).withMessage('Type must be room, apartment, house, or studio'),

  body('status')
    .optional()
    .isIn(['available', 'rented', 'maintenance']).withMessage('Status must be available, rented, or maintenance'),

  body('price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),

  body('area')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Area must be a positive number'),

  body('address.city')
    .optional()
    .trim()
    .notEmpty().withMessage('City cannot be empty'),

  body('address.street')
    .optional()
    .trim(),

  body('address.ward')
    .optional()
    .trim(),

  body('address.district')
    .optional()
    .trim(),

  body('amenities')
    .optional()
    .isArray().withMessage('Amenities must be an array'),

  body('amenities.*')
    .optional()
    .isString().withMessage('Each amenity must be a string'),

  body('images')
    .optional()
    .isArray().withMessage('Images must be an array'),

  body('images.*')
    .optional()
    .isURL().withMessage('Each image must be a valid URL'),
]);

module.exports = { createPropertyValidation, updatePropertyValidation };
