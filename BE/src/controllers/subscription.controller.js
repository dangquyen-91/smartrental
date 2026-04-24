import * as subscriptionService from '../services/subscription.service.js';
import * as R from '../utils/response.js';

const getPlans = async (req, res, next) => {
  try {
    const plans = await subscriptionService.getPlans();
    return R.success(res, { plans });
  } catch (err) {
    next(err);
  }
};

const getMySubscription = async (req, res, next) => {
  try {
    const result = await subscriptionService.getMySubscription(req.user.id);
    return R.success(res, result);
  } catch (err) {
    next(err);
  }
};

const subscribeToPlan = async (req, res, next) => {
  try {
    const sub = await subscriptionService.createPendingSubscription(
      req.params.planId,
      req.user.id,
    );
    return R.created(res, { subscription: sub }, 'Subscription created — proceed to payment');
  } catch (err) {
    next(err);
  }
};

export { getPlans, getMySubscription, subscribeToPlan };
