const userService = require('../services/user.service');
const R = require('../utils/response');

const getUsers = async (req, res, next) => {
  try {
    const { users, pagination } = await userService.getUsers(req.query);
    return R.paginated(res, users, pagination);
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id, req.user.id, req.user.role);
    return R.success(res, { user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user.id, req.user.role);
    return R.success(res, { user }, 'Profile updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);
    return R.success(res, null, 'User deactivated successfully');
  } catch (err) {
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.params.id, currentPassword, newPassword, req.user.id);
    return R.success(res, null, 'Password changed successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser, changePassword };
