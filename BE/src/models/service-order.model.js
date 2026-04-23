import mongoose from 'mongoose';

const SERVICE_TYPES = ['cleaning', 'repair', 'wifi', 'moving', 'painting', 'registration'];
const SERVICE_STATUSES = ['pending', 'confirmed', 'in_progress', 'done', 'cancelled'];

const serviceOrderSchema = new mongoose.Schema(
  {
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    type: { type: String, enum: SERVICE_TYPES, required: true },
    status: { type: String, enum: SERVICE_STATUSES, default: 'pending' },
    scheduledAt: { type: Date, required: true },
    price: { type: Number, required: true },
    note: { type: String, maxlength: 500, default: null },
    assignedProvider:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelReason:      { type: String, maxlength: 500, default: null },
    paymentStatus:     { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    paymentCode:       { type: Number, default: null },
    platformFee:       { type: Number, default: null },
    providerPayout:    { type: Number, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id: ret._id,
        tenant: ret.tenant,
        property: ret.property,
        type: ret.type,
        status: ret.status,
        scheduledAt: ret.scheduledAt,
        price: ret.price,
        note: ret.note,
        assignedProvider: ret.assignedProvider,
        cancelReason:     ret.cancelReason,
        paymentStatus:    ret.paymentStatus,
        paymentCode:      ret.paymentCode,
        platformFee:      ret.platformFee,
        providerPayout:   ret.providerPayout,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
      }),
    },
  }
);

serviceOrderSchema.index({ tenant: 1, status: 1 });
serviceOrderSchema.index({ property: 1 });
serviceOrderSchema.index({ status: 1 });
serviceOrderSchema.index({ assignedProvider: 1 });

export default mongoose.model('ServiceOrder', serviceOrderSchema);
