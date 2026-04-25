import mongoose from 'mongoose';

const roommateProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', default: null },
    budget: {
      min: { type: Number, required: true, min: 0 },
      max: { type: Number, required: true, min: 0 },
    },
    gender: { type: String, enum: ['male', 'female', 'any'], required: true },
    schedule: { type: String, enum: ['early_bird', 'night_owl', 'flexible'], required: true },
    lifestyle: { type: String, enum: ['quiet', 'social', 'mixed'], required: true },
    pets: { type: Boolean, required: true },
    smoking: { type: Boolean, required: true },
    looking: { type: Boolean, default: true },
    bio: { type: String, maxlength: 500, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id: ret._id,
        user: ret.user,
        property: ret.property,
        budget: ret.budget,
        gender: ret.gender,
        schedule: ret.schedule,
        lifestyle: ret.lifestyle,
        pets: ret.pets,
        smoking: ret.smoking,
        looking: ret.looking,
        bio: ret.bio,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
      }),
    },
  }
);

roommateProfileSchema.index({ looking: 1 });
roommateProfileSchema.index({ gender: 1 });
roommateProfileSchema.index({ 'budget.min': 1, 'budget.max': 1 });

// ─── Roommate Request ────────────────────────────────────────────────────────

const roommateRequestSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'cancelled'],
      default: 'pending',
    },
    message: { type: String, maxlength: 300, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id: ret._id,
        sender: ret.sender,
        receiver: ret.receiver,
        status: ret.status,
        message: ret.message,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
      }),
    },
  }
);

// One active request per pair — prevent duplicates
roommateRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
roommateRequestSchema.index({ receiver: 1, status: 1 });

export const RoommateProfile = mongoose.model('RoommateProfile', roommateProfileSchema);
export const RoommateRequest = mongoose.model('RoommateRequest', roommateRequestSchema);
