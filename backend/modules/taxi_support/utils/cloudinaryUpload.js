import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';
import { saveMedia, bufferFromBase64 } from '../../../services/mediaStorage.js';

/**
 * Taxi uploads (driver documents, profile photos, banners, vehicle images).
 *
 * The name is historical: files are no longer sent to Cloudinary. They are
 * re-encoded to WebP and stored on our own server (services/mediaStorage.js);
 * the returned object keeps the shape callers already store.
 */

const DATA_URL_PATTERN = /^data:([^;,]+);base64,/;

const safeFolder = (folder) => String(folder || env.cloudinary.folder || 'appzeto-taxi')
  .split('/')
  .map((part) => part.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60))
  .filter(Boolean)
  .join('/') || 'general';

export const uploadDataUrlToCloudinary = async ({
  dataUrl,
  folder = env.cloudinary.folder,
  publicIdPrefix = 'driver-document',
  publicIdSuffix = '',
}) => {
  if (!DATA_URL_PATTERN.test(String(dataUrl || ''))) {
    throw new ApiError(400, 'A valid base64 image data URL is required');
  }

  let stored;
  try {
    stored = await saveMedia(bufferFromBase64(dataUrl), {
      folder: `taxi/${safeFolder(folder)}`,
      name: [publicIdPrefix, publicIdSuffix].filter(Boolean).join('-'),
    });
  } catch (error) {
    throw new ApiError(400, error.message || 'Upload failed');
  }

  return {
    secureUrl: stored.url,
    publicId: stored.publicId,
    resourceType: stored.format === 'pdf' ? 'raw' : 'image',
    format: stored.format,
    bytes: stored.bytes,
    width: stored.width,
    height: stored.height,
    originalFilename: publicIdSuffix || publicIdPrefix,
    createdAt: new Date().toISOString(),
    raw: null,
  };
};
