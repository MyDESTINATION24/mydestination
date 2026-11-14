import fs from 'fs';
import { saveMedia, deleteMedia, bufferFromBase64 } from '../services/mediaStorage.js';

/**
 * Upload helpers used across the hotel, partner, CMS and wedding modules.
 *
 * The names are historical: files are no longer sent to Cloudinary. They are
 * re-encoded to WebP and stored on our own server (services/mediaStorage.js),
 * and the returned URL points at https://api.mydestination.in/media/...
 * The return shapes are unchanged, so callers did not need to change.
 */

const removeTemp = (filePath) => {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    console.error('[media] could not remove temp upload:', error.message);
  }
};

/**
 * Store a multer temp file and delete the temp copy.
 * @param {string} filePath multer disk path
 * @param {string} folder e.g. 'properties' (stored under rukkoin/<folder>)
 * @param {string|null} _publicId ignored -- names are always random now
 * @param {{ allowWord?: boolean }} options allowWord for resumes (.doc/.docx)
 */
export const uploadToCloudinary = async (filePath, folder = 'general', _publicId = null, options = {}) => {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const result = await saveMedia(buffer, { folder: `rukkoin/${folder}`, allowWord: Boolean(options.allowWord) });
    return { success: true, ...result };
  } catch (error) {
    console.error('Media upload error:', error.message);
    throw new Error(error.message?.startsWith('Unsupported') ? error.message : 'Failed to upload file');
  } finally {
    removeTemp(filePath);
  }
};

/** Delete a stored file. Old Cloudinary ids are left alone (kept as backup). */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await deleteMedia(publicId);
    return {
      success: result.success,
      message: result.success ? 'Image deleted successfully' : result.message,
    };
  } catch (error) {
    console.error('Media delete error:', error.message);
    throw new Error('Failed to delete file');
  }
};

/**
 * Store a base64 / data-URL upload (Flutter camera, admin forms).
 * A bare base64 string is accepted; its content decides the type.
 */
export const uploadBase64ToCloudinary = async (base64String, folder = 'general', _publicId = null) => {
  try {
    const buffer = bufferFromBase64(base64String);
    const result = await saveMedia(buffer, { folder: `rukkoin/${folder}` });
    return { success: true, ...result };
  } catch (error) {
    console.error('Media base64 upload error:', error.message);
    throw new Error(error.message?.startsWith('Unsupported') ? error.message : 'Failed to upload image');
  }
};
