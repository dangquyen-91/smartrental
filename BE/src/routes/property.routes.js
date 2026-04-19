import express from 'express';
import {
  getProperties,
  getMyProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/property.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { mongoId } from '../validators/common.validator.js';
import {
  getPropertiesValidation,
  createPropertyValidation,
  updatePropertyValidation,
} from '../validators/property.validator.js';

const router = express.Router();

// Public
router.get('/', getPropertiesValidation, getProperties);
router.get('/:id', validate([mongoId('id')]), getPropertyById);

// Landlord: manage own listings
router.get('/my/listings', protect, authorizeRoles('landlord', 'admin'), getMyProperties);
router.post('/', protect, authorizeRoles('landlord', 'admin'), createPropertyValidation, createProperty);
router.put('/:id', protect, authorizeRoles('landlord', 'admin'), validate([mongoId('id')]), updatePropertyValidation, updateProperty);
router.delete('/:id', protect, authorizeRoles('landlord', 'admin'), validate([mongoId('id')]), deleteProperty);

export default router;
