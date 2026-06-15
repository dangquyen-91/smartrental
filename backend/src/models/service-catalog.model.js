import mongoose from 'mongoose';

const SERVICE_TYPES = ['cleaning', 'repair', 'wifi', 'moving', 'painting', 'registration'];

const serviceCatalogSchema = new mongoose.Schema(
  {
    type:     { type: String, enum: SERVICE_TYPES, required: true, unique: true },
    name:     { type: String, required: true, trim: true },
    price:    { type: Number, required: true, min: 0 },
    unit:     { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => ({
        id:       ret._id,
        type:     ret.type,
        name:     ret.name,
        price:    ret.price,
        unit:     ret.unit,
        isActive: ret.isActive,
      }),
    },
  }
);

const SEED_DATA = [
  { type: 'cleaning',     name: 'Dọn dẹp vệ sinh',          price: 2000,  unit: 'lần' },
  { type: 'repair',       name: 'Sửa chữa',                  price: 200000,  unit: 'lần' },
  { type: 'wifi',         name: 'Lắp đặt WiFi',              price: 500000,  unit: 'lần' },
  { type: 'moving',       name: 'Chuyển đồ',                 price: 300000,  unit: 'lần' },
  { type: 'painting',     name: 'Sơn nhà',                   price: 1000000, unit: 'phòng' },
  { type: 'registration', name: 'Đăng ký tạm trú/tạm vắng', price: 100000,  unit: 'hồ sơ' },
];

// Seed once on app startup if collection is empty
serviceCatalogSchema.statics.seedIfEmpty = async function () {
  const count = await this.countDocuments();
  if (count === 0) {
    await this.insertMany(SEED_DATA);
  }
};

export default mongoose.model('ServiceCatalog', serviceCatalogSchema);
