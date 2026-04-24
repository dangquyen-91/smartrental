import * as serviceService from '../services/service.service.js';

import * as R from '../utils/response.js';

const getServiceCatalog = async (_req, res, next) => {
  try {
    const services = serviceService.getServiceCatalog();
    return R.success(res, { services });
  } catch (err) {
    next(err);
  }
};

const createServiceOrder = async (req, res, next) => {
  try {
    const order = await serviceService.createServiceOrder(req.body, req.user.id);
    return R.created(res, { order }, 'Service order placed successfully');
  } catch (err) {
    next(err);
  }
};

const assignProvider = async (req, res, next) => {
  try {
    const order = await serviceService.assignProvider(req.params.id, req.body.providerId);
    return R.success(res, { order }, 'Provider assigned successfully');
  } catch (err) {
    next(err);
  }
};

const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await serviceService.updateOrderStatus(
      req.params.id,
      req.body,
      req.user.id,
      req.user.role,
    );
    return R.success(res, { order }, 'Service order updated');
  } catch (err) {
    next(err);
  }
};

const getMyOrders = async (req, res, next) => {
  try {
    const { orders, pagination } = await serviceService.getMyOrders(req.user.id, req.query);
    return R.paginated(res, orders, pagination);
  } catch (err) {
    next(err);
  }
};

const getProviderOrders = async (req, res, next) => {
  try {
    const { orders, pagination } = await serviceService.getProviderOrders(req.user.id, req.query);
    return R.paginated(res, orders, pagination);
  } catch (err) {
    next(err);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const { orders, pagination } = await serviceService.getAllOrders(req.query);
    return R.paginated(res, orders, pagination);
  } catch (err) {
    next(err);
  }
};

const markPayout = async (req, res, next) => {
  try {
    const order = await serviceService.markPayout(req.params.id);
    return R.success(res, { order }, 'Payout marked as paid');
  } catch (err) {
    next(err);
  }
};

export {
  getServiceCatalog,
  createServiceOrder,
  assignProvider,
  updateOrderStatus,
  getMyOrders,
  getProviderOrders,
  getAllOrders,
  markPayout,
};
