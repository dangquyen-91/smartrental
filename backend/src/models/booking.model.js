import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    duration: { type: Number, required: true, min: 1 }, // months
    totalPrice: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'active', 'completed'],
      default: 'pending',
    },
    note: { type: String, maxlength: 500, default: null },
    rejectionReason: { type: String, maxlength: 500, default: null },
    cancelledBy:   { type: String, enum: ['tenant', 'landlord', 'admin', null], default: null },
    cancelReason:  { type: String, maxlength: 500, default: null },
    paymentStatus:   { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    paymentCode:     { type: Number, default: null },
    paymentDeadline: { type: Date,   default: null }, // 24h after landlord confirms
    depositAmount:   { type: Number, default: null },
    paidDate:        { type: Date,   default: null },
    platformFee:   { type: Number, default: null },
    landlordPayout:{ type: Number, default: null },
    payoutStatus:  { type: String, enum: ['pending', 'paid'], default: null },
    payoutDate:    { type: Date,   default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id: ret._id,
        property: ret.property,
        tenant: ret.tenant,
        landlord: ret.landlord,
        startDate: ret.startDate,
        endDate: ret.endDate,
        duration: ret.duration,
        totalPrice: ret.totalPrice,
        status: ret.status,
        note: ret.note,
        rejectionReason: ret.rejectionReason,
        cancelledBy:   ret.cancelledBy,
        cancelReason:  ret.cancelReason,
        paymentStatus:   ret.paymentStatus,
        paymentCode:     ret.paymentCode,
        paymentDeadline: ret.paymentDeadline,
        depositAmount:   ret.depositAmount,
        paidDate:       ret.paidDate,
        platformFee:    ret.platformFee,
        landlordPayout: ret.landlordPayout,
        payoutStatus:   ret.payoutStatus,
        payoutDate:     ret.payoutDate,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
      }),
    },
  }
);

bookingSchema.index({ property: 1, status: 1 });
bookingSchema.index({ tenant: 1 });
bookingSchema.index({ landlord: 1 });
bookingSchema.index({ status: 1 });

export default mongoose.model('Booking', bookingSchema);
