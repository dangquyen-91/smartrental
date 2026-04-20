import { body, query } from 'express-validator';
import validate from '../middleware/validate.middleware.js';

const PROPERTY_TYPES = ['room', 'apartment', 'house', 'studio'];
const RENTAL_STATUSES = ['available', 'rented', 'maintenance'];

const imageValidation = (fieldPath, optional = false) => {
  const base = optional
    ? body(fieldPath).optional()
    : body(fieldPath).notEmpty().withMessage('Images must not be empty');

  return [
    body(fieldPath).optional().isArray().withMessage('Images must be an array'),
    body(`${fieldPath}.*.url`)
      .notEmpty().withMessage('Image url is required')
      .isURL().withMessage('Image url must be a valid URL'),
    body(`${fieldPath}.*.isPrimary`)
      .optional()
      .isBoolean().withMessage('isPrimary must be a boolean'),
  ];
};

const createPropertyValidation = validate([
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(PROPERTY_TYPES).withMessage(`Type must be one of: ${PROPERTY_TYPES.join(', ')}`),

  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),

  body('address.city')
    .trim()
    .notEmpty().withMessage('City is required'),

  body('description').optional().trim(),

  body('area')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Area must be a positive number'),

  body('bedrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),

  body('bathrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),

  body('address.street').optional().trim(),
  body('address.ward').optional().trim(),
  body('address.district').optional().trim(),
  body('address.fullAddress').optional().trim(),

  body('address.lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),

  body('address.lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('amenities.*').optional().isString().withMessage('Each amenity must be a string'),

  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*.url')
    .notEmpty().withMessage('Image url is required')
    .isURL().withMessage('Image url must be a valid URL'),
  body('images.*.isPrimary')
    .optional()
    .isBoolean().withMessage('isPrimary must be a boolean'),

  body('contact.name').optional().trim(),
  body('contact.phone').optional().trim(),
]);

const updatePropertyValidation = validate([
  body('title')
    .optional().trim()
    .notEmpty().withMessage('Title cannot be empty')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3–200 characters'),

  body('type')
    .optional()
    .isIn(PROPERTY_TYPES).withMessage(`Type must be one of: ${PROPERTY_TYPES.join(', ')}`),

  body('status')
    .optional()
    .isIn(RENTAL_STATUSES).withMessage(`Status must be one of: ${RENTAL_STATUSES.join(', ')}`),

  body('price')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Price must be a positive number'),

  body('area')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Area must be a positive number'),

  body('bedrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),

  body('bathrooms')
    .optional()
    .isInt({ min: 0 }).withMessage('Bathrooms must be a non-negative integer'),

  body('address.city').optional().trim().notEmpty().withMessage('City cannot be empty'),
  body('address.street').optional().trim(),
  body('address.ward').optional().trim(),
  body('address.district').optional().trim(),
  body('address.fullAddress').optional().trim(),

  body('address.lat')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),

  body('address.lng')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

  body('amenities').optional().isArray().withMessage('Amenities must be an array'),
  body('amenities.*').optional().isString().withMessage('Each amenity must be a string'),

  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*.url')
    .notEmpty().withMessage('Image url is required')
    .isURL().withMessage('Image url must be a valid URL'),
  body('images.*.isPrimary')
    .optional()
    .isBoolean().withMessage('isPrimary must be a boolean'),

  body('contact.name').optional().trim(),
  body('contact.phone').optional().trim(),
]);

const getPropertiesValidation = validate([
  query('page').optional().isInt({ min: 1 }).withMessage('page must be >= 1'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1–50'),
  query('type').optional().isIn(PROPERTY_TYPES).withMessage('Invalid type'),
  query('status').optional().isIn(RENTAL_STATUSES).withMessage('Invalid status'),
  query('minPrice').optional().isFloat({ gt: 0 }).withMessage('minPrice must be a positive number'),
  query('maxPrice').optional().isFloat({ gt: 0 }).withMessage('maxPrice must be a positive number'),
  query('bedrooms').optional().isInt({ min: 0 }).withMessage('bedrooms must be a non-negative integer'),
  query('bathrooms').optional().isInt({ min: 0 }).withMessage('bathrooms must be a non-negative integer'),
  query('sort')
    .optional()
    .isIn(['newest', 'price_asc', 'price_desc'])
    .withMessage('sort must be newest, price_asc, or price_desc'),
]);

export {
  getPropertiesValidation,
  createPropertyValidation,
  updatePropertyValidation,
};
