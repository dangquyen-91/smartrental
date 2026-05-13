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
    pricePerM2: { type: Number, default: null },
    area: { type: Number },

    bedrooms: { type: Number, min: 0, default: null },
    bathrooms: { type: Number, min: 0, default: null },

    address: {
      street: { type: String },
      ward: { type: String },
      district: { type: String },
      city: { type: String, required: true },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      fullAddress: { type: String, default: null },
    },

    amenities: [{ type: String }],

    images: [
      {
        url: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    contact: {
      name: { type: String, default: null },
      phone: { type: String, default: null },
    },

    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },

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
        pricePerM2: ret.pricePerM2,
        area: ret.area,
        bedrooms: ret.bedrooms,
        bathrooms: ret.bathrooms,
        address: ret.address,
        amenities: ret.amenities,
        images: ret.images,
        owner: ret.owner,
        contact: ret.contact,
        views: ret.views,
        isFeatured: ret.isFeatured,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
      }),
    },
  }
);

// Auto-calculate pricePerM2 before save
propertySchema.pre('save', function () {
  if (this.price && this.area && this.area > 0) {
    this.pricePerM2 = Math.round(this.price / this.area);
  }
});

// Ensure only one image is marked as primary
propertySchema.pre('save', function () {
  const primaryCount = this.images.filter((img) => img.isPrimary).length;
  if (primaryCount > 1) {
    this.images.forEach((img, i) => { img.isPrimary = i === 0; });
  }
});

propertySchema.index({ 'address.city': 1, status: 1 });
propertySchema.index({ owner: 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ isFeatured: 1 });

export default mongoose.model('Property', propertySchema);
