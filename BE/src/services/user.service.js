import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getUsers = async ({ page = 1, limit = 10, role, isActive, search }) => {
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
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

  return {
    users,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

const getUserById = async (id, requesterId, requesterRole) => {
  if (id !== requesterId && requesterRole !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const user = await User.findById(id).select('-password -refreshToken');
  if (!user) throw new AppError('User not found', 404);

  return user;
};

const updateUser = async (id, data, requesterId, requesterRole) => {
  if (id !== requesterId && requesterRole !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);

  if (data.phone !== undefined && user.isPhoneVerified) {
    throw new AppError('Phone number cannot be changed after verification', 400);
  }

  const allowedFields = ['name', 'phone', 'avatar', 'bio', 'gender', 'dateOfBirth', 'address'];
  if (requesterRole === 'admin') allowedFields.push('role', 'isActive');

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) user[field] = data[field];
  });

  await user.save();
  return user.toJSON();
};

const deleteUser = async (id) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Cannot deactivate an admin account', 403);

  user.isActive = false;
  user.refreshToken = null;
  await user.save();
};

const updateBankAccount = async (id, data, requesterId, requesterRole) => {
  if (id !== requesterId && requesterRole !== 'admin') {
    throw new AppError('Access denied', 403);
  }

  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);

  if (!['landlord', 'provider', 'admin'].includes(user.role)) {
    throw new AppError('Only registered users can set up bank accounts', 403);
  }

  const { bankName, accountNumber, accountName, branch } = data;
  user.bankAccount = {
    bankName:      bankName      ?? user.bankAccount?.bankName,
    accountNumber: accountNumber ?? user.bankAccount?.accountNumber,
    accountName:   accountName   ?? user.bankAccount?.accountName,
    branch:        branch        ?? user.bankAccount?.branch,
    verifiedAt:    null,
  };

  await user.save();
  return user.toJSON();
};

const changePassword = async (id, currentPassword, newPassword, requesterId) => {
  if (id !== requesterId) throw new AppError('You can only change your own password', 403);

  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);

  user.password = newPassword;
  await user.save();
};

export { getUsers, getUserById, updateUser, deleteUser, changePassword, updateBankAccount };
