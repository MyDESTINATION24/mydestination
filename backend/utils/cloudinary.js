import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to the file on local filesystem
 * @param {string} folder - Cloudinary folder name (default: 'rukkoin')
 * @param {string} publicId - Custom public_id (optional)
 * @returns {Promise<Object>} - Upload result
 */
export const uploadToCloudinary = async (filePath, folder = 'general', publicId = null) => {
  try {
    const uploadOptions = {
      folder: `rukkoin/${folder}`,
      resource_type: 'auto',
      transformation: [
        { width: 1920, height: 1920, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    // Delete local file after successful upload
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);

    // Clean up local file even on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    throw new Error('Failed to upload file to Cloudinary');
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      message: result.result === 'ok' ? 'Image deleted successfully' : 'Image not found'
    };
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

/**
 * Upload base64 image to Cloudinary (for Flutter camera/mobile)
 * @param {string} base64String - Base64 encoded image data
 * @param {string} folder - Cloudinary folder name
 * @param {string} publicId - Custom public_id (optional)
 * @returns {Promise<Object>} - Upload result
 */
export const uploadBase64ToCloudinary = async (base64String, folder = 'general', publicId = null) => {
  try {
    // Ensure base64 string has proper data URI prefix
    let dataUri = String(base64String || '');
    if (!dataUri.startsWith('data:')) {
      // If no prefix, assume it's JPEG
      dataUri = `data:image/jpeg;base64,${dataUri}`;
    }

    // Uploads go up with resource_type 'auto', which happily hosts any file:
    // a data:text/html or an SVG carrying script (several callers, e.g. wedding
    // testimonials, are public) would be served from our Cloudinary account.
    // Only raster images and PDFs are accepted.
    const mime = (dataUri.match(/^data:([^;,]+)[;,]/) || [])[1]?.toLowerCase() || '';
    const ALLOWED_UPLOAD_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif', 'image/bmp', 'application/pdf'];
    if (!ALLOWED_UPLOAD_TYPES.includes(mime)) {
      throw new Error('Only image or PDF files can be uploaded');
    }

    const uploadOptions = {
      folder: `rukkoin/${folder}`,
      resource_type: 'auto',
      transformation: [
        { width: 1920, height: 1920, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    console.log(`[Cloudinary] Uploading base64 image to folder: ${folder}`);

    const result = await cloudinary.uploader.upload(dataUri, uploadOptions);

    console.log(`[Cloudinary] Upload success: ${result.secure_url}`);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes
    };
  } catch (error) {
    console.error('Cloudinary base64 upload error:', error);
    throw new Error('Failed to upload base64 image to Cloudinary');
  }
};

export default cloudinary;
