import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';

const generateAccessToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

const register = async ({ name, email, password, phone, role }) => {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('Email already in use', 400);

  if (phone) {
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) throw new AppError('Phone number already in use', 400);
  }

  const allowedRoles = ['tenant', 'landlord'];
  const assignedRole = allowedRoles.includes(role) ? role : 'tenant';
  const user = await User.create({ name, email, password, phone, role: assignedRole });
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Dùng findByIdAndUpdate thay vì user.save() để tránh pre-save hook
  // chạy lại và hash password lần 2
  await User.findByIdAndUpdate(user._id, { refreshToken });

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, authProvider: user.authProvider },
  };
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError('Email hoặc mật khẩu không đúng', 401);
  if (!user.isActive) throw new AppError('Account is deactivated', 403);
  if (!(await user.matchPassword(password))) {
    const hint = user.authProvider === 'google'
      ? 'Tài khoản này dùng Google — vui lòng đăng nhập bằng Google'
      : 'Email hoặc mật khẩu không đúng';
    throw new AppError(hint, 401);
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  return {
    accessToken,
    refreshToken,
    user: user.toJSON(),
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

const googleLogin = async (googleAccessToken, role) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${googleAccessToken}` },
  });
  if (!res.ok) throw new AppError('Invalid Google token', 401);

  const { email, name, picture } = await res.json();
  if (!email) throw new AppError('Cannot get email from Google', 401);

  let user = await User.findOne({ email });
  if (!user) {
    // Không có role → request đến từ trang login, không tự tạo account
    if (!role || !['tenant', 'landlord'].includes(role)) {
      throw new AppError('Tài khoản chưa tồn tại. Vui lòng đăng ký trước.', 404);
    }
    user = await User.create({
      name,
      email,
      avatar: picture,
      password: Math.random().toString(36) + Math.random().toString(36),
      authProvider: 'google',
      role,
    });
  }
  if (!user.isActive) throw new AppError('Account is deactivated', 403);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  // Dùng findByIdAndUpdate để tránh pre-save hook chạy lại sau create()
  await User.findByIdAndUpdate(user._id, { refreshToken });

  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, authProvider: user.authProvider },
  };
};

const verifyPassword = async (userId, password) => {
  const user = await User.findById(userId).select('+password');
  if (!user) throw new AppError('User not found', 401);
  if (user.authProvider === 'google') throw new AppError('Tài khoản Google — hãy dùng xác thực Google', 400);
  if (!(await user.matchPassword(password))) throw new AppError('Mật khẩu không đúng', 401);
};

const verifyGoogleToken = async (userId, googleAccessToken) => {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${googleAccessToken}` },
  });
  if (!res.ok) throw new AppError('Google token không hợp lệ', 401);

  const { email } = await res.json();
  if (!email) throw new AppError('Không lấy được email từ Google', 401);

  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 401);
  if (user.email !== email) throw new AppError('Tài khoản Google không khớp', 401);
};

const updatePhone = async (userId, phone) => {
  const phoneExists = await User.findOne({ phone, _id: { $ne: userId } });
  if (phoneExists) throw new AppError('Số điện thoại đã được sử dụng', 400);

  const user = await User.findByIdAndUpdate(userId, { phone }, { returnDocument: 'after' }).select('-password -refreshToken');
  if (!user) throw new AppError('User not found', 404);
  return user;
};

export { register, login, refresh, logout, getMe, googleLogin, verifyPassword, verifyGoogleToken, updatePhone };
