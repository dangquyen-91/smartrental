import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import Property from '../models/property.model.js';
import ServiceOrder from '../models/service-order.model.js';
import AppError from '../utils/app-error.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VALID_PERIODS = ['7d', '30d', '90d', '1y', 'week', 'month', 'year'];

// Booking trend granularity: 'day' | 'week' | 'month'
const VALID_GRANULARITIES = ['day', 'week', 'month'];

const parsePeriod = (period = '30d') => {
  const days = { '7d': 7, '30d': 30, '90d': 90, '1y': 365, week: 28, month: 90, year: 365 }[period] ?? 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  return { startDate, days };
};

const parseGranularity = (granularity = 'week') => {
  if (!VALID_GRANULARITIES.includes(granularity)) return 'week';
  return granularity;
};

// Returns a MongoDB aggregation expression that groups a date field by day/week/month
const dateGroupExpr = (field, granularity = 'day') => {
  const d = `$${field}`;
  if (granularity === 'day') return { $dateToString: { format: '%Y-%m-%d', date: d } };
  if (granularity === 'week') {
    return {
      $concat: [
        { $toString: { $isoWeekYear: d } },
        '-W',
        {
          $cond: [
            { $lte: [{ $isoWeek: d }, 9] },
            { $concat: ['0', { $toString: { $isoWeek: d } }] },
            { $toString: { $isoWeek: d } },
          ],
        },
      ],
    };
  }
  return { $dateToString: { format: '%Y-%m', date: d } };
};

const buildPagination = (page, limit, maxLimit = 100) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

// ─── Dashboard Overview ───────────────────────────────────────────────────────

export const getDashboardStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    userAgg,
    propertyAgg,
    bookingAgg,
    bookingRevMonth,
    bookingRevLastMonth,
    bookingRevTotal,
    serviceRevMonth,
    serviceRevLastMonth,
    serviceRevTotal,
    pendingPayoutsBooking,
    pendingPayoutsService,
    pendingRefunds,
    unassignedOrders,
  ] = await Promise.all([
    User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          newThisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', startOfMonth] }, 1, 0] } },
        },
      },
    ]),
    Property.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid', paidDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid', paidDate: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]),
    ServiceOrder.aggregate([
      { $match: { paymentStatus: 'paid', updatedAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]),
    ServiceOrder.aggregate([
      { $match: { paymentStatus: 'paid', updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]),
    ServiceOrder.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$platformFee' } } },
    ]),
    Booking.countDocuments({ paymentStatus: 'paid', payoutStatus: 'pending' }),
    ServiceOrder.countDocuments({ paymentStatus: 'paid', payoutStatus: 'pending' }),
    Booking.countDocuments({ status: 'cancelled', paymentStatus: 'paid' }),
    ServiceOrder.countDocuments({ status: { $in: ['pending', 'confirmed'] }, assignedProvider: null }),
  ]);

  const users = { total: 0, active: 0, newThisMonth: 0, byRole: {} };
  for (const row of userAgg) {
    users.byRole[row._id] = { total: row.total, active: row.active };
    users.total += row.total;
    users.active += row.active;
    users.newThisMonth += row.newThisMonth;
  }

  const properties = { total: 0, byStatus: {} };
  for (const row of propertyAgg) {
    properties.byStatus[row._id] = row.count;
    properties.total += row.count;
  }

  const bookings = { total: 0, byStatus: {} };
  for (const row of bookingAgg) {
    bookings.byStatus[row._id] = row.count;
    bookings.total += row.count;
  }

  const thisMonthRevenue = (bookingRevMonth[0]?.total ?? 0) + (serviceRevMonth[0]?.total ?? 0);
  const lastMonthRevenue = (bookingRevLastMonth[0]?.total ?? 0) + (serviceRevLastMonth[0]?.total ?? 0);
  const totalRevenue = (bookingRevTotal[0]?.total ?? 0) + (serviceRevTotal[0]?.total ?? 0);
  const revenueGrowth =
    lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 1000) / 10
      : null;

  return {
    users,
    properties,
    bookings,
    revenue: {
      total: totalRevenue,
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      growth: revenueGrowth,
    },
    pendingActions: {
      payouts: pendingPayoutsBooking + pendingPayoutsService,
      refunds: pendingRefunds,
      unassignedServiceOrders: unassignedOrders,
    },
  };
};

// ─── Revenue Analytics ────────────────────────────────────────────────────────

export const getRevenueAnalytics = async (period = '30d') => {
  if (!VALID_PERIODS.includes(period)) throw new AppError('Invalid period. Use: 7d, 30d, 90d, 1y', 400);
  const { startDate, days } = parsePeriod(period);

  const [bookingRevenue, serviceRevenue] = await Promise.all([
    Booking.aggregate([
      { $match: { paymentStatus: 'paid', paidDate: { $gte: startDate } } },
      {
        $group: {
          _id: dateGroupExpr('paidDate', days),
          platformFee: { $sum: '$platformFee' },
          grossRevenue: { $sum: '$totalPrice' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    ServiceOrder.aggregate([
      { $match: { paymentStatus: 'paid', updatedAt: { $gte: startDate } } },
      {
        $group: {
          _id: dateGroupExpr('updatedAt', days),
          platformFee: { $sum: '$platformFee' },
          grossRevenue: { $sum: '$price' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const dateSet = new Set([
    ...bookingRevenue.map((r) => r._id),
    ...serviceRevenue.map((r) => r._id),
  ]);

  const bMap = Object.fromEntries(bookingRevenue.map((r) => [r._id, r]));
  const sMap = Object.fromEntries(serviceRevenue.map((r) => [r._id, r]));

  const timeline = [...dateSet].sort().map((date) => ({
    date,
    booking: { fee: bMap[date]?.platformFee ?? 0, count: bMap[date]?.count ?? 0 },
    service: { fee: sMap[date]?.platformFee ?? 0, count: sMap[date]?.count ?? 0 },
    total: (bMap[date]?.platformFee ?? 0) + (sMap[date]?.platformFee ?? 0),
  }));

  const totals = {
    booking: bookingRevenue.reduce((s, r) => s + (r.platformFee ?? 0), 0),
    service: serviceRevenue.reduce((s, r) => s + (r.platformFee ?? 0), 0),
  };
  totals.total = totals.booking + totals.service;

  return { period, timeline, totals };
};

// ─── User Analytics ───────────────────────────────────────────────────────────

export const getUserAnalytics = async (period = '30d') => {
  if (!VALID_PERIODS.includes(period)) throw new AppError('Invalid period. Use: 7d, 30d, 90d, 1y', 400);
  const { startDate, days } = parsePeriod(period);

  const [growthTimeline, roleDistribution, authProviderDist, topLandlords] = await Promise.all([
    User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: dateGroupExpr('createdAt', days),
          total: { $sum: 1 },
          tenants: { $sum: { $cond: [{ $eq: ['$role', 'tenant'] }, 1, 0] } },
          landlords: { $sum: { $cond: [{ $eq: ['$role', 'landlord'] }, 1, 0] } },
          providers: { $sum: { $cond: [{ $eq: ['$role', 'provider'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      {
        $group: {
          _id: '$role',
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
        },
      },
    ]),
    User.aggregate([
      { $match: { role: { $ne: 'admin' } } },
      { $group: { _id: '$authProvider', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$landlord',
          totalPayout: { $sum: '$landlordPayout' },
          bookingCount: { $sum: 1 },
        },
      },
      { $sort: { totalPayout: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'landlord' } },
      { $unwind: '$landlord' },
      {
        $project: {
          _id: 0,
          landlordId: '$_id',
          name: '$landlord.name',
          email: '$landlord.email',
          avatar: '$landlord.avatar',
          totalPayout: 1,
          bookingCount: 1,
        },
      },
    ]),
  ]);

  return {
    period,
    growth: growthTimeline,
    distribution: {
      byRole: Object.fromEntries(
        roleDistribution.map((r) => [r._id, { total: r.total, active: r.active }]),
      ),
      byAuthProvider: Object.fromEntries(authProviderDist.map((r) => [r._id, r.count])),
    },
    topLandlords,
  };
};

// ─── Booking Analytics ────────────────────────────────────────────────────────

export const getBookingAnalytics = async (period = '30d', granularity = 'week') => {
  if (!VALID_PERIODS.includes(period)) throw new AppError('Invalid period. Use: 7d, 30d, 90d, 1y, week, month, year', 400);
  const { startDate, days } = parsePeriod(period);
  const gran = parseGranularity(granularity);

  const       [timeline, statusDist, cancellationByActor, avgDuration, revenueByPropertyType] =
    await Promise.all([
      Booking.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: dateGroupExpr('createdAt', gran),
            total: { $sum: 1 },
            confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            revenue: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$platformFee', 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Booking.aggregate([
        { $match: { status: 'cancelled', cancelledBy: { $ne: null } } },
        { $group: { _id: '$cancelledBy', count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, avg: { $avg: '$duration' } } },
      ]),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $lookup: { from: 'properties', localField: 'property', foreignField: '_id', as: 'prop' } },
        { $unwind: '$prop' },
        {
          $group: {
            _id: '$prop.type',
            count: { $sum: 1 },
            revenue: { $sum: '$platformFee' },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

  const total = statusDist.reduce((s, r) => s + r.count, 0);
  const completedCount = statusDist.find((r) => r._id === 'completed')?.count ?? 0;
  const cancelledCount = statusDist.find((r) => r._id === 'cancelled')?.count ?? 0;

  return {
    period,
    granularity: gran,
    timeline,
    summary: {
      byStatus: Object.fromEntries(statusDist.map((r) => [r._id, r.count])),
      completionRate: total > 0 ? Math.round((completedCount / total) * 1000) / 10 : 0,
      cancellationRate: total > 0 ? Math.round((cancelledCount / total) * 1000) / 10 : 0,
      avgDurationMonths: avgDuration[0]?.avg ? Math.round(avgDuration[0].avg * 10) / 10 : null,
      cancellationByActor: Object.fromEntries(cancellationByActor.map((r) => [r._id, r.count])),
    },
    revenueByPropertyType,
  };
};

// ─── Service Analytics ────────────────────────────────────────────────────────

export const getServiceAnalytics = async (period = '30d') => {
  if (!VALID_PERIODS.includes(period)) throw new AppError('Invalid period. Use: 7d, 30d, 90d, 1y', 400);
  const { startDate, days } = parsePeriod(period);

  const [timeline, byType, statusDist, topProviders] = await Promise.all([
    ServiceOrder.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: dateGroupExpr('createdAt', days),
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          revenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$platformFee', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    ServiceOrder.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          revenue: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$platformFee', 0] },
          },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]),
    ServiceOrder.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ServiceOrder.aggregate([
      { $match: { assignedProvider: { $ne: null }, status: 'done' } },
      {
        $group: {
          _id: '$assignedProvider',
          ordersCompleted: { $sum: 1 },
          totalPayout: { $sum: '$providerPayout' },
        },
      },
      { $sort: { ordersCompleted: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'provider' } },
      { $unwind: '$provider' },
      {
        $project: {
          _id: 0,
          providerId: '$_id',
          name: '$provider.name',
          email: '$provider.email',
          avatar: '$provider.avatar',
          ordersCompleted: 1,
          totalPayout: 1,
        },
      },
    ]),
  ]);

  const total = statusDist.reduce((s, r) => s + r.count, 0);
  const doneCount = statusDist.find((r) => r._id === 'done')?.count ?? 0;

  return {
    period,
    timeline,
    byType,
    summary: {
      byStatus: Object.fromEntries(statusDist.map((r) => [r._id, r.count])),
      completionRate: total > 0 ? Math.round((doneCount / total) * 1000) / 10 : 0,
    },
    topProviders,
  };
};

// ─── Property Analytics ───────────────────────────────────────────────────────

export const getPropertyAnalytics = async () => {
  const [byStatus, byType, byCity, topViewed, occupancyAgg] = await Promise.all([
    Property.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Property.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          featured: { $sum: { $cond: ['$isFeatured', 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Property.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$address.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Property.find({ isActive: true })
      .sort({ views: -1 })
      .limit(10)
      .select('title type address price views isFeatured status')
      .lean(),
    Property.aggregate([
      { $match: { isActive: true, status: { $in: ['available', 'rented'] } } },
      {
        $group: {
          _id: null,
          available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          rented: { $sum: { $cond: [{ $eq: ['$status', 'rented'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const occ = occupancyAgg[0] ?? {};
  const occupancyRate =
    (occ.available ?? 0) + (occ.rented ?? 0) > 0
      ? Math.round(((occ.rented ?? 0) / ((occ.available ?? 0) + (occ.rented ?? 0))) * 1000) / 10
      : 0;

  return {
    byStatus: Object.fromEntries(byStatus.map((r) => [r._id, r.count])),
    byType: byType.map((r) => ({
      type: r._id,
      count: r.count,
      avgPrice: Math.round(r.avgPrice ?? 0),
      featured: r.featured,
    })),
    byCity: byCity.map((r) => ({ city: r._id, count: r.count })),
    topViewed: topViewed.map((p) => ({ ...p, id: p._id, _id: undefined })),
    occupancyRate,
  };
};

// ─── User Management ──────────────────────────────────────────────────────────

export const getAdminUsers = async ({ page, limit, role, search, isActive } = {}) => {
  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const filter = { role: { $ne: 'admin' } };
  if (role && ['tenant', 'landlord', 'provider'].includes(role)) filter.role = role;
  if (isActive !== undefined && isActive !== '') {
    filter.isActive = isActive === 'true' || isActive === true;
  }
  if (search?.trim()) {
    const rx = { $regex: search.trim(), $options: 'i' };
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

export const updateUserStatus = async (id, isActive) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Cannot modify admin account', 403);

  user.isActive = isActive;
  await user.save();
  return user;
};

export const updateUserRole = async (id, role) => {
  const ALLOWED = ['tenant', 'landlord', 'provider'];
  if (!ALLOWED.includes(role)) throw new AppError(`Role must be one of: ${ALLOWED.join(', ')}`, 400);

  const user = await User.findById(id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'admin') throw new AppError('Cannot modify admin account', 403);

  user.role = role;
  await user.save();
  return user;
};

// ─── Property Management ──────────────────────────────────────────────────────

export const getAdminProperties = async ({ page, limit, status, type, search } = {}) => {
  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const filter = { isActive: true };
  if (status && ['available', 'rented', 'maintenance'].includes(status)) filter.status = status;
  if (type && ['room', 'apartment', 'house', 'studio'].includes(type)) filter.type = type;
  if (search?.trim()) {
    const rx = { $regex: search.trim(), $options: 'i' };
    filter.$or = [{ title: rx }, { 'address.city': rx }, { 'address.district': rx }];
  }

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('owner', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Property.countDocuments(filter),
  ]);

  return {
    properties,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

export const togglePropertyFeatured = async (id) => {
  const property = await Property.findOne({ _id: id, isActive: true });
  if (!property) throw new AppError('Property not found', 404);
  property.isFeatured = !property.isFeatured;
  await property.save();
  return property;
};

export const updatePropertyStatus = async (id, status) => {
  const VALID = ['available', 'rented', 'maintenance'];
  if (!VALID.includes(status)) throw new AppError(`Status must be one of: ${VALID.join(', ')}`, 400);

  const property = await Property.findOne({ _id: id, isActive: true });
  if (!property) throw new AppError('Property not found', 404);
  property.status = status;
  await property.save();
  return property;
};

// ─── Pending Actions ──────────────────────────────────────────────────────────

export const getPendingPayouts = async ({ page, limit } = {}) => {
  const { pageNum, limitNum, skip } = buildPagination(page, limit, 50);

  const [bookingItems, serviceItems, bookingTotal, serviceTotal] = await Promise.all([
    Booking.find({ paymentStatus: 'paid', payoutStatus: 'pending' })
      .populate('property', 'title address')
      .populate('landlord', 'name email bankAccount')
      .sort({ paidDate: 1 })
      .skip(skip)
      .limit(limitNum),
    ServiceOrder.find({ paymentStatus: 'paid', payoutStatus: 'pending' })
      .populate('property', 'title address')
      .populate('assignedProvider', 'name email bankAccount')
      .sort({ updatedAt: 1 })
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments({ paymentStatus: 'paid', payoutStatus: 'pending' }),
    ServiceOrder.countDocuments({ paymentStatus: 'paid', payoutStatus: 'pending' }),
  ]);

  return {
    bookings: { items: bookingItems, total: bookingTotal },
    services: { items: serviceItems, total: serviceTotal },
    totalPending: bookingTotal + serviceTotal,
    pagination: { page: pageNum, limit: limitNum },
  };
};

export const getPendingRefunds = async ({ page, limit } = {}) => {
  const { pageNum, limitNum, skip } = buildPagination(page, limit, 50);

  const [items, total] = await Promise.all([
    Booking.find({ status: 'cancelled', paymentStatus: 'paid' })
      .populate('property', 'title address')
      .populate('tenant', 'name email bankAccount')
      .sort({ updatedAt: 1 })
      .skip(skip)
      .limit(limitNum),
    Booking.countDocuments({ status: 'cancelled', paymentStatus: 'paid' }),
  ]);

  return {
    items,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};
