const uploadService = require('../services/upload.service');
const R = require('../utils/response');

const listImages = async (req, res, next) => {
  try {
    const images = await uploadService.listImages();
    return R.success(res, { images, count: images.length }, 'Images fetched successfully');
  } catch (err) {
    next(err);
  }
};

const uploadImages = async (req, res, next) => {
  try {
    const results = await uploadService.uploadImages(req.files);
    return R.created(res, { images: results, count: results.length }, 'Images uploaded successfully');
  } catch (err) {
    next(err);
  }
};

const deleteImage = async (req, res, next) => {
  try {
    const { publicId } = req.body;
    if (!publicId) return R.badRequest(res, 'publicId is required');
    await uploadService.deleteImage(publicId);
    return R.success(res, null, 'Image deleted successfully');
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImages, deleteImage, listImages };
