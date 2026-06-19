import express from 'express';
import { register, login, refreshToken, logout, getMe, googleLogin, verifyPassword, verifyGoogleToken, updatePhone } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { registerValidation, loginValidation, refreshValidation } from '../validators/auth.validator.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshValidation, refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/google', googleLogin);
router.post('/verify-password', protect, verifyPassword);
router.post('/verify-google', protect, verifyGoogleToken);
router.patch('/phone', protect, updatePhone);

export default router;
