import * as preferenceService from '../services/preference.service.js';
import * as R from '../utils/response.js';

const getMyPreference = async (req, res, next) => {
  try {
    const preference = await preferenceService.getMyPreference(req.user.id);
    return R.success(res, { preference });
  } catch (err) {
    next(err);
  }
};

const upsertPreference = async (req, res, next) => {
  try {
    const preference = await preferenceService.upsertPreference(req.user.id, req.body);
    return R.success(res, { preference }, 'Hồ sơ tìm phòng đã được lưu');
  } catch (err) {
    next(err);
  }
};

const deletePreference = async (req, res, next) => {
  try {
    await preferenceService.deletePreference(req.user.id);
    return R.success(res, null, 'Đã xoá hồ sơ tìm phòng');
  } catch (err) {
    next(err);
  }
};

export { getMyPreference, upsertPreference, deletePreference };
