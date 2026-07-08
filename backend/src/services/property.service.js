import Property from '../models/property.model.js';
import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import Subscription from '../models/subscription.model.js';
import AppError from '../utils/app-error.js';
import { getActiveSubscription } from './subscription.service.js';
import { explainPropertyRecommendations } from './ai.service.js';
import { getMyPreference, scorePropertyAgainstPreference } from './preference.service.js';
import { attachMarketComparison } from './market-comparison.service.js';

// Batch-lookup badge cho danh sách ownerIds — 1 query duy nhất
const getBadgeMap = async (ownerIds) => {
  const subs = await Subscription.find({ landlord: { $in: ownerIds }, status: 'active' })
    .populate('plan', 'badge')
    .select('landlord plan');
  const map = {};
  for (const s of subs) {
    if (s.plan?.badge) map[s.landlord.toString()] = s.plan.badge;
  }
  return map;
};

const attachBadges = (properties, badgeMap) =>
  properties.map((p) => {
    const obj = p.toJSON();
    obj.ownerBadge = badgeMap[p.owner?._id?.toString() ?? p.owner?.toString()] ?? null;
    return obj;
  });

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── Public listing ──────────────────────────────────────────────────────────

const getProperties = async ({
  city, district, type, status,
  minPrice, maxPrice,
  bedrooms, bathrooms,
  search,
  sort = 'newest', page = 1, limit = 10,
}) => {
  const filter = { isActive: true };

  if (city) filter['address.city'] = { $regex: escapeRegex(city), $options: 'i' };
  if (district) filter['address.district'] = { $regex: escapeRegex(district), $options: 'i' };
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (bedrooms !== undefined) filter.bedrooms = parseInt(bedrooms);
  if (bathrooms !== undefined) filter.bathrooms = parseInt(bathrooms);

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
  };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [rawProperties, total] = await Promise.all([
    Property.find(filter)
      .populate('owner', 'name phone avatar')
      .sort({ isFeatured: -1, ...(sortMap[sort] || sortMap.newest) })
      .skip(skip)
      .limit(limitNum),
    Property.countDocuments(filter),
  ]);

  const ownerIds = [...new Set(rawProperties.map((p) => p.owner?._id?.toString()).filter(Boolean))];
  const badgeMap = await getBadgeMap(ownerIds);
  const properties = attachBadges(rawProperties, badgeMap);

  return {
    properties,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Owner's properties ──────────────────────────────────────────────────────

const getMyProperties = async (ownerId, { status, page = 1, limit = 10 }) => {
  // Chủ nhà thấy cả listing bị ẩn do subscription hết hạn (isActive: false + hiddenBySubscription: true)
  const filter = { owner: ownerId, $or: [{ isActive: true }, { hiddenBySubscription: true }] };
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [properties, total] = await Promise.all([
    Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Property.countDocuments(filter),
  ]);

  return {
    properties,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get by ID (increment views) ────────────────────────────────────────────

const getPropertyById = async (id, requestingUserId) => {
  const property = await Property.findOne({ _id: id, isActive: true })
    .populate('owner', 'name phone avatar');
  if (!property) throw new AppError('Property not found', 404);

  await Property.findByIdAndUpdate(id, { $inc: { views: 1 } });

  // Kiểm tra xem người dùng có quyền xem SĐT không
  let contactRevealed = false;
  if (requestingUserId) {
    const ownerId = property.owner?._id?.toString() ?? '';
    if (requestingUserId === ownerId) {
      contactRevealed = true; // Chủ nhà luôn thấy thông tin của mình
    } else {
      // Tenant phải có booking confirmed + đã thanh toán
      const qualified = await Booking.exists({
        property: id,
        tenant:   requestingUserId,
        status:   { $in: ['confirmed', 'active', 'completed'] },
        paymentStatus: 'paid',
      });
      contactRevealed = !!qualified;
    }
  }

  // Gắn badge của chủ nhà
  const badgeMap = await getBadgeMap([property.owner?._id?.toString()]);
  const propertyData = property.toJSON();
  propertyData.ownerBadge = badgeMap[property.owner?._id?.toString()] ?? null;

  if (!contactRevealed) {
    if (propertyData.owner)   propertyData.owner.phone   = null;
    if (propertyData.contact) propertyData.contact.phone = null;
  }

  return { property: propertyData, contactRevealed };
};

// ─── Create (goes live immediately) ─────────────────────────────────────────

const createProperty = async (data, ownerId) => {
  const owner = await User.findById(ownerId).select('bankAccount');
  if (!owner?.bankAccount?.bankName) {
    throw new AppError('Vui lòng thêm tài khoản ngân hàng trước khi đăng tin', 400);
  }

  // Kiểm tra giới hạn listing theo gói subscription
  const sub = await getActiveSubscription(ownerId);
  const { listingLimit } = sub.plan;
  if (listingLimit !== -1) {
    const activeCount = await Property.countDocuments({ owner: ownerId, isActive: true });
    if (activeCount >= listingLimit) {
      throw new AppError(
        `Gói ${sub.plan.name} chỉ cho phép tối đa ${listingLimit} tin đăng. Vui lòng nâng cấp gói để đăng thêm.`,
        403,
      );
    }
  }

  const {
    title, description, type, price, area,
    bedrooms, bathrooms,
    address, amenities, images, contact,
  } = data;

  return Property.create({
    title, description, type, price, area,
    bedrooms, bathrooms,
    address, amenities, images, contact,
    owner: ownerId,
  });
};

// ─── Update ──────────────────────────────────────────────────────────────────

const updateProperty = async (id, data, userId, userRole) => {
  const property = await Property.findOne({ _id: id, isActive: true });
  if (!property) throw new AppError('Property not found', 404);

  if (userRole === 'landlord' && property.owner.toString() !== userId) {
    throw new AppError('You can only update your own properties', 403);
  }

  const allowedFields = [
    'title', 'description', 'type', 'status', 'price', 'area',
    'bedrooms', 'bathrooms', 'address', 'amenities', 'images', 'contact',
  ];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) property[field] = data[field];
  });

  if (data.isFeatured !== undefined) {
    if (userRole === 'admin') {
      property.isFeatured = data.isFeatured;
    } else if (userRole === 'landlord') {
      property.isFeatured = data.isFeatured;
    }
  }

  await property.save();
  return property;
};

// ─── Delete (soft) — admin can reactively hide any listing ──────────────────

const deleteProperty = async (id, userId, userRole) => {
  const property = await Property.findOne({ _id: id, isActive: true });
  if (!property) throw new AppError('Property not found', 404);

  if (userRole === 'landlord' && property.owner.toString() !== userId) {
    throw new AppError('You can only delete your own properties', 403);
  }

  property.isActive = false;
  await property.save();
};

// ─── AI Recommendations (dựa trên hồ sơ tìm phòng) ──────────────────────────

const getRecommendedProperties = async (userId) => {
  // 1. Load preference profile — nếu không có thì trả về null để FE hiển thị form
  const preference = await getMyPreference(userId);
  if (!preference) return { properties: [], explanation: null, preference: null };

  // 2. Exclude properties user already has active bookings on
  const activeBookings = await Booking.find({
    tenant: userId,
    status: { $in: ['confirmed', 'active'] },
  }).select('property');
  const excludedIds = new Set(activeBookings.map((b) => b.property.toString()));

  // 3. Pre-filter candidates bằng MongoDB (tối ưu hiệu năng)
  const baseFilter = {
    isActive: true,
    status: 'available',
    ...(excludedIds.size && { _id: { $nin: [...excludedIds] } }),
  };

  // Giới hạn giá tối đa 130% budget (để còn tính điểm partial match)
  if (preference.budget?.max) {
    baseFilter.price = { $lte: preference.budget.max * 1.3 };
  }
  if (preference.preferredCity) {
    baseFilter['address.city'] = { $regex: escapeRegex(preference.preferredCity), $options: 'i' };
  }

  let candidates = await Property.find(baseFilter)
    .populate('owner', 'name phone avatar')
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(30);

  // Fallback: bỏ bộ lọc thành phố nếu quá ít kết quả
  if (candidates.length < 5 && preference.preferredCity) {
    const relaxed = { ...baseFilter };
    delete relaxed['address.city'];
    candidates = await Property.find(relaxed)
      .populate('owner', 'name phone avatar')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(30);
  }

  if (!candidates.length) return { properties: [], explanation: null, preference };

  // 4. Chấm điểm từng phòng và lọc thấp hơn 40%
  const scored = candidates
    .map((p) => ({ property: p, matchScore: scorePropertyAgainstPreference(p, preference) }))
    .filter((s) => s.matchScore >= 40)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  if (!scored.length) return { properties: [], explanation: null, preference };

  // 5. AI explanation — non-blocking
  let explanation = null;
  try {
    explanation = await explainPropertyRecommendations(
      userId,
      preference,
      scored.map((s) => ({ ...s.property.toObject(), matchScore: s.matchScore })),
    );
  } catch (err) {
    console.warn('[property] AI explanation skipped:', err.message);
  }

  // 6. Attach badges + gắn matchScore vào từng property
  const rawProps = scored.map((s) => s.property);
  const ownerIds = [...new Set(rawProps.map((p) => p.owner?._id?.toString()).filter(Boolean))];
  const badgeMap = await getBadgeMap(ownerIds);
  const withBadges = attachBadges(rawProps, badgeMap).map((p, i) => ({
    ...p,
    matchScore: scored[i].matchScore,
  }));

  // 7. So sánh giá với thị trường — chỉ trong luồng AI Gợi ý, không dùng ở listing công khai
  const properties = await attachMarketComparison(withBadges);

  return { properties, explanation, preference };
};

export {
  getProperties,
  getMyProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getRecommendedProperties,
};
