import Plan from '../models/plan.model.js';
import Subscription from '../models/subscription.model.js';
import Property from '../models/property.model.js';
import AppError from '../utils/app-error.js';

// ─── Seed data ────────────────────────────────────────────────────────────────

const PLAN_SEEDS = [
  {
    name:             'Free',
    slug:             'free',
    price:            0,
    durationDays:     0,
    maxListings:      3,
    maxFeatured:      0,
    includesContract: false,
    description:      'Đăng tối đa 3 tin, không hỗ trợ tin nổi bật',
  },
  {
    name:             'Basic',
    slug:             'basic',
    price:            2000,
    durationDays:     30,
    maxListings:      10,
    maxFeatured:      2,
    includesContract: true,
    description:      'Đăng tối đa 10 tin, 2 tin nổi bật, soạn hợp đồng điện tử',
  },
  {
    name:             'Premium',
    slug:             'premium',
    price:            499000,
    durationDays:     30,
    maxListings:      -1,
    maxFeatured:      5,
    includesContract: true,
    description:      'Không giới hạn tin, 5 tin nổi bật, soạn hợp đồng điện tử',
  },
];

// Fallback khi landlord chưa có subscription nào
const FREE_PLAN_DEFAULTS = {
  slug:             'free',
  name:             'Free',
  maxListings:      3,
  maxFeatured:      0,
  includesContract: false,
  price:            0,
};

let plansSeeded = false;

const ensurePlansSeeded = async () => {
  if (plansSeeded) return;
  await Promise.all(
    PLAN_SEEDS.map((seed) =>
      Plan.findOneAndUpdate({ slug: seed.slug }, seed, { upsert: true, new: true })
    )
  );
  plansSeeded = true;
};

// ─── Get Plans (public) ───────────────────────────────────────────────────────

const getPlans = async () => {
  await ensurePlansSeeded();
  return Plan.find({ isActive: true }).sort({ price: 1 });
};

// ─── Get Active Plan limits cho 1 landlord ───────────────────────────────────
// Trả về plan object (từ DB) hoặc FREE_PLAN_DEFAULTS nếu không có sub nào

const getActivePlan = async (landlordId) => {
  const sub = await Subscription.findOne({
    landlord: landlordId,
    status:   'active',
    $or: [
      { endDate: null },
      { endDate: { $gt: new Date() } },
    ],
  })
    .populate('plan')
    .lean();

  return sub?.plan ?? FREE_PLAN_DEFAULTS;
};

// ─── Get My Subscription ─────────────────────────────────────────────────────

const getMySubscription = async (landlordId) => {
  const sub = await Subscription.findOne({
    landlord: landlordId,
    status:   { $in: ['active', 'pending_payment'] },
  })
    .populate('plan')
    .sort({ createdAt: -1 });

  const currentPlan = await getActivePlan(landlordId);

  return { subscription: sub, currentPlan };
};

// ─── Create Pending Subscription (trước khi thanh toán) ──────────────────────

const createPendingSubscription = async (planId, landlordId) => {
  await ensurePlansSeeded();

  const plan = await Plan.findOne({ _id: planId, isActive: true });
  if (!plan) throw new AppError('Plan not found', 404);
  if (plan.slug === 'free') throw new AppError('Free plan does not require payment', 400);

  // Huỷ các pending cũ để tránh tồn đọng
  await Subscription.updateMany(
    { landlord: landlordId, status: 'pending_payment' },
    { $set: { status: 'cancelled' } },
  );

  const sub = await Subscription.create({
    landlord: landlordId,
    plan:     planId,
  });

  return sub.populate('plan');
};

// ─── Activate Subscription (gọi từ webhook sau khi thanh toán) ───────────────

const activateSubscription = async (paymentCode, session) => {
  const sub = await Subscription.findOne({ paymentCode }).session(session);
  if (!sub) return null;

  const plan = await Plan.findById(sub.plan).session(session);
  if (!plan) return null;

  const startDate = new Date();
  const endDate   = plan.durationDays > 0
    ? new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)
    : null;

  const result = await Subscription.findOneAndUpdate(
    { _id: sub._id, paymentStatus: { $ne: 'paid' } },
    { $set: { status: 'active', paymentStatus: 'paid', startDate, endDate } },
    { new: true, session },
  );

  return result;
};

// ─── Limit assertions (throw nếu vượt giới hạn) ──────────────────────────────

const assertListingSlot = async (landlordId) => {
  const plan = await getActivePlan(landlordId);
  if (plan.maxListings === -1) return; // unlimited

  const count = await Property.countDocuments({ owner: landlordId, isActive: true });
  if (count >= plan.maxListings) {
    throw new AppError(
      `Gói ${plan.name} chỉ cho phép tối đa ${plan.maxListings} tin đăng. Vui lòng nâng cấp gói.`,
      403,
    );
  }
};

const assertFeaturedSlot = async (landlordId) => {
  const plan = await getActivePlan(landlordId);
  if (plan.maxFeatured === 0) {
    throw new AppError(
      `Gói ${plan.name} không hỗ trợ tin nổi bật. Vui lòng nâng cấp lên Basic hoặc Premium.`,
      403,
    );
  }

  const featuredCount = await Property.countDocuments({
    owner:      landlordId,
    isFeatured: true,
    isActive:   true,
  });

  if (featuredCount >= plan.maxFeatured) {
    throw new AppError(
      `Gói ${plan.name} chỉ cho phép tối đa ${plan.maxFeatured} tin nổi bật. Vui lòng nâng cấp gói.`,
      403,
    );
  }
};

const assertContractAllowed = async (landlordId) => {
  const plan = await getActivePlan(landlordId);
  if (!plan.includesContract) {
    throw new AppError(
      'Soạn hợp đồng điện tử yêu cầu gói Basic hoặc Premium. Vui lòng nâng cấp gói.',
      403,
    );
  }
};

export {
  getPlans,
  getActivePlan,
  getMySubscription,
  createPendingSubscription,
  activateSubscription,
  assertListingSlot,
  assertFeaturedSlot,
  assertContractAllowed,
};
