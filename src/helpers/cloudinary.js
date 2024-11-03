const fs = require('fs').promises;
const cloudinary = require('cloudinary').v2;

const logger = require('../utils/customLogger');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadRawFileToCloudinary = async (filePath, fileName) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw', // Specify raw type for non-image files like Excel
      public_id: fileName,
      folder: 'message_center_files', // Optional: specify a folder in Cloudinary
    });

    // Delete the local file after upload
    await fs.unlink(filePath);

    return result.secure_url;
  } catch (error) {
    logger.error('Error uploading file to Cloudinary:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
};

module.exports = { uploadRawFileToCloudinary };
