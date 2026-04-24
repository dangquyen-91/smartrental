import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    landlord:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    plan:          { type: mongoose.Schema.Types.ObjectId, ref: 'Plan',  required: true },
    status:        {
      type:    String,
      enum:    ['pending_payment', 'active', 'expired', 'cancelled'],
      default: 'pending_payment',
    },
    startDate:     { type: Date,   default: null },
    endDate:       { type: Date,   default: null },   // null = không hết hạn
    paymentCode:   { type: Number, default: null },
    paymentStatus: { type: String, enum: ['unpaid', 'paid'], default: 'unpaid' },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id:            ret._id,
        landlord:      ret.landlord,
        plan:          ret.plan,
        status:        ret.status,
        startDate:     ret.startDate,
        endDate:       ret.endDate,
        paymentStatus: ret.paymentStatus,
        createdAt:     ret.createdAt,
        updatedAt:     ret.updatedAt,
      }),
    },
  }
);

subscriptionSchema.index({ landlord: 1, status: 1 });
subscriptionSchema.index({ paymentCode: 1 });

export default mongoose.model('Subscription', subscriptionSchema);
