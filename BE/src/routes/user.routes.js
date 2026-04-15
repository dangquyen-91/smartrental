import express from 'express';
import { getUsers, getUserById, updateUser, deleteUser, changePassword } from '../controllers/user.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { mongoId } from '../validators/common.validator.js';
import { getUsersValidation, updateUserValidation, changePasswordValidation } from '../validators/user.validator.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('admin'), getUsersValidation, getUsers);
router.get('/:id', protect, validate([mongoId('id')]), getUserById);
router.put('/:id', protect, updateUserValidation, updateUser);
router.put('/:id/password', protect, changePasswordValidation, changePassword);
router.delete('/:id', protect, authorizeRoles('admin'), validate([mongoId('id')]), deleteUser);

export default router;
