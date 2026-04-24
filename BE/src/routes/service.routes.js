import express from 'express';
import {
  getServiceCatalog,
  createServiceOrder,
  assignProvider,
  updateOrderStatus,
  getMyOrders,
  getProviderOrders,
  getAllOrders,
  markPayout,
} from '../controllers/service.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.middleware.js';
import { mongoId } from '../validators/common.validator.js';
import {
  createServiceOrderValidation,
  assignProviderValidation,
  updateOrderStatusValidation,
  getOrdersValidation,
} from '../validators/service.validator.js';

const router = express.Router();

// Public: service catalog với giá
router.get('/', getServiceCatalog);

router.use(protect);

// Tenant: đặt dịch vụ
router.post('/order', authorizeRoles('tenant'), createServiceOrderValidation, createServiceOrder);

// Tenant: lịch sử đơn của mình
router.get('/my-orders', authorizeRoles('tenant'), getOrdersValidation, getMyOrders);

// Provider: danh sách đơn được gán
router.get('/provider-orders', authorizeRoles('provider'), getOrdersValidation, getProviderOrders);

// Admin: tất cả đơn
router.get('/orders', authorizeRoles('admin'), getOrdersValidation, getAllOrders);

// Admin: gán provider cho đơn
router.patch(
  '/order/:id/assign',
  authorizeRoles('admin'),
  validate([mongoId('id')]),
  assignProviderValidation,
  assignProvider,
);

// Admin: xác nhận đã chuyển tiền cho provider
router.patch(
  '/order/:id/payout',
  authorizeRoles('admin'),
  validate([mongoId('id')]),
  markPayout,
);

// Tenant / Landlord / Provider / Admin: cập nhật trạng thái (service layer enforce quyền)
router.patch(
  '/order/:id',
  authorizeRoles('tenant', 'landlord', 'provider', 'admin'),
  validate([mongoId('id')]),
  updateOrderStatusValidation,
  updateOrderStatus,
);

export default router;
