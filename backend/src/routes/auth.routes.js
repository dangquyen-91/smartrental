import express from 'express';
import { register, login, refreshToken, logout, getMe, requestLandlord, verifyPhone, googleLogin, verifyPassword, verifyGoogleToken } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { registerValidation, loginValidation, refreshValidation, otpValidation } from '../validators/auth.validator.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/refresh-token', refreshValidation, refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/request-landlord', protect, requestLandlord);
router.post('/verify-phone', protect, otpValidation, verifyPhone);
router.post('/google', googleLogin);
router.post('/verify-password', protect, verifyPassword);
router.post('/verify-google', protect, verifyGoogleToken);

export default router;
