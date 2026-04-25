import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';
import { sendOtp } from './sms.service.js';

const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async ({ name, email, password, phone }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use', 400);

  if (phone) {
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) throw new AppError('Phone number already in use', 400);
  }

  const user = await User.create({ name, email, password, phone, role: 'tenant' });
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('Account is deactivated', 403);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

const refresh = async (token) => {
  if (!token) throw new AppError('Refresh token required', 401);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await User.findById(payload.id);
  if (!user || user.refreshToken !== token) {
    throw new AppError('Refresh token revoked', 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken };
};

const logout = async (userId) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
};

const getMe = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken');
  if (!user) throw new AppError('User not found', 404);
  if (!user.isActive) throw new AppError('Account is deactivated', 403);
  return user;
};

const requestLandlord = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  if (!user.isActive) throw new AppError('Account is deactivated', 403);
  if (user.role === 'landlord') throw new AppError('Already a landlord', 400);
  if (!user.phone) throw new AppError('Please update your phone number first', 400);

  // Giới hạn: nếu OTP cũ vẫn còn hiệu lực (> 1 phút chưa hết) thì không gửi lại
  if (user.phoneOtpExpiry && user.phoneOtpExpiry > new Date(Date.now() + 4 * 60 * 1000)) {
    throw new AppError('OTP was just sent, please wait before requesting again', 429);
  }

  const otp = generateOtp();
  user.phoneOtp = otp;
  user.phoneOtpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
  await user.save();

  await sendOtp(user.phone, otp);
};

const verifyPhone = async (userId, otp) => {
  const user = await User.findById(userId).select('+phoneOtp +phoneOtpExpiry');
  if (!user) throw new AppError('User not found', 404);
  if (!user.isActive) throw new AppError('Account is deactivated', 403);
  if (user.role === 'landlord') throw new AppError('Already a landlord', 400);

  if (!user.phoneOtp || !user.phoneOtpExpiry) {
    throw new AppError('No OTP requested, please request one first', 400);
  }
  if (new Date() > user.phoneOtpExpiry) {
    throw new AppError('OTP has expired', 400);
  }
  if (user.phoneOtp !== otp) {
    throw new AppError('Invalid OTP', 400);
  }

  user.role = 'landlord';
  user.isPhoneVerified = true;
  user.phoneOtp = null;
  user.phoneOtpExpiry = null;

  // Trả về access token mới với role đã được cập nhật
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken, user: user.toJSON() };
};

const googleLogin = async (googleAccessToken) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${googleAccessToken}` },
  });
  if (!res.ok) throw new AppError('Invalid Google token', 401);

  const { email, name, picture } = await res.json();
  if (!email) throw new AppError('Cannot get email from Google', 401);

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      avatar: picture,
      password: Math.random().toString(36) + Math.random().toString(36),
      role: 'tenant',
    });
  }
  if (!user.isActive) throw new AppError('Account is deactivated', 403);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
  };
};

export { register, login, refresh, logout, getMe, requestLandlord, verifyPhone, googleLogin };
