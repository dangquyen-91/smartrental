import express from 'express';
import { uploadImages, deleteImage, listImages } from '../controllers/upload.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

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

export default router;
