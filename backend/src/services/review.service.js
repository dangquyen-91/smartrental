import mongoose from 'mongoose';
import Review from '../models/review.model.js';
import Booking from '../models/booking.model.js';
import Property from '../models/property.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/app-error.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildPagination = (page, limit) => {
  const pageNum  = Math.max(1, parseInt(page)  || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

// Business rule: only tenants can review, only properties
const ALLOWED_TARGETS = {
  tenant: ['property'],
};

// ─── Create Review ────────────────────────────────────────────────────────────

const createReview = async (reviewerId, reviewerRole, { bookingId, targetType, rating, comment }) => {
  const allowed = ALLOWED_TARGETS[reviewerRole];
  if (!allowed?.includes(targetType)) {
    throw new AppError(
      `A ${reviewerRole} can only review: ${allowed?.join(', ') ?? 'nothing'}`,
      400,
    );
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);

  if (booking.status !== 'completed') {
    throw new AppError('Reviews can only be submitted after the booking is completed', 400);
  }

  // Verify the reviewer actually belongs to this booking
  const isTenant   = booking.tenant.toString()   === reviewerId;
  const isLandlord = booking.landlord.toString()  === reviewerId;

  if (reviewerRole === 'tenant'   && !isTenant)   throw new AppError('Access denied', 403);
  if (reviewerRole === 'landlord' && !isLandlord) throw new AppError('Access denied', 403);

  // Resolve target ObjectId from booking — ensures target is real, not user-supplied
  const targetMap = {
    property: booking.property,
    landlord: booking.landlord,
    tenant:   booking.tenant,
  };
  const targetId = targetMap[targetType];

  if (targetId.toString() === reviewerId) {
    throw new AppError('You cannot review yourself', 400);
  }

  try {
    const review = await Review.create({
      booking:      bookingId,
      reviewer:     reviewerId,
      reviewerRole,
      targetType,
      target:       targetId,
      rating,
      comment:      comment?.trim() || null,
    });

    return review.populate('reviewer', 'name avatar');
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(
        `You have already submitted a ${targetType} review for this booking`,
        409,
      );
    }
    throw err;
  }
};

// ─── Get Reviews for a Property ───────────────────────────────────────────────

const getPropertyReviews = async (propertyId, { page = 1, limit = 10 }) => {
  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const id     = new mongoose.Types.ObjectId(propertyId);
  const filter = { targetType: 'property', target: id, isDeleted: false };

  const [reviews, total, ratingAgg] = await Promise.all([
    Review.find(filter)
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: filter },
      {
        $group: {
          _id:     null,
          average: { $avg: '$rating' },
          count:   { $sum: 1 },
          dist: {
            $push: '$rating',
          },
        },
      },
    ]),
  ]);

  const agg = ratingAgg[0];
  const ratingDistribution = agg
    ? [1, 2, 3, 4, 5].reduce((acc, star) => {
        acc[star] = agg.dist.filter((r) => r === star).length;
        return acc;
      }, {})
    : null;

  return {
    reviews,
    averageRating:       agg ? Math.round(agg.average * 10) / 10 : null,
    totalReviews:        total,
    ratingDistribution,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get Reviews About a User (landlord or tenant) ───────────────────────────
// Public — used for user profile pages

const getUserReviews = async (targetUserId, { page = 1, limit = 10, targetType } = {}) => {
  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const id     = new mongoose.Types.ObjectId(targetUserId);
  const typeFilter = ['landlord', 'tenant'].includes(targetType)
    ? targetType
    : { $in: ['landlord', 'tenant'] };

  const filter = { target: id, targetType: typeFilter, isDeleted: false };

  const [reviews, total, ratingAgg] = await Promise.all([
    Review.find(filter)
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: { target: id, targetType: typeFilter, isDeleted: false } },
      {
        $group: {
          _id:     '$targetType',
          average: { $avg: '$rating' },
          count:   { $sum: 1 },
        },
      },
    ]),
  ]);

  // Build per-role averages (landlord / tenant)
  const ratingByRole = {};
  let totalAvgSum = 0, totalAvgCount = 0;
  for (const row of ratingAgg) {
    const avg = Math.round(row.average * 10) / 10;
    ratingByRole[row._id] = { average: avg, count: row.count };
    totalAvgSum   += row.average * row.count;
    totalAvgCount += row.count;
  }
  const overallAvg = totalAvgCount > 0
    ? Math.round((totalAvgSum / totalAvgCount) * 10) / 10
    : null;

  return {
    reviews,
    averageRating: overallAvg,
    ratingByRole,
    totalReviews:  total,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get Reviews for a Booking ────────────────────────────────────────────────

const getBookingReviews = async (bookingId, userId, userRole) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new AppError('Booking not found', 404);

  const isOwner =
    booking.tenant.toString()   === userId ||
    booking.landlord.toString() === userId;

  if (userRole !== 'admin' && !isOwner) throw new AppError('Access denied', 403);

  const reviews = await Review.find({ booking: bookingId, isDeleted: false })
    .populate('reviewer', 'name avatar role');

  return reviews.map((r) => ({
    ...r.toJSON(),
    isOwn: r.reviewer._id.toString() === userId,
  }));
};

// ─── Get Reviews Written by Me ────────────────────────────────────────────────

const getMyReviews = async (reviewerId, { page = 1, limit = 10 } = {}) => {
  const { pageNum, limitNum, skip } = buildPagination(page, limit);
  const filter = { reviewer: reviewerId, isDeleted: false };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('booking', 'startDate endDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments(filter),
  ]);

  return {
    reviews,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Get All Reviews Across Landlord's Properties ────────────────────────────

const getMyPropertiesReviews = async (landlordId, { page = 1, limit = 10 } = {}) => {
  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const properties = await Property.find({ owner: landlordId, isActive: true }).select('_id');
  const propertyIds = properties.map((p) => p._id);

  if (!propertyIds.length) {
    return {
      reviews: [],
      totalReviews: 0,
      pagination: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
    };
  }

  const filter = { target: { $in: propertyIds }, targetType: 'property', isDeleted: false };

  const [reviews, total, ratingAgg] = await Promise.all([
    Review.find(filter)
      .populate('reviewer', 'name avatar')
      .populate('target', 'title type status price area bedrooms bathrooms address images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments(filter),
    Review.aggregate([
      { $match: filter },
      { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
  ]);

  const agg = ratingAgg[0];

  return {
    reviews,
    averageRating: agg ? Math.round(agg.average * 10) / 10 : null,
    totalReviews:  total,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Delete Review (Admin — soft delete) ─────────────────────────────────────

const deleteReview = async (reviewId, adminId) => {
  const review = await Review.findById(reviewId);
  if (!review)           throw new AppError('Review not found', 404);
  if (review.isDeleted)  throw new AppError('Review has already been deleted', 400);

  review.isDeleted = true;
  review.deletedAt = new Date();
  review.deletedBy = adminId;
  await review.save();

  return review;
};

// ─── Get All Reviews (Admin) ──────────────────────────────────────────────────

const getAllReviews = async ({ page = 1, limit = 20, targetType, includeDeleted = false } = {}) => {
  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const filter = {};
  if (!includeDeleted || includeDeleted === 'false') filter.isDeleted = false;
  if (['property', 'landlord', 'tenant'].includes(targetType)) filter.targetType = targetType;

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('reviewer', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Review.countDocuments(filter),
  ]);

  // ── Batch-populate target (polymorphic: Property or User) ──────────────────
  const propertyIds = reviews
    .filter((r) => r.targetType === 'property')
    .map((r) => r.target);
  const userIds = reviews
    .filter((r) => r.targetType !== 'property')
    .map((r) => r.target);

  const [properties, users] = await Promise.all([
    propertyIds.length
      ? Property.find({ _id: { $in: propertyIds } }).select('title address').lean()
      : [],
    userIds.length
      ? User.find({ _id: { $in: userIds } }).select('name email avatar').lean()
      : [],
  ]);

  const propMap = Object.fromEntries(properties.map((p) => [p._id.toString(), p]));
  const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]));

  const enriched = reviews.map((r) => {
    // toJSON() runs the schema transform (maps _id → id, strips isDeleted etc.)
    const obj = r.toJSON();
    obj.targetRef =
      r.targetType === 'property'
        ? propMap[r.target.toString()] ?? null
        : userMap[r.target.toString()] ?? null;
    return obj;
  });

  return {
    data: enriched,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

export {
  createReview,
  getPropertyReviews,
  getUserReviews,
  getBookingReviews,
  getMyReviews,
  getMyPropertiesReviews,
  deleteReview,
  getAllReviews,
};
