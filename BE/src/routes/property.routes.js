const express = require('express');
const router = express.Router();
const { getProperties, getMyProperties, getPropertyById, createProperty, updateProperty, deleteProperty } = require('../controllers/property.controller');
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { mongoId } = require('../validators/common.validator');
const { getPropertiesValidation, createPropertyValidation, updatePropertyValidation } = require('../validators/property.validator');

router.get('/', getPropertiesValidation, getProperties);
router.get('/my', protect, authorizeRoles('landlord', 'admin'), getMyProperties);
router.get('/:id', validate([mongoId('id')]), getPropertyById);

router.post('/', protect, authorizeRoles('landlord', 'admin'), createPropertyValidation, createProperty);
router.put('/:id', protect, authorizeRoles('landlord', 'admin'), validate([mongoId('id')]), updatePropertyValidation, updateProperty);
router.delete('/:id', protect, authorizeRoles('landlord', 'admin'), validate([mongoId('id')]), deleteProperty);

module.exports = router;
