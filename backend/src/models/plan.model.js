import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    key:             { type: String, enum: ['free', 'basic', 'premium'], required: true, unique: true },
    name:            { type: String, required: true },
    price:           { type: Number, required: true },      // VND/tháng, 0 = free
    listingLimit:    { type: Number, required: true },      // -1 = unlimited
    commissionRate:  { type: Number, required: true },      // 0.10 / 0.04 / 0
    badge:           { type: String, default: null },       // null / 'Basic' / 'Pro'
    features:        [{ type: String }],
  },
  { timestamps: true },
);

planSchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count > 0) return;

  await this.insertMany([
    {
      key:            'free',
      name:           'Free',
      price:          0,
      listingLimit:   3,
      commissionRate: 0.10,
      badge:          null,
      features:       ['3 tin đăng active', 'Hợp đồng điện tử', 'Hoa hồng booking 10%'],
    },
    {
      key:            'basic',
      name:           'Basic',
      price:          99000,
      listingLimit:   10,
      commissionRate: 0.04,
      badge:          'Basic',
      features:       ['10 tin đăng active', 'Hợp đồng điện tử', 'Hoa hồng booking 4%', 'Badge Basic'],
    },
    {
      key:            'premium',
      name:           'Premium',
      price:          229000,
      listingLimit:   -1,
      commissionRate: 0,
      badge:          'Pro',
      features:       ['Không giới hạn tin đăng', 'Hợp đồng điện tử', 'Miễn hoa hồng booking', 'Badge Pro'],
    },
  ]);

  console.log('[Plan] Seeded 3 plans');
};

export default mongoose.model('Plan', planSchema);
