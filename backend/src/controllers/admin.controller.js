import * as adminService from '../services/admin.service.js';
import * as R from '../utils/response.js';

// ─── Dashboard ────────────────────────────────────────────────────────────────

const getDashboard = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return R.success(res, stats);
  } catch (err) {
    next(err);
  }
};

// ─── Analytics ────────────────────────────────────────────────────────────────

const getRevenueAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getRevenueAnalytics(req.query.period);
    return R.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getUserAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getUserAnalytics(req.query.period);
    return R.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getBookingAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getBookingAnalytics(req.query.period);
    return R.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getServiceAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getServiceAnalytics(req.query.period);
    return R.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getPropertyAnalytics = async (req, res, next) => {
  try {
    const data = await adminService.getPropertyAnalytics();
    return R.success(res, data);
  } catch (err) {
    next(err);
  }
};

// ─── User Management ──────────────────────────────────────────────────────────

const getUsers = async (req, res, next) => {
  try {
    const { users, pagination } = await adminService.getAdminUsers(req.query);
    return R.paginated(res, users, pagination);
  } catch (err) {
    next(err);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') return R.badRequest(res, 'isActive must be a boolean');
    const user = await adminService.updateUserStatus(req.params.id, isActive);
    return R.success(res, { user }, `User ${isActive ? 'activated' : 'deactivated'} successfully`);
  } catch (err) {
    next(err);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) return R.badRequest(res, 'role is required');
    const user = await adminService.updateUserRole(req.params.id, role);
    return R.success(res, { user }, 'User role updated successfully');
  } catch (err) {
    next(err);
  }
};

// ─── Property Management ──────────────────────────────────────────────────────

const getProperties = async (req, res, next) => {
  try {
    const { properties, pagination } = await adminService.getAdminProperties(req.query);
    return R.paginated(res, properties, pagination);
  } catch (err) {
    next(err);
  }
};

const togglePropertyFeatured = async (req, res, next) => {
  try {
    const property = await adminService.togglePropertyFeatured(req.params.id);
    return R.success(res, { property }, 'Featured status updated');
  } catch (err) {
    next(err);
  }
};

const updatePropertyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) return R.badRequest(res, 'status is required');
    const property = await adminService.updatePropertyStatus(req.params.id, status);
    return R.success(res, { property }, 'Property status updated');
  } catch (err) {
    next(err);
  }
};

// ─── Pending Actions ──────────────────────────────────────────────────────────

const getPendingPayouts = async (req, res, next) => {
  try {
    const data = await adminService.getPendingPayouts(req.query);
    return R.success(res, data);
  } catch (err) {
    next(err);
  }
};

const getPendingRefunds = async (req, res, next) => {
  try {
    const { items, pagination } = await adminService.getPendingRefunds(req.query);
    return R.paginated(res, items, pagination);
  } catch (err) {
    next(err);
  }
};

export {
  getDashboard,
  getRevenueAnalytics,
  getUserAnalytics,
  getBookingAnalytics,
  getServiceAnalytics,
  getPropertyAnalytics,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getProperties,
  togglePropertyFeatured,
  updatePropertyStatus,
  getPendingPayouts,
  getPendingRefunds,
};
