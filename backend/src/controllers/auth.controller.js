import * as authService from '../services/auth.service.js';
import * as R from '../utils/response.js';

const googleLogin = async (req, res, next) => {
  try {
    const data = await authService.googleLogin(req.body.googleAccessToken, req.body.role);
    return R.success(res, data, 'Google login successful');
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    return R.created(res, data, 'Registration successful');
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body.email, req.body.password);
    return R.success(res, data, 'Login successful');
  } catch (err) {
    next(err);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const data = await authService.refresh(req.body.refreshToken);
    return R.success(res, data, 'Token refreshed');
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    return R.success(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return R.success(res, { user });
  } catch (err) {
    next(err);
  }
};

const verifyPassword = async (req, res, next) => {
  try {
    await authService.verifyPassword(req.user.id, req.body.password);
    return R.success(res, null, 'Password verified');
  } catch (err) {
    next(err);
  }
};

const verifyGoogleToken = async (req, res, next) => {
  try {
    await authService.verifyGoogleToken(req.user.id, req.body.googleAccessToken);
    return R.success(res, null, 'Google identity verified');
  } catch (err) {
    next(err);
  }
};

const updatePhone = async (req, res, next) => {
  try {
    const user = await authService.updatePhone(req.user.id, req.body.phone);
    return R.success(res, { user }, 'Phone updated');
  } catch (err) {
    next(err);
  }
};

export { register, login, refreshToken, logout, getMe, googleLogin, verifyPassword, verifyGoogleToken, updatePhone };
