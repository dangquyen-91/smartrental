const User = require('../models/User');
const R = require('../utils/response');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/users — Admin only: list all users with pagination, filter, search
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, isActive, search } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(filter),
    ]);

    return R.paginated(res, users, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id — Self or admin: view profile
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    if (id !== requesterId && requesterRole !== 'admin') {
      return R.forbidden(res, 'Access denied');
    }

    const user = await User.findById(id).select('-password -refreshToken');
    if (!user) return R.notFound(res, 'User not found');

    return R.success(res, { user });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id — Self or admin: update profile
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    if (id !== requesterId && requesterRole !== 'admin') {
      return R.forbidden(res, 'Access denied');
    }

    const user = await User.findById(id);
    if (!user) return R.notFound(res, 'User not found');

    // Fields allowed for self-update
    const allowedFields = ['name', 'phone', 'avatar'];

    // Admin can additionally update role and isActive
    if (requesterRole === 'admin') {
      allowedFields.push('role', 'isActive');
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    const updated = user.toObject();
    delete updated.password;
    delete updated.refreshToken;

    return R.success(res, { user: updated }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id — Admin only: soft-delete (deactivate)
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return R.notFound(res, 'User not found');

    if (user.role === 'admin') {
      return R.forbidden(res, 'Cannot deactivate an admin account');
    }

    user.isActive = false;
    user.refreshToken = null;
    await user.save();

    return R.success(res, null, 'User deactivated successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id/password — Self only: change own password
const changePassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const requesterId = req.user.id;

    if (id !== requesterId) {
      return R.forbidden(res, 'You can only change your own password');
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(id);
    if (!user) return R.notFound(res, 'User not found');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return R.badRequest(res, 'Current password is incorrect');

    user.password = newPassword;
    await user.save(); // triggers bcrypt pre-save hook

    return R.success(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, changePassword };
