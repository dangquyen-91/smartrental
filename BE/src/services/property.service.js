import Property from '../models/property.model.js';
import AppError from '../utils/app-error.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getProperties = async ({
  city, district, type, status,
  minPrice, maxPrice, search,
  sort = 'newest', page = 1, limit = 10,
}) => {
  const filter = { isActive: true };

  if (city) filter['address.city'] = { $regex: escapeRegex(city), $options: 'i' };
  if (district) filter['address.district'] = { $regex: escapeRegex(district), $options: 'i' };
  if (type) filter.type = type;
  if (status) filter.status = status;

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  if (search) filter.title = { $regex: escapeRegex(search), $options: 'i' };

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
  };

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('owner', 'name phone avatar')
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(limitNum),
    Property.countDocuments(filter),
  ]);

  return {
    properties,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

const getMyProperties = async (ownerId, { status, page = 1, limit = 10 }) => {
  const filter = { owner: ownerId, isActive: true };
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNum - 1) * limitNum;

  const [properties, total] = await Promise.all([
    Property.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Property.countDocuments(filter),
  ]);

  return {
    properties,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

const getPropertyById = async (id) => {
  const property = await Property.findOne({ _id: id, isActive: true })
    .populate('owner', 'name phone avatar');
  if (!property) throw new AppError('Property not found', 404);
  return property;
};

const createProperty = async (data, ownerId) => {
  const { title, description, type, price, area, address, amenities, images } = data;
  return Property.create({ title, description, type, price, area, address, amenities, images, owner: ownerId });
};

const updateProperty = async (id, data, userId, userRole) => {
  const property = await Property.findOne({ _id: id, isActive: true });
  if (!property) throw new AppError('Property not found', 404);

  if (userRole === 'landlord' && property.owner.toString() !== userId) {
    throw new AppError('You can only update your own properties', 403);
  }

  const allowedFields = ['title', 'description', 'type', 'status', 'price', 'area', 'address', 'amenities', 'images'];
  allowedFields.forEach((field) => {
    if (data[field] !== undefined) property[field] = data[field];
  });

  await property.save();
  return property;
};

const deleteProperty = async (id, userId, userRole) => {
  const property = await Property.findOne({ _id: id, isActive: true });
  if (!property) throw new AppError('Property not found', 404);

  if (userRole === 'landlord' && property.owner.toString() !== userId) {
    throw new AppError('You can only delete your own properties', 403);
  }

  property.isActive = false;
  await property.save();
};

export { getProperties, getMyProperties, getPropertyById, createProperty, updateProperty, deleteProperty };
