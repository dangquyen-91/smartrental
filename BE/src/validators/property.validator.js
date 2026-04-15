import { body, query } from 'express-validator';
import validate from '../middleware/validate.middleware.js';

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

  body('description').optional().trim(),

  body('area').optional().isFloat({ gt: 0 }).withMessage('Area must be a positive number'),

  body('address.street').optional().trim(),
  body('address.ward').optional().trim(),
  body('address.district').optional().trim(),

  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('amenities.*').optional().isString().withMessage('Each amenity must be a string'),

  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().isURL().withMessage('Each image must be a valid URL'),
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

  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
  body('area').optional().isFloat({ gt: 0 }).withMessage('Area must be a positive number'),

  body('address.city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('address.street').optional().trim(),
  body('address.ward').optional().trim(),
  body('address.district').optional().trim(),

  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('amenities.*').optional().isString().withMessage('Each amenity must be a string'),

  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().isURL().withMessage('Each image must be a valid URL'),
]);

const getPropertiesValidation = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
  query('type').optional().isIn(['room', 'apartment', 'house', 'studio']).withMessage('Invalid type'),
  query('status').optional().isIn(['available', 'rented', 'maintenance']).withMessage('Invalid status'),
  query('minPrice').optional().isFloat({ gt: 0 }).withMessage('minPrice must be a positive number'),
  query('maxPrice').optional().isFloat({ gt: 0 }).withMessage('maxPrice must be a positive number'),
  query('sort').optional().isIn(['newest', 'price_asc', 'price_desc']).withMessage('sort must be newest, price_asc, or price_desc'),
]);

export { getPropertiesValidation, createPropertyValidation, updatePropertyValidation };
