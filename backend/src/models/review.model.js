import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    booking:      { type: mongoose.Schema.Types.ObjectId, ref: 'Booking',  required: true },
    reviewer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true },
    reviewerRole: { type: String, enum: ['tenant', 'landlord'],            required: true },

    // targetType='property' → target=Property._id
    // targetType='landlord' → target=User._id (landlord)
    // targetType='tenant'   → target=User._id (tenant)
    targetType: { type: String, enum: ['property', 'landlord', 'tenant'], required: true },
    target:     { type: mongoose.Schema.Types.ObjectId, required: true },

    rating:  { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000, default: null, trim: true },

    // Soft-delete — admin only
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date,   default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id:           ret._id,
        booking:      ret.booking,
        reviewer:     ret.reviewer,
        reviewerRole: ret.reviewerRole,
        targetType:   ret.targetType,
        target:       ret.target,
        rating:       ret.rating,
        comment:      ret.comment,
        createdAt:    ret.createdAt,
        updatedAt:    ret.updatedAt,
      }),
    },
  },
);

// One review per (booking × reviewerRole × targetType) — prevents duplicates
reviewSchema.index({ booking: 1, reviewerRole: 1, targetType: 1 }, { unique: true });
reviewSchema.index({ target: 1, targetType: 1, isDeleted: 1 });
reviewSchema.index({ reviewer: 1, isDeleted: 1 });

export default mongoose.model('Review', reviewSchema);
