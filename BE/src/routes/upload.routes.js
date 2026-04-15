const express = require('express');
const router = express.Router();
const { uploadImages, deleteImage, listImages } = require('../controllers/upload.controller');
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.get('/', protect, authorizeRoles('admin'), listImages);

router.post(
  '/',
  protect,
  authorizeRoles('landlord', 'admin'),
  upload.array('images', 10),
  uploadImages
);

router.delete(
  '/',
  protect,
  authorizeRoles('landlord', 'admin'),
  deleteImage
);

module.exports = router;
