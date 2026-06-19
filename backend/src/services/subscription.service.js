import Subscription from '../models/subscription.model.js';
import Plan from '../models/plan.model.js';
import Property from '../models/property.model.js';
import AppError from '../utils/app-error.js';

// Trả về subscription active của landlord, kèm plan.
// Nếu chưa có subscription → tự tạo bản ghi free.
export const getOrCreateSubscription = async (landlordId) => {
  let sub = await Subscription.findOne({ landlord: landlordId }).populate('plan');
  if (sub) return sub;

  const freePlan = await Plan.findOne({ key: 'free' });
  if (!freePlan) throw new AppError('Plan configuration missing', 500);

  sub = await Subscription.create({
    landlord:  landlordId,
    plan:      freePlan._id,
    status:    'active',
    startDate: new Date(),
    endDate:   null,
  });
  sub.plan = freePlan;
  return sub;
};

// Kiểm tra + expire subscription nếu quá endDate.
// Trả về subscription hiện tại (sau khi đã expire nếu cần).
export const getActiveSubscription = async (landlordId) => {
  const sub = await getOrCreateSubscription(landlordId);

  if (sub.status === 'active' && sub.endDate && sub.endDate < new Date()) {
    await expireSubscription(sub);
    // Reload với free plan
    return getOrCreateSubscription(landlordId);
  }

  return sub;
};

// Expire subscription: đổi về free plan, ẩn listing thừa.
export const expireSubscription = async (sub) => {
  const freePlan = await Plan.findOne({ key: 'free' });

  await Subscription.findOneAndUpdate(
    { _id: sub._id },
    { plan: freePlan._id, status: 'active', startDate: new Date(), endDate: null, paymentCode: null },
  );

  await hideExcessListings(sub.landlord, freePlan.listingLimit);
};

// Ẩn các listing vượt giới hạn — giữ MỚI nhất, ẩn cũ nhất thừa ra
export const hideExcessListings = async (landlordId, limit) => {
  if (limit === -1) return;

  const active = await Property.find({ owner: landlordId, isActive: true })
    .sort({ createdAt: -1 }) // mới nhất trước
    .select('_id');

  if (active.length <= limit) return;

  const toHide = active.slice(limit).map((p) => p._id);
  await Property.updateMany(
    { _id: { $in: toHide } },
    { isActive: false, hiddenBySubscription: true },
  );
};

// Chỉ hiện lại các listing bị ẩn do subscription hết hạn
export const restoreHiddenListings = async (landlordId) => {
  await Property.updateMany(
    { owner: landlordId, isActive: false, hiddenBySubscription: true },
    { isActive: true, hiddenBySubscription: false },
  );
};

// Trả về plan + listing count để FE hiển thị
export const getSubscriptionSummary = async (landlordId) => {
  const sub = await getActiveSubscription(landlordId);
  const activeListings = await Property.countDocuments({ owner: landlordId, isActive: true });
  const daysLeft = sub.endDate
    ? Math.ceil((sub.endDate - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    subscription:   sub,
    plan:           sub.plan,
    activeListings,
    daysLeft,
    isExpiringSoon: daysLeft !== null && daysLeft <= 5,
  };
};

// Lấy commission rate hiện tại của landlord
export const getLandlordCommissionRate = async (landlordId) => {
  const sub = await getActiveSubscription(landlordId);
  return sub.plan.commissionRate;
};

export const getAllPlans = async () => Plan.find().sort({ price: 1 });
