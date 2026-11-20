import mongoose from 'mongoose';
import { AppBanner } from '../models/AppService.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.js';

// Promo / ad banners on the app home screen (under the service cards).
// Managed in CMS Admin -> App Services -> Banners.

const fail = (res, status, message) => res.status(status).json({ success: false, message });

// Same rule as service links: inside the app (/hotels) or a normal https:// address.
const isSafeLink = (value) => /^\/(?!\/)[^\s]*$/.test(value) || /^https:\/\/[^\s]+$/i.test(value);

const toDate = (value) => {
  if (value === null || value === '' || value === 'null') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const pick = (body = {}) => {
  const out = {};
  if (body.title !== undefined) out.title = String(body.title).trim().slice(0, 80);
  if (body.image !== undefined) out.image = String(body.image).trim();
  if (body.link !== undefined) out.link = String(body.link).trim();
  if (body.isAd !== undefined) out.isAd = body.isAd === true || body.isAd === 'true';
  if (body.isActive !== undefined) out.isActive = body.isActive === true || body.isActive === 'true';
  for (const field of ['startsAt', 'endsAt']) {
    if (body[field] === undefined) continue;
    const date = toDate(body[field]);
    if (date !== undefined) out[field] = date;
  }
  if (body.order !== undefined) {
    const n = Number(body.order);
    if (Number.isFinite(n)) out.order = n;
  }
  return out;
};

const validate = (data, { creating }) => {
  if (creating || data.title !== undefined) {
    if (!data.title) return 'Title is required';
  }
  if (creating && !data.image) return 'Banner image is required';
  if (data.image !== undefined && !data.image) return 'Banner image is required';
  if (data.link && !isSafeLink(data.link)) return 'Link must start with / (e.g. /hotels) or https://';
  if (data.startsAt && data.endsAt && data.endsAt <= data.startsAt) return 'End date must be after the start date';
  return null;
};

const withImage = async (req, data) => {
  if (req.file) {
    const uploaded = await uploadToCloudinary(req.file.path, 'app-banners');
    data.image = uploaded.url;
  }
  return data;
};

/** Banners the app should show right now (active and inside their dates). */
export const getLiveBanners = async () => {
  const now = new Date();
  return AppBanner.find({
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
    ],
  })
    .sort({ order: 1, createdAt: 1 })
    .select('title image link isAd')
    .lean();
};

export const adminListBanners = async (req, res) => {
  try {
    const banners = await AppBanner.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: banners });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const createBanner = async (req, res) => {
  try {
    const data = await withImage(req, pick(req.body));
    const problem = validate(data, { creating: true });
    if (problem) return fail(res, 400, problem);
    if (data.order === undefined) {
      const last = await AppBanner.findOne().sort({ order: -1 }).lean();
      data.order = (last?.order || 0) + 10;
    }
    const banner = await AppBanner.create(data);
    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const updateBanner = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 404, 'Banner not found');
    const data = await withImage(req, pick(req.body));
    const problem = validate(data, { creating: false });
    if (problem) return fail(res, 400, problem);
    const banner = await AppBanner.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!banner) return fail(res, 404, 'Banner not found');
    res.json({ success: true, data: banner });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const deleteBanner = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 404, 'Banner not found');
    const banner = await AppBanner.findByIdAndDelete(req.params.id);
    if (!banner) return fail(res, 404, 'Banner not found');
    res.json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

// body.ids in display order
export const reorderBanners = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => mongoose.Types.ObjectId.isValid(id)) : [];
    if (!ids.length) return fail(res, 400, 'Nothing to reorder');
    await AppBanner.bulkWrite(ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: (index + 1) * 10 } } }
    })));
    res.json({ success: true });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

// exported for tests
export const _internal = { pick, validate, isSafeLink };
