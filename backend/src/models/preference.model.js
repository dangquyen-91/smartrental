import mongoose from 'mongoose';

const tenantPreferenceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    budget: {
      min: { type: Number, default: 0 },
      max: { type: Number, required: true },
    },
    preferredTypes: {
      type: [{ type: String, enum: ['room', 'apartment', 'house', 'studio'] }],
      default: [],
    },
    preferredCity:     { type: String, trim: true, default: null },
    preferredDistrict: { type: String, trim: true, default: null },
    requiredAmenities: { type: [String], default: [] },
    minArea: { type: Number, default: null },
    maxArea: { type: Number, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('TenantPreference', tenantPreferenceSchema);
