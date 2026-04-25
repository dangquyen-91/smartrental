import { RoommateProfile, RoommateRequest } from '../models/roommate.model.js';
import AppError from '../utils/app-error.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const buildPagination = (page, limit) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  return { pageNum, limitNum, skip: (pageNum - 1) * limitNum };
};

/**
 * Score compatibility between current user's profile and a candidate.
 * Max score = 100
 */
const computeScore = (mine, candidate) => {
  let score = 0;

  // Budget overlap: ranges must overlap — +30 pts
  const overlapMin = Math.max(mine.budget.min, candidate.budget.min);
  const overlapMax = Math.min(mine.budget.max, candidate.budget.max);
  if (overlapMax >= overlapMin) score += 30;

  // Gender preference — +20 pts
  // Compatible if either party is 'any', or both share the same gender preference
  const genderOk =
    mine.gender === 'any' ||
    candidate.gender === 'any' ||
    mine.gender === candidate.gender;
  if (genderOk) score += 20;

  // Schedule — +20 pts
  if (mine.schedule === candidate.schedule || mine.schedule === 'flexible' || candidate.schedule === 'flexible') {
    score += 20;
  }

  // Lifestyle — +20 pts
  if (mine.lifestyle === candidate.lifestyle || mine.lifestyle === 'mixed' || candidate.lifestyle === 'mixed') {
    score += 20;
  }

  // Pets tolerance — +5 pts (both ok with pets, or neither has pets concern)
  if (mine.pets === candidate.pets) score += 5;

  // Smoking tolerance — +5 pts
  if (mine.smoking === candidate.smoking) score += 5;

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
    { new: true, upsert: true, runValidators: true }
  ).populate('user', 'name avatar gender').populate('property', 'title address');

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

// ─── Delete My Profile ───────────────────────────────────────────────────────

const deleteMyProfile = async (userId) => {
  const profile = await RoommateProfile.findOneAndDelete({ user: userId });
  if (!profile) throw new AppError('Roommate profile not found', 404);
};

// ─── Get Matches ─────────────────────────────────────────────────────────────

const getMatches = async (userId, { page = 1, limit = 10 } = {}) => {
  const mine = await RoommateProfile.findOne({ user: userId });
  if (!mine) throw new AppError('Create your roommate profile first', 404);
  if (!mine.looking) throw new AppError('Set your profile to "looking" to see matches', 400);

  const { pageNum, limitNum, skip } = buildPagination(page, limit);

  // Fetch all candidates (active, not self)
  const candidates = await RoommateProfile.find({
    user: { $ne: userId },
    looking: true,
  }).populate('user', 'name avatar gender').populate('property', 'title address price');

  // Score & sort
  const scored = candidates
    .map((c) => ({ profile: c, score: computeScore(mine, c) }))
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);

  const total = scored.length;
  const paginated = scored.slice(skip, skip + limitNum);

  return {
    matches: paginated.map(({ profile, score }) => ({ ...profile.toJSON(), matchScore: score })),
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

// ─── Send Request ────────────────────────────────────────────────────────────

const sendRequest = async (senderId, receiverId, message) => {
  if (senderId === receiverId) {
    throw new AppError('You cannot send a request to yourself', 400);
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
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    RoommateRequest.countDocuments(filter),
  ]);

  return {
    requests,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

export {
  upsertProfile,
  getMyProfile,
  deleteMyProfile,
  getMatches,
  sendRequest,
  respondRequest,
  cancelRequest,
  getMyRequests,
};
