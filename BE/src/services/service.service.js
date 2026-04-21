import ServiceOrder from '../models/service-order.model.js';
import Property from '../models/property.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';

// ─── Service Catalog ─────────────────────────────────────────────────────────

const SERVICE_CATALOG = [
  { type: 'cleaning',     name: 'Dọn dẹp vệ sinh',          price: 150000,  unit: 'lần' },
  { type: 'repair',       name: 'Sửa chữa',                  price: 200000,  unit: 'lần' },
  { type: 'wifi',         name: 'Lắp đặt WiFi',              price: 500000,  unit: 'lần' },
  { type: 'moving',       name: 'Chuyển đồ',                 price: 300000,  unit: 'lần' },
  { type: 'painting',     name: 'Sơn nhà',                   price: 1000000, unit: 'phòng' },
  { type: 'registration', name: 'Đăng ký tạm trú/tạm vắng', price: 100000,  unit: 'hồ sơ' },
];

// ─── Luồng Hướng 2 — Platform-managed ────────────────────────────────────────
//
//  [Tenant]   POST /order              → pending
//  [Landlord] PATCH status=confirmed   → confirmed  (cho phép dịch vụ vào property)
//  [Admin]    PATCH /:id/assign        → gán provider cho đơn
//  [Provider] PATCH status=in_progress → in_progress
//  [Provider] PATCH status=done        → done
//
//  Huỷ: tenant (pending), landlord (pending/confirmed), admin (bất kỳ)

// ─── State machine theo role ─────────────────────────────────────────────────

const ALLOWED_TRANSITIONS = {
  pending: {
    tenant:   ['cancelled'],
    landlord: ['confirmed', 'cancelled'],
    admin:    ['confirmed', 'cancelled'],
    provider: [],
  },
  confirmed: {
    tenant:   [],
    landlord: ['cancelled'],
    admin:    ['in_progress', 'cancelled'],
    provider: ['in_progress'],
  },
  in_progress: {
    tenant:   [],
    landlord: [],
    admin:    ['done', 'cancelled'],
    provider: ['done'],
  },
  done:      { tenant: [], landlord: [], admin: [], provider: [] },
  cancelled: { tenant: [], landlord: [], admin: [], provider: [] },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildPagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

const getCatalogEntry = (type) => SERVICE_CATALOG.find((s) => s.type === type);

// ─── Get Service Catalog ─────────────────────────────────────────────────────

const getServiceCatalog = () => SERVICE_CATALOG;

// ─── Create Service Order (tenant) ───────────────────────────────────────────

const createServiceOrder = async ({ property: propertyId, type, scheduledAt, note }, tenantId) => {
  const property = await Property.findOne({ _id: propertyId, isActive: true });
  if (!property) throw new AppError('Property not found', 404);

  const catalogEntry = getCatalogEntry(type);
  if (!catalogEntry) throw new AppError('Invalid service type', 400);

  const scheduled = new Date(scheduledAt);
  if (scheduled <= new Date()) {
    throw new AppError('Scheduled date must be in the future', 400);
  }

  return ServiceOrder.create({
    tenant: tenantId,
    property: propertyId,
    type,
    scheduledAt: scheduled,
    price: catalogEntry.price,
    note: note || null,
  });
};

// ─── Assign Provider (admin only) ────────────────────────────────────────────

const assignProvider = async (id, providerId) => {
  const order = await ServiceOrder.findById(id);
  if (!order) throw new AppError('Service order not found', 404);

  if (['done', 'cancelled'].includes(order.status)) {
    throw new AppError(`Cannot assign provider to a "${order.status}" order`, 400);
  }

  const provider = await User.findOne({ _id: providerId, role: 'provider', isActive: true });
  if (!provider) throw new AppError('Provider not found or inactive', 404);

  order.assignedProvider = providerId;
  await order.save();

  return order.populate('assignedProvider', 'name email phone avatar');
};

// ─── Update Order Status ──────────────────────────────────────────────────────

const updateOrderStatus = async (id, { status, cancelReason }, userId, userRole) => {
  const order = await ServiceOrder.findById(id);
  if (!order) throw new AppError('Service order not found', 404);

  // Provider chỉ được update đơn được gán cho mình
  if (userRole === 'provider') {
    if (!order.assignedProvider || order.assignedProvider.toString() !== userId) {
      throw new AppError('Access denied — this order is not assigned to you', 403);
    }
  }

  // Landlord chỉ được update đơn trên property của mình
  if (userRole === 'landlord') {
    const property = await Property.findOne({ _id: order.property, owner: userId });
    if (!property) throw new AppError('Access denied', 403);
  }

  const allowed = ALLOWED_TRANSITIONS[order.status]?.[userRole] ?? [];
  if (!allowed.includes(status)) {
    throw new AppError(
      `Role "${userRole}" cannot transition order from "${order.status}" to "${status}"`,
      400,
    );
  }

  order.status = status;
  if (status === 'cancelled' && cancelReason) {
    order.cancelReason = cancelReason;
  }
  await order.save();

  return order;
};

// ─── Get My Orders (tenant) ───────────────────────────────────────────────────

const getMyOrders = async (tenantId, { status, type, page = 1, limit = 10 }) => {
  const filter = { tenant: tenantId };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const [orders, total] = await Promise.all([
    ServiceOrder.find(filter)
      .populate('property', 'title address type images')
      .populate('assignedProvider', 'name phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    ServiceOrder.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get Provider Orders (provider) ──────────────────────────────────────────

const getProviderOrders = async (providerId, { status, type, page = 1, limit = 10 }) => {
  const filter = { assignedProvider: providerId };
  if (status) filter.status = status;
  if (type) filter.type = type;

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const [orders, total] = await Promise.all([
    ServiceOrder.find(filter)
      .populate('property', 'title address type')
      .populate('tenant', 'name phone avatar')
      .sort({ scheduledAt: 1 })
      .skip(skip)
      .limit(limitNum),
    ServiceOrder.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get All Orders (admin) ───────────────────────────────────────────────────

const getAllOrders = async ({ status, type, page = 1, limit = 10 }) => {
  const filter = {};
  if (status) filter.status = status;
  if (type) filter.type = type;

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const [orders, total] = await Promise.all([
    ServiceOrder.find(filter)
      .populate('tenant', 'name email phone avatar')
      .populate('property', 'title address type')
      .populate('assignedProvider', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    ServiceOrder.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

export {
  getServiceCatalog,
  createServiceOrder,
  assignProvider,
  updateOrderStatus,
  getMyOrders,
  getProviderOrders,
  getAllOrders,
};
