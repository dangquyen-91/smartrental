import ServiceOrder from '../models/service-order.model.js';
import ServiceCatalog from '../models/service-catalog.model.js';
import Property from '../models/property.model.js';
import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';

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
    provider: ['in_progress', 'cancelled'],
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

// ─── Get Service Catalog (từ DB) ─────────────────────────────────────────────

const getServiceCatalog = async () => {
  return ServiceCatalog.find({ isActive: true }).sort({ type: 1 });
};

// ─── Admin: Update giá/tên dịch vụ ───────────────────────────────────────────

const updateCatalogEntry = async (type, { name, price, unit, isActive }) => {
  const entry = await ServiceCatalog.findOne({ type });
  if (!entry) throw new AppError('Service type not found', 404);

  if (name     !== undefined) entry.name     = name;
  if (price    !== undefined) entry.price    = price;
  if (unit     !== undefined) entry.unit     = unit;
  if (isActive !== undefined) entry.isActive = isActive;

  await entry.save();
  return entry;
};

// ─── Create Service Order (tenant) ───────────────────────────────────────────

const createServiceOrder = async ({ property: propertyId, type, scheduledAt, note }, tenantId) => {
  const property = await Property.findOne({ _id: propertyId, isActive: true });
  if (!property) throw new AppError('Property not found', 404);

  // Tenant phải có booking active tại property này
  // TODO: re-enable in production
  // const activeBooking = await Booking.findOne({
  //   property: propertyId,
  //   tenant:   tenantId,
  //   status:   'active',
  // });
  // if (!activeBooking) {
  //   throw new AppError('You must have an active booking at this property to order services', 403);
  // }

  const catalogEntry = await ServiceCatalog.findOne({ type, isActive: true });
  if (!catalogEntry) throw new AppError('Service type not available', 400);

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
  if (order.paymentStatus !== 'paid') {
    throw new AppError('Cannot assign provider before tenant has paid', 400);
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

const getMyOrders = async (tenantId, { status, type, propertyId, page = 1, limit = 10 }) => {
  const filter = { tenant: tenantId };
  if (status)     filter.status   = status;
  if (type)       filter.type     = type;
  if (propertyId) filter.property = propertyId;

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

// ─── Get Landlord Orders (landlord — orders tại properties của mình) ─────────

const getLandlordOrders = async (landlordId, { status, type, propertyId, page = 1, limit = 10 }) => {
  const ownedProperties = await Property.find({ owner: landlordId, isActive: true }).select('_id');
  const propertyIds     = ownedProperties.map((p) => p._id);

  const filter = { property: propertyId ? propertyId : { $in: propertyIds } };
  if (status) filter.status = status;
  if (type)   filter.type   = type;

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const [orders, total] = await Promise.all([
    ServiceOrder.find(filter)
      .populate('property', 'title address type images')
      .populate('tenant', 'name phone avatar')
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

const getProviderOrders = async (providerId, { status, type, propertyId, page = 1, limit = 10 }) => {
  const filter = { assignedProvider: providerId };
  if (status)     filter.status   = status;
  if (type)       filter.type     = type;
  if (propertyId) filter.property = propertyId;

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

const getAllOrders = async ({ status, type, propertyId, page = 1, limit = 10 }) => {
  const filter = {};
  if (status)     filter.status   = status;
  if (type)       filter.type     = type;
  if (propertyId) filter.property = propertyId;

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

// ─── Mark Refund (admin only) ────────────────────────────────────────────────
// Dùng khi order bị huỷ sau khi tenant đã thanh toán.
// Việc hoàn tiền thực tế (bank transfer) do admin thực hiện thủ công.

const markRefund = async (id) => {
  const order = await ServiceOrder.findById(id);
  if (!order) throw new AppError('Service order not found', 404);

  if (order.paymentStatus !== 'paid') {
    throw new AppError('Only paid orders can be refunded', 400);
  }
  if (order.paymentStatus === 'refunded') {
    throw new AppError('Order has already been refunded', 400);
  }
  if (order.status !== 'cancelled') {
    throw new AppError('Order must be cancelled before refund can be marked', 400);
  }

  order.paymentStatus = 'refunded';
  order.payoutStatus  = 'none';
  order.platformFee   = null;
  order.providerPayout = null;
  await order.save();

  return order;
};

// ─── Mark Payout (admin only) ─────────────────────────────────────────────────

const markPayout = async (id) => {
  const order = await ServiceOrder.findById(id);
  if (!order) throw new AppError('Service order not found', 404);

  if (order.paymentStatus !== 'paid') {
    throw new AppError('Order has not been paid yet', 400);
  }
  if (order.payoutStatus === 'paid') {
    throw new AppError('Payout already marked as paid', 400);
  }
  if (!order.assignedProvider) {
    throw new AppError('No provider assigned to this order', 400);
  }

  order.payoutStatus = 'paid';
  order.payoutDate   = new Date();
  await order.save();

  return order.populate('assignedProvider', 'name email phone avatar');
};

export {
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
};
