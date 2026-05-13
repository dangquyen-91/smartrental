import express from 'express';
import {
  getServiceCatalog,
  updateCatalogEntry,
  createServiceOrder,
  assignProvider,
  updateOrderStatus,
  getMyOrders,
  getLandlordOrders,
  getProviderOrders,
  getAllOrders,
  markRefund,
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
  updateCatalogValidation,
} from '../validators/service.validator.js';
import { param } from 'express-validator';

const router = express.Router();

const SERVICE_TYPES = ['cleaning', 'repair', 'wifi', 'moving', 'painting', 'registration'];

// Public: service catalog với giá
router.get('/', getServiceCatalog);

router.use(protect);

// Admin: cập nhật giá/tên dịch vụ trong catalog
router.patch(
  '/catalog/:type',
  authorizeRoles('admin'),
  validate([param('type').isIn(SERVICE_TYPES).withMessage('Invalid service type')]),
  updateCatalogValidation,
  updateCatalogEntry,
);

// Tenant: đặt dịch vụ
router.post('/order', authorizeRoles('tenant'), createServiceOrderValidation, createServiceOrder);

// Tenant: lịch sử đơn của mình (filter theo ?propertyId=)
router.get('/my-orders', authorizeRoles('tenant'), getOrdersValidation, getMyOrders);

// Landlord: đơn dịch vụ tại properties của mình
router.get('/landlord-orders', authorizeRoles('landlord'), getOrdersValidation, getLandlordOrders);

// Provider: danh sách đơn được gán (filter theo ?propertyId=)
router.get('/provider-orders', authorizeRoles('provider'), getOrdersValidation, getProviderOrders);

// Admin: tất cả đơn (filter theo ?propertyId=)
router.get('/orders', authorizeRoles('admin'), getOrdersValidation, getAllOrders);

// Admin: gán provider cho đơn
router.patch(
  '/order/:id/assign',
  authorizeRoles('admin'),
  validate([mongoId('id')]),
  assignProviderValidation,
  assignProvider,
);

// Admin: hoàn tiền cho tenant (sau khi order bị huỷ và đã thanh toán)
router.patch(
  '/order/:id/refund',
  authorizeRoles('admin'),
  validate([mongoId('id')]),
  markRefund,
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
