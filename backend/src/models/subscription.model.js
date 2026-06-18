import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    landlord:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan:        { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    status:      { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    startDate:   { type: Date, required: true },
    endDate:     { type: Date, default: null },   // null = free (không hết hạn)
    paymentCode: { type: Number, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id:          ret._id,
        landlord:    ret.landlord,
        plan:        ret.plan,
        status:      ret.status,
        startDate:   ret.startDate,
        endDate:     ret.endDate,
        paymentCode: ret.paymentCode,
        createdAt:   ret.createdAt,
        updatedAt:   ret.updatedAt,
      }),
    },
  },
);

subscriptionSchema.index({ endDate: 1, status: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
