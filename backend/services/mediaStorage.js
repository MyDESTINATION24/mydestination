import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

/**
 * Uploaded media is stored on this server instead of Cloudinary.
 *
 * Every image is decoded and re-encoded as WebP (max 1920px, EXIF stripped),
 * so what gets served is always a clean image we produced -- never the bytes
 * someone uploaded. That is what makes serving it safe: an "image" that is
 * really HTML or SVG simply fails to decode and is rejected. PDFs are the one
 * exception and are kept as-is after checking the PDF header.
 *
 * Files land in MEDIA_ROOT/<publicId>.<ext> with a random name, and are served
 * by server.js at /media. Public ids keep the old "rukkoin/<folder>/..." shape
 * so code that checks folders (e.g. partner document deletion) keeps working.
 */

const BACKEND_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const MEDIA_ROOT = path.resolve(process.env.MEDIA_ROOT || path.join(BACKEND_DIR, 'media'));

export const MEDIA_PUBLIC_URL = (
  process.env.MEDIA_PUBLIC_URL
  || (process.env.NODE_ENV === 'production'
    ? 'https://api.mydestination.in/media'
    : `http://localhost:${process.env.PORT || 5000}/media`)
).replace(/\/+$/, '');

const MAX_DIMENSION = 1920;
const WEBP_QUALITY = 80;
// Refuse decompression bombs (a tiny file that expands to gigapixels).
const MAX_INPUT_PIXELS = 80_000_000;
const RASTER_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'heif', 'tiff']);

const SAFE_SEGMENT = /^[a-zA-Z0-9_-]{1,80}$/;
// Ids this module creates: folders + a final name, each a safe segment.
const PUBLIC_ID_PATTERN = /^[a-zA-Z0-9_-]{1,80}(\/[a-zA-Z0-9_-]{1,80}){1,6}$/;

const cleanFolder = (folder) => {
  const parts = String(folder || 'general')
    .split('/')
    .map((p) => p.trim())
    .filter(Boolean);
  if (!parts.length || !parts.every((p) => SAFE_SEGMENT.test(p))) {
    throw new Error('Invalid upload folder');
  }
  return parts.join('/');
};

const cleanName = (name) => String(name || '')
  .replace(/[^a-zA-Z0-9_-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

const isPdf = (buffer) => buffer.length > 5 && buffer.subarray(0, 5).toString('latin1') === '%PDF-';
// Word files (career resumes only). Served as downloads, never inline.
const wordFormat = (buffer) => {
  if (buffer.length > 8 && buffer.subarray(0, 8).toString('hex') === 'd0cf11e0a1b11ae1') return 'doc';
  if (buffer.length > 4 && buffer.subarray(0, 4).toString('hex') === '504b0304'
    && buffer.includes(Buffer.from('word/'))) return 'docx';
  return null;
};

export const MEDIA_EXTENSIONS = ['webp', 'pdf', 'doc', 'docx'];

const resolveInsideRoot = (relativePath) => {
  const full = path.resolve(MEDIA_ROOT, relativePath);
  if (full !== MEDIA_ROOT && !full.startsWith(MEDIA_ROOT + path.sep)) {
    throw new Error('Invalid media path');
  }
  return full;
};

/**
 * Re-encode an image (or keep a PDF) and write it under MEDIA_ROOT.
 * @param {Buffer} buffer raw upload bytes
 * @param {{ folder?: string, name?: string, allowPdf?: boolean, allowWord?: boolean }} options
 *   folder: e.g. "rukkoin/properties"; name: optional readable prefix
 */
export const saveMedia = async (buffer, { folder = 'rukkoin/general', name = '', allowPdf = true, allowWord = false } = {}) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error('Empty upload');
  }

  const dir = cleanFolder(folder);
  const random = crypto.randomBytes(16).toString('hex');
  const prefix = cleanName(name);
  const base = prefix ? `${prefix}-${random}` : random;
  const publicId = `${dir}/${base}`;

  let output;
  let format;
  let width;
  let height;

  if (isPdf(buffer)) {
    if (!allowPdf) throw new Error('Only image files can be uploaded');
    output = buffer;
    format = 'pdf';
  } else if (allowWord && wordFormat(buffer)) {
    output = buffer;
    format = wordFormat(buffer);
  } else {
    let pipeline;
    try {
      const meta = await sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS }).metadata();
      // Raster photos only: sharp can also read SVG and PDF, which we never
      // want to render from untrusted input.
      if (!RASTER_FORMATS.has(meta.format)) throw new Error(`format ${meta.format}`);
      const animated = (meta.pages || 1) > 1 && ['gif', 'webp'].includes(meta.format);
      pipeline = sharp(buffer, { limitInputPixels: MAX_INPUT_PIXELS, animated })
        .rotate() // honour EXIF orientation before the metadata is stripped
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 });
      const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });
      output = data;
      width = info.width;
      height = info.pageHeight || info.height;
    } catch (error) {
      console.error('[media] could not process upload:', error.message);
      throw new Error(allowPdf
        ? 'Unsupported file. Please upload a JPG, PNG, WebP image or a PDF.'
        : 'Unsupported image. Please upload a JPG, PNG or WebP image.');
    }
    format = 'webp';
  }

  const relative = `${publicId}.${format}`;
  const full = resolveInsideRoot(relative);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, output, { flag: 'wx' });

  return {
    url: `${MEDIA_PUBLIC_URL}/${relative}`,
    publicId,
    format,
    width,
    height,
    bytes: output.length,
  };
};

/** Decode a data: URL / bare base64 string into bytes. */
export const bufferFromBase64 = (value) => {
  const str = String(value || '');
  const match = str.match(/^data:[^;,]*(;[^,]*)?,(.*)$/s);
  const payload = match ? match[2] : str;
  if (match && !/;base64/i.test(match[1] || '')) {
    throw new Error('Only base64 data URLs are supported');
  }
  return Buffer.from(payload.replace(/\s+/g, ''), 'base64');
};

/** Map one of our media URLs back to its public id, or null. */
export const publicIdFromMediaUrl = (url) => {
  const str = String(url || '');
  if (!str.startsWith(`${MEDIA_PUBLIC_URL}/`)) return null;
  const rel = str.slice(MEDIA_PUBLIC_URL.length + 1).split(/[?#]/)[0];
  const id = rel.replace(/\.(webp|pdf|docx?)$/i, '');
  return PUBLIC_ID_PATTERN.test(id) ? id : null;
};

/**
 * Delete a stored file by public id. Ids that are not ours (e.g. old
 * Cloudinary ids) are ignored: those files are kept as the migration backup.
 */
export const deleteMedia = async (publicId) => {
  const id = String(publicId || '');
  if (!PUBLIC_ID_PATTERN.test(id)) {
    return { success: false, message: 'Not a server media id' };
  }
  for (const ext of MEDIA_EXTENSIONS) {
    try {
      await fs.unlink(resolveInsideRoot(`${id}.${ext}`));
      return { success: true, message: 'File deleted successfully' };
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return { success: false, message: 'File not found' };
};

/**
 * Express handlers for GET /media/*. Everything under MEDIA_ROOT was written by
 * saveMedia, but serving is still strict: only our extensions, fixed content
 * types, no sniffing, and a sandboxing CSP so nothing can run as a page.
 */
const MEDIA_TYPES = {
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const mediaRequestHandlers = (express) => [
  (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return res.status(405).end();
    const ext = path.extname(req.path).toLowerCase();
    if (!MEDIA_TYPES[ext]) return res.status(404).end();
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (ext === '.doc' || ext === '.docx') res.setHeader('Content-Disposition', 'attachment');
    return next();
  },
  express.static(MEDIA_ROOT, {
    dotfiles: 'deny',
    index: false,
    redirect: false,
    immutable: true,
    maxAge: '365d',
    setHeaders: (res, filePath) => {
      res.setHeader('Content-Type', MEDIA_TYPES[path.extname(filePath).toLowerCase()]);
    },
  }),
  (_req, res) => res.status(404).end(),
];
