const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser, changePassword } = require('../controllers/user.controller');
const { protect, authorizeRoles } = require('../middleware/auth.middleware');
const validate = require('../middleware/validate.middleware');
const { mongoId } = require('../validators/common.validator');
const { getUsersValidation, updateUserValidation, changePasswordValidation } = require('../validators/user.validator');

router.get('/', protect, authorizeRoles('admin'), getUsersValidation, getUsers);
router.get('/:id', protect, validate([mongoId('id')]), getUserById);
router.put('/:id', protect, updateUserValidation, updateUser);
router.put('/:id/password', protect, changePasswordValidation, changePassword);
router.delete('/:id', protect, authorizeRoles('admin'), validate([mongoId('id')]), deleteUser);

module.exports = router;
