import * as roommateService from '../services/roommate.service.js';
import * as R from '../utils/response.js';

const upsertProfile = async (req, res, next) => {
  try {
    const profile = await roommateService.upsertProfile(req.user.id, req.body);
    return R.created(res, { profile }, 'Roommate profile saved successfully');
  } catch (err) {
    next(err);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await roommateService.getMyProfile(req.user.id);
    return R.success(res, { profile });
  } catch (err) {
    next(err);
  }
};

const deleteMyProfile = async (req, res, next) => {
  try {
    await roommateService.deleteMyProfile(req.user.id);
    return R.success(res, null, 'Roommate profile deleted');
  } catch (err) {
    next(err);
  }
};

const getMatches = async (req, res, next) => {
  try {
    const { matches, pagination } = await roommateService.getMatches(req.user.id, req.query);
    return R.paginated(res, matches, pagination);
  } catch (err) {
    next(err);
  }
};

const sendRequest = async (req, res, next) => {
  try {
    const request = await roommateService.sendRequest(
      req.user.id,
      req.params.userId,
      req.body.message,
    );
    return R.created(res, { request }, 'Roommate request sent');
  } catch (err) {
    next(err);
  }
};

const respondRequest = async (req, res, next) => {
  try {
    const request = await roommateService.respondRequest(
      req.params.id,
      req.user.id,
      req.body.action,
    );
    const msg = req.body.action === 'accepted' ? 'Request accepted' : 'Request rejected';
    return R.success(res, { request }, msg);
  } catch (err) {
    next(err);
  }
};

const cancelRequest = async (req, res, next) => {
  try {
    const request = await roommateService.cancelRequest(req.params.id, req.user.id);
    return R.success(res, { request }, 'Request cancelled');
  } catch (err) {
    next(err);
  }
};

const getMyRequests = async (req, res, next) => {
  try {
    const { requests, pagination } = await roommateService.getMyRequests(req.user.id, req.query);
    return R.paginated(res, requests, pagination);
  } catch (err) {
    next(err);
  }
};

export {
  upsertProfile,
  getMyProfile,
  deleteMyProfile,
  getMatches,
  sendRequest,
  respondRequest,
  cancelRequest,
  getMyRequests,
};
