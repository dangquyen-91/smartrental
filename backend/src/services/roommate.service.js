import { RoommateProfile, RoommateRequest } from '../models/roommate.model.js';
import AppError from '../utils/app-error.js';
import { explainRoommateMatch } from './ai.service.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildPagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

/**
 * Score compatibility between current user's profile and a candidate.
 * Max score = 100
 *
 * Budget overlap is guaranteed by DB pre-filter, but we still compute partial
 * score here for weighted ranking (wider overlap → higher sub-score).
 */
const computeScore = (mine, candidate) => {
  let score = 0;

  // Budget overlap depth: +10 base if overlap exists, +20 bonus if significant
  const overlapMin = Math.max(mine.budget.min, candidate.budget.min);
  const overlapMax = Math.min(mine.budget.max, candidate.budget.max);
  if (overlapMax >= overlapMin) {
    const myRange = mine.budget.max - mine.budget.min || 1;
    const overlapRatio = (overlapMax - overlapMin) / myRange;
    score += overlapRatio >= 0.5 ? 30 : 15;
  }

  // Gender preference — +20 pts
  const genderOk =
    mine.gender === 'any' ||
    candidate.gender === 'any' ||
    mine.gender === candidate.gender;
  if (genderOk) score += 20;

  // Schedule — +15 pts
  if (
    mine.schedule === candidate.schedule ||
    mine.schedule === 'flexible' ||
    candidate.schedule === 'flexible'
  ) {
    score += 15;
  }

  // Lifestyle — +15 pts
  if (
    mine.lifestyle === candidate.lifestyle ||
    mine.lifestyle === 'mixed' ||
    candidate.lifestyle === 'mixed'
  ) {
    score += 15;
  }

  // Cleanliness — +10 pts (neat↔neat or average is the middle ground)
  if (
    mine.cleanliness === candidate.cleanliness ||
    mine.cleanliness === 'average' ||
    candidate.cleanliness === 'average'
  ) {
    score += 10;
  }

  // Pets tolerance — +5 pts
  if (mine.pets === candidate.pets) score += 5;

  // Smoking tolerance — +5 pts
  if (mine.smoking === candidate.smoking) score += 5;
  // Max score: 30 + 20 + 15 + 15 + 10 + 5 + 5 = 100

  return score;
};

// ─── Upsert Profile ──────────────────────────────────────────────────────────

const upsertProfile = async (userId, data) => {
  if (data.budget && data.budget.min > data.budget.max) {
    throw new AppError('Budget min must be less than or equal to max', 400);
  }

  const profile = await RoommateProfile.findOneAndUpdate(
    { user: userId },
    { ...data, user: userId },
    { returnDocument: 'after', upsert: true, runValidators: true }
  )
    .populate('user', 'name avatar gender')
    .populate('property', 'title address');

  return profile;
};

// ─── Get My Profile ──────────────────────────────────────────────────────────

const getMyProfile = async (userId) => {
  const profile = await RoommateProfile.findOne({ user: userId })
    .populate('user', 'name avatar gender phone')
    .populate('property', 'title address price');

  if (!profile) throw new AppError('Roommate profile not found', 404);
  return profile;
};

// ─── Get User Profile (with relationship-based access control) ───────────────
//
// Rules:
//   - Accepted request → reveal contact (phone, email)
//   - Pending request  → show profile, no contact, flag requestStatus
//   - No relationship  → show public profile only (bio, preferences)
//   - Rejected/cancelled → show public profile only

const getUserProfile = async (viewerId, targetUserId) => {
  if (viewerId === targetUserId) return getMyProfile(viewerId);

  const [profile, relationship] = await Promise.all([
    RoommateProfile.findOne({ user: targetUserId })
      .populate('user', 'name avatar gender')
      .populate('property', 'title address price images type'),
    RoommateRequest.findOne({
      $or: [
        { sender: viewerId, receiver: targetUserId },
        { sender: targetUserId, receiver: viewerId },
      ],
    }),
  ]);

  if (!profile) throw new AppError('Roommate profile not found', 404);

  const contactRevealed = relationship?.status === 'accepted';
  const requestStatus = relationship?.status ?? null;

  if (contactRevealed) {
    // Re-fetch with contact fields exposed
    const fullProfile = await RoommateProfile.findOne({ user: targetUserId })
      .populate('user', 'name avatar gender phone email')
      .populate('property', 'title address price images type');
    return { ...fullProfile.toJSON(), contactRevealed: true, requestStatus };
  }

  return { ...profile.toJSON(), contactRevealed: false, requestStatus };
};

// ─── Delete My Profile ───────────────────────────────────────────────────────

const deleteMyProfile = async (userId) => {
  const profile = await RoommateProfile.findOneAndDelete({ user: userId });
  if (!profile) throw new AppError('Roommate profile not found', 404);
};

// ─── Get Matches ─────────────────────────────────────────────────────────────
//
// Production approach:
//   1. Pre-filter in MongoDB: same city (if set), looking: true, budget overlap
//   2. Score + filter by minScore in JS (on the already-reduced set)
//   3. Paginate after scoring
//   4. Annotate each match with the viewer's current request status

const getMatches = async (userId, { page = 1, limit = 10, minScore = 40 } = {}) => {
  const mine = await RoommateProfile.findOne({ user: userId });
  if (!mine) throw new AppError('Create your roommate profile first', 404);
  if (!mine.looking) throw new AppError('Set your profile to "looking" to see matches', 400);

  const { pageNum, limitNum, skip } = buildPagination(page, limit);
  const threshold = Math.min(100, Math.max(0, parseInt(minScore) || 40));

  // DB pre-filter: budget overlap guaranteed, city scoped if provided
  // Duration filter: exclude hard conflicts (short↔long), flexible matches all
  const durationFilter =
    mine.duration && mine.duration !== 'flexible'
      ? { $or: [{ duration: mine.duration }, { duration: 'flexible' }, { duration: { $exists: false } }] }
      : {};

  const preFilter = {
    user: { $ne: userId },
    looking: true,
    'budget.min': { $lte: mine.budget.max },
    'budget.max': { $gte: mine.budget.min },
    ...(mine.city ? { city: mine.city } : {}),
    ...durationFilter,
  };

  // Fetch my active requests in parallel with candidates
  const [candidates, myRequests] = await Promise.all([
    RoommateProfile.find(preFilter)
      .populate('user', 'name avatar gender')
      .populate('property', 'title address price'),
    RoommateRequest.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: { $in: ['pending', 'accepted'] },
    }).select('sender receiver status'),
  ]);

  // Build otherUserId → requestStatus map
  const requestMap = new Map();
  for (const req of myRequests) {
    const otherId =
      req.sender.toString() === userId
        ? req.receiver.toString()
        : req.sender.toString();
    requestMap.set(otherId, req.status);
  }

  // Score, filter by threshold, sort descending
  const scored = candidates
    .map((c) => ({ profile: c, score: computeScore(mine, c) }))
    .filter((c) => c.score >= threshold)
    .sort((a, b) => b.score - a.score);

  const total = scored.length;
  const paginated = scored.slice(skip, skip + limitNum);

  return {
    matches: paginated.map(({ profile, score }) => ({
      ...profile.toJSON(),
      matchScore: score,
      requestStatus: requestMap.get(profile.user?._id?.toString() ?? profile.user.toString()) ?? null,
    })),
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Send Request ────────────────────────────────────────────────────────────

const sendRequest = async (senderId, receiverId, message) => {
  if (senderId === receiverId) {
    throw new AppError('You cannot send a request to yourself', 400);
  }

  // Sender must have an active profile
  const senderProfile = await RoommateProfile.findOne({ user: senderId });
  if (!senderProfile) {
    throw new AppError('Create your roommate profile before sending requests', 400);
  }
  if (!senderProfile.looking) {
    throw new AppError('Set your profile to "looking" before sending requests', 400);
  }

  const receiverProfile = await RoommateProfile.findOne({ user: receiverId, looking: true });
  if (!receiverProfile) throw new AppError('User is not currently looking for a roommate', 404);

  // Prevent duplicate active requests
  const existing = await RoommateRequest.findOne({ sender: senderId, receiver: receiverId });
  if (existing) {
    if (existing.status === 'pending') throw new AppError('You already sent a request to this user', 409);
    if (existing.status === 'accepted') throw new AppError('You are already matched with this user', 409);
    // Allow re-send if previously rejected or cancelled
    existing.status = 'pending';
    existing.message = message || null;
    await existing.save();
    return existing.populate([
      { path: 'sender', select: 'name avatar' },
      { path: 'receiver', select: 'name avatar' },
    ]);
  }

  const request = await RoommateRequest.create({
    sender: senderId,
    receiver: receiverId,
    message: message || null,
  });

  return request.populate([
    { path: 'sender', select: 'name avatar' },
    { path: 'receiver', select: 'name avatar' },
  ]);
};

// ─── Respond to Request ──────────────────────────────────────────────────────

const respondRequest = async (requestId, receiverId, action) => {
  const request = await RoommateRequest.findById(requestId);
  if (!request) throw new AppError('Request not found', 404);

  if (request.receiver.toString() !== receiverId) {
    throw new AppError('Access denied', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Request is already "${request.status}"`, 400);
  }

  request.status = action; // 'accepted' | 'rejected'
  await request.save();

  return request.populate([
    { path: 'sender', select: 'name avatar' },
    { path: 'receiver', select: 'name avatar' },
  ]);
};

// ─── Cancel Request (sender) ─────────────────────────────────────────────────

const cancelRequest = async (requestId, senderId) => {
  const request = await RoommateRequest.findById(requestId);
  if (!request) throw new AppError('Request not found', 404);

  if (request.sender.toString() !== senderId) {
    throw new AppError('Access denied', 403);
  }

  if (request.status !== 'pending') {
    throw new AppError(`Cannot cancel a request with status "${request.status}"`, 400);
  }

  request.status = 'cancelled';
  await request.save();

  return request.populate([
    { path: 'sender', select: 'name avatar' },
    { path: 'receiver', select: 'name avatar' },
  ]);
};

// ─── Get My Requests ─────────────────────────────────────────────────────────

const getMyRequests = async (userId, { type = 'received', status, page = 1, limit = 10 }) => {
  const filter = {};
  if (type === 'sent') filter.sender = userId;
  else filter.receiver = userId;
  if (status) filter.status = status;

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  const [requests, total] = await Promise.all([
    RoommateRequest.find(filter)
      .populate('sender', 'name avatar email phone')
      .populate('receiver', 'name avatar email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    RoommateRequest.countDocuments(filter),
  ]);

  // Strip contact from non-accepted requests regardless of query filter
  const sanitized = requests.map((req) => {
    const r = req.toJSON();
    if (r.status !== 'accepted') {
      if (r.sender)   { delete r.sender.email;   delete r.sender.phone; }
      if (r.receiver) { delete r.receiver.email; delete r.receiver.phone; }
    }
    return r;
  });

  return {
    requests: sanitized,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Explain Match (AI) ──────────────────────────────────────────────────────
//
// Guard: both users must have active profiles and a non-zero score.
// Contact is never revealed here — AI explanation is purely preference-based.

const explainMatch = async (userId, targetUserId) => {
  if (userId === targetUserId) throw new AppError('Cannot explain match with yourself', 400);

  const [mine, candidate] = await Promise.all([
    RoommateProfile.findOne({ user: userId }).populate('user', 'name'),
    RoommateProfile.findOne({ user: targetUserId, looking: true }).populate('user', 'name'),
  ]);

  if (!mine) throw new AppError('Create your roommate profile first', 404);
  if (!candidate) throw new AppError('Target user does not have an active roommate profile', 404);

  const score = computeScore(mine, candidate);
  if (score === 0) throw new AppError('No compatibility between these profiles to explain', 400);

  const explanation = await explainRoommateMatch(mine, candidate, score);
  return { score, explanation };
};

export {
  upsertProfile,
  getMyProfile,
  getUserProfile,
  deleteMyProfile,
  getMatches,
  explainMatch,
  sendRequest,
  respondRequest,
  cancelRequest,
  getMyRequests,
};
