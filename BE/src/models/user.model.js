import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String },
    role: { type: String, enum: ['tenant', 'landlord', 'admin', 'provider'], default: 'tenant' },
    avatar: { type: String },
    bio: { type: String, maxlength: 300, default: null },
    gender: { type: String, enum: ['male', 'female', 'other'], default: null },
    dateOfBirth: { type: Date, default: null },
    address: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isPhoneVerified: { type: Boolean, default: false },
    phoneOtp: { type: String, default: null },
    phoneOtpExpiry: { type: Date, default: null },
    refreshToken: { type: String, default: null },
    bankAccount: {
      bankName:      { type: String, default: null },
      accountNumber: { type: String, default: null },
      accountName:   { type: String, default: null },
      branch:        { type: String, default: null },
      verifiedAt:    { type: Date,   default: null },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id: ret._id,
        name: ret.name,
        email: ret.email,
        phone: ret.phone,
        avatar: ret.avatar,
        bio: ret.bio,
        gender: ret.gender,
        dateOfBirth: ret.dateOfBirth,
        address: ret.address,
        role: ret.role,
        isActive: ret.isActive,
        isPhoneVerified: ret.isPhoneVerified,
        bankAccount: ret.bankAccount ?? null,
        createdAt: ret.createdAt,
        updatedAt: ret.updatedAt,
      }),
    },
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
