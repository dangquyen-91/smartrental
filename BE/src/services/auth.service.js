const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const AppError = require('../utils/app-error');

const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const register = async ({ name, email, password, phone, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use', 400);

  const user = await User.create({ name, email, password, phone, role });
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
  if (!user || !user.isActive) throw new AppError('Account is deactivated', 403);
  return user;
};

module.exports = { register, login, refresh, logout, getMe };
