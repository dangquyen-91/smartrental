import mongoose from 'mongoose';

const contractSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
    terms: { type: String, maxlength: 2000, default: null },
    pdfUrl: { type: String, default: null },
    status: {
      type: String,
      enum: ['draft', 'awaiting_signatures', 'signed', 'cancelled'],
      default: 'draft',
    },
    signedByTenant: {
      signed: { type: Boolean, default: false },
      signedAt: { type: Date, default: null },
    },
    signedByLandlord: {
      signed: { type: Boolean, default: false },
      signedAt: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id: ret._id,
        booking: ret.booking,
        tenant: ret.tenant,
        landlord: ret.landlord,
        property: ret.property,
        terms: ret.terms,
        pdfUrl: ret.pdfUrl,
        status: ret.status,
        signedByTenant: ret.signedByTenant,
        signedByLandlord: ret.signedByLandlord,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
      }),
    },
  }
);

contractSchema.index({ tenant: 1 });
contractSchema.index({ landlord: 1 });
contractSchema.index({ status: 1 });

export default mongoose.model('Contract', contractSchema);
