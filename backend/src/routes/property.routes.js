import express from 'express';
import {
  getProperties,
  getMyProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getRecommendations,
  predictPrice,
} from '../controllers/property.controller.js';
import { protect, authorizeRoles, optionalProtect } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { mongoId } from '../validators/common.validator.js';
import {
  getPropertiesValidation,
  createPropertyValidation,
  updatePropertyValidation,
  predictPriceValidation,
} from '../validators/property.validator.js';

const router = express.Router();

// Public
router.get('/', getPropertiesValidation, getProperties);

// Tenant: AI recommendations (must be before /:id)
router.get('/recommendations', protect, authorizeRoles('tenant'), getRecommendations);

// Landlord: AI price prediction (must be before /:id)
router.post('/predict-price', protect, authorizeRoles('landlord', 'admin'), predictPriceValidation, predictPrice);

router.get('/:id', optionalProtect, validate([mongoId('id')]), getPropertyById);

// Landlord: manage own listings
router.get('/my/listings', protect, authorizeRoles('landlord', 'admin'), getMyProperties);
router.post('/', protect, authorizeRoles('landlord', 'admin'), createPropertyValidation, createProperty);
router.put('/:id', protect, authorizeRoles('landlord', 'admin'), validate([mongoId('id')]), updatePropertyValidation, updateProperty);
router.delete('/:id', protect, authorizeRoles('landlord', 'admin'), validate([mongoId('id')]), deleteProperty);

export default router;
