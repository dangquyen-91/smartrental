import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ['room', 'apartment', 'house', 'studio'],
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'rented', 'maintenance'],
      default: 'available',
    },
    price: { type: Number, required: true },
    area: { type: Number },
    address: {
      street: { type: String },
      ward: { type: String },
      district: { type: String },
      city: { type: String, required: true },
    },
    amenities: [{ type: String }],
    images: [{ type: String }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id: ret._id,
        title: ret.title,
        description: ret.description,
        type: ret.type,
        status: ret.status,
        price: ret.price,
        area: ret.area,
        address: ret.address,
        amenities: ret.amenities,
        images: ret.images,
        owner: ret.owner,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
      }),
    },
  }
);

propertySchema.index({ 'address.city': 1, status: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ price: 1 });

export default mongoose.model('Property', propertySchema);
