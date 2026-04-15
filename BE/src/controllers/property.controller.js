import * as propertyService from '../services/property.service.js';
import * as R from '../utils/response.js';

const getProperties = async (req, res, next) => {
  try {
    const { properties, pagination } = await propertyService.getProperties(req.query);
    return R.paginated(res, properties, pagination);
  } catch (err) {
    next(err);
  }
};

const getMyProperties = async (req, res, next) => {
  try {
    const { properties, pagination } = await propertyService.getMyProperties(req.user.id, req.query);
    return R.paginated(res, properties, pagination);
  } catch (err) {
    next(err);
  }
};

const getPropertyById = async (req, res, next) => {
  try {
    const property = await propertyService.getPropertyById(req.params.id);
    return R.success(res, { property });
  } catch (err) {
    next(err);
  }
};

const createProperty = async (req, res, next) => {
  try {
    const property = await propertyService.createProperty(req.body, req.user.id);
    return R.created(res, { property }, 'Property created successfully');
  } catch (err) {
    next(err);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const property = await propertyService.updateProperty(req.params.id, req.body, req.user.id, req.user.role);
    return R.success(res, { property }, 'Property updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    await propertyService.deleteProperty(req.params.id, req.user.id, req.user.role);
    return R.success(res, null, 'Property deleted successfully');
  } catch (err) {
    next(err);
  }
};

export { getProperties, getMyProperties, getPropertyById, createProperty, updateProperty, deleteProperty };
