const express = require('express');
const router = express.Router();
const {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} = require('../controllers/propertyController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Public
router.get('/', getProperties);
router.get('/:id', getPropertyById);

// Landlord / admin only
router.post('/', protect, authorizeRoles('landlord', 'admin'), createProperty);
router.put('/:id', protect, authorizeRoles('landlord', 'admin'), updateProperty);
router.delete('/:id', protect, authorizeRoles('landlord', 'admin'), deleteProperty);

module.exports = router;
