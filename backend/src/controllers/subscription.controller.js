import * as subService from '../services/subscription.service.js';
import * as R from '../utils/response.js';

export const getPlans = async (req, res, next) => {
  try {
    const plans = await subService.getAllPlans();
    return R.success(res, { plans });
  } catch (err) { next(err); }
};

export const getMySummary = async (req, res, next) => {
  try {
    const summary = await subService.getSubscriptionSummary(req.user.id);
    return R.success(res, summary);
  } catch (err) { next(err); }
};
