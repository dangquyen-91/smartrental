import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true },
    slug:             { type: String, required: true, unique: true },
    price:            { type: Number, required: true },
    durationDays:     { type: Number, required: true },  // 0 = không hết hạn
    maxListings:      { type: Number, required: true },  // -1 = không giới hạn
    maxFeatured:      { type: Number, required: true },  // 0 = không có
    maxContracts:     { type: Number, required: true },  // -1 = unlimited, 0 = none, n = trial cap
    priorityLevel:    { type: Number, default: 0 },      // 0 = none, 1 = low, 2 = high
    includesHighlight:{ type: Boolean, default: false }, // nổi bật trong tìm kiếm (Premium)
    includesAnalytics:{ type: Boolean, default: false }, // xem thống kê (Premium)
    description:      { type: String, default: null },
    isActive:         { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id:               ret._id,
        name:             ret.name,
        slug:             ret.slug,
        price:            ret.price,
        durationDays:     ret.durationDays,
        maxListings:       ret.maxListings,
        maxFeatured:       ret.maxFeatured,
        maxContracts:      ret.maxContracts,
        priorityLevel:     ret.priorityLevel,
        includesHighlight: ret.includesHighlight,
        includesAnalytics: ret.includesAnalytics,
        description:       ret.description,
      }),
    },
  }
);

export default mongoose.model('Plan', planSchema);
