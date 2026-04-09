const Property = require('../models/Property');
const R = require('../utils/response');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/properties — Public: list with filters + pagination
const getProperties = async (req, res, next) => {
  try {
    const {
      city, district, type, status,
      minPrice, maxPrice, search,
      sort = 'newest',
      page = 1, limit = 10,
    } = req.query;

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

    if (search) {
      filter.title = { $regex: escapeRegex(search), $options: 'i' };
    }

    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
    };
    const sortOption = sortMap[sort] || sortMap.newest;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('owner', 'name phone avatar')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Property.countDocuments(filter),
    ]);

    return R.paginated(res, properties, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/properties/my — Landlord/admin: own properties with pagination
const getMyProperties = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { owner: req.user.id, isActive: true };
    if (status) filter.status = status;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [properties, total] = await Promise.all([
      Property.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Property.countDocuments(filter),
    ]);

    return R.paginated(res, properties, {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/properties/:id — Public: property detail
const getPropertyById = async (req, res, next) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, isActive: true })
      .populate('owner', 'name phone avatar');

    if (!property) return R.notFound(res, 'Property not found');

    return R.success(res, { property });
  } catch (err) {
    next(err);
  }
};

// POST /api/properties — Landlord/admin: create property
const createProperty = async (req, res, next) => {
  try {
    const { title, description, type, price, area, address, amenities, images } = req.body;

    const property = await Property.create({
      title,
      description,
      type,
      price,
      area,
      address,
      amenities,
      images,
      owner: req.user.id,
    });

    return R.created(res, { property }, 'Property created successfully');
  } catch (err) {
    next(err);
  }
};

// PUT /api/properties/:id — Landlord(own)/admin: update property
const updateProperty = async (req, res, next) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, isActive: true });
    if (!property) return R.notFound(res, 'Property not found');

    // Landlord chỉ được sửa property của chính mình
    if (req.user.role === 'landlord' && property.owner.toString() !== req.user.id) {
      return R.forbidden(res, 'You can only update your own properties');
    }

    const allowedFields = ['title', 'description', 'type', 'status', 'price', 'area', 'address', 'amenities', 'images'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        property[field] = req.body[field];
      }
    });

    await property.save();

    return R.success(res, { property }, 'Property updated successfully');
  } catch (err) {
    next(err);
  }
};

// DELETE /api/properties/:id — Landlord(own)/admin: soft-delete
const deleteProperty = async (req, res, next) => {
  try {
    const property = await Property.findOne({ _id: req.params.id, isActive: true });
    if (!property) return R.notFound(res, 'Property not found');

    // Landlord chỉ được xóa property của chính mình
    if (req.user.role === 'landlord' && property.owner.toString() !== req.user.id) {
      return R.forbidden(res, 'You can only delete your own properties');
    }

    property.isActive = false;
    await property.save();

    return R.success(res, null, 'Property deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { getProperties, getMyProperties, getPropertyById, createProperty, updateProperty, deleteProperty };
