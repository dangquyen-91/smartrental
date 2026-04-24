import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true },
    slug:             { type: String, required: true, unique: true },
    price:            { type: Number, required: true },
    durationDays:     { type: Number, required: true },  // 0 = không hết hạn
    maxListings:      { type: Number, required: true },  // -1 = không giới hạn
    maxFeatured:      { type: Number, required: true },  // 0 = không có
    includesContract: { type: Boolean, default: false },
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
        maxListings:      ret.maxListings,
        maxFeatured:      ret.maxFeatured,
        includesContract: ret.includesContract,
        description:      ret.description,
      }),
    },
  }
);

export default mongoose.model('Plan', planSchema);
