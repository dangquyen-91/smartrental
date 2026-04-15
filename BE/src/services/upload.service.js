const cloudinary = require('../config/cloudinary');
const AppError = require('../utils/app-error');

const FOLDER = 'smartrental/properties';

const uploadBuffer = (buffer, originalname) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        resource_type: 'image',
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(new AppError(`Cloudinary upload failed: ${error.message}`, 502));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

const uploadImages = async (files) => {
  if (!files || files.length === 0) {
    throw new AppError('No files provided', 400);
  }
  return Promise.all(files.map((f) => uploadBuffer(f.buffer, f.originalname)));
};

const deleteImage = async (publicId) => {
  const result = await cloudinary.uploader.destroy(publicId);
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new AppError(`Failed to delete image: ${result.result}`, 502);
  }
};

const listImages = async () => {
  const result = await cloudinary.api.resources({
    type: 'upload',
    prefix: FOLDER,
    max_results: 100,
  });
  return result.resources.map((r) => ({
    publicId: r.public_id,
    url: r.secure_url,
    createdAt: r.created_at,
    bytes: r.bytes,
  }));
};

module.exports = { uploadImages, deleteImage, listImages };
