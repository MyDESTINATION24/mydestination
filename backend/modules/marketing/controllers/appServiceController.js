import mongoose from 'mongoose';
import AppService, { SERVICE_THEMES, SERVICE_ICONS, AppHomeSettings } from '../models/AppService.js';

const getHomeSettings = async () => {
  const doc = await AppHomeSettings.findOneAndUpdate({}, { $setOnInsert: {} }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  return { greetingSubtitle: doc.greetingSubtitle, sectionTitle: doc.sectionTitle };
};
import { uploadToCloudinary } from '../../../utils/cloudinary.js';

// The five cards that were hardcoded in SuperAppDashboard.jsx, seeded once so
// the home screen looks unchanged until an admin edits it. The Char Dham card
// used a bundled image; it is seeded without one and the app keeps showing its
// built-in picture until an admin uploads a replacement.
const DEFAULT_SERVICES = [
  { key: 'hotel', title: 'Hotels & Stays', description: 'Book luxury hotels, resorts, and homestays at the best prices.', theme: 'emerald', icon: 'building', path: '/hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800', order: 10 },
  { key: 'taxi', title: 'Cab Booking', description: 'Ride safely with our verified drivers. Outstation & local cabs.', theme: 'amber', icon: 'car', path: '/taxi/user', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800', order: 20 },
  { key: 'wedding', title: 'Wedding Planner', description: 'Plan your dream destination wedding with top vendors & venues.', theme: 'rose', icon: 'heart', path: '/wedding', image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800', order: 30 },
  { key: 'helicopter', title: 'Helicopter Booking', description: 'Book premium helicopter travel & spiritual tours to holy shrines.', theme: 'sky', icon: 'helicopter', path: '/taxi/user/airways', image: 'https://images.unsplash.com/photo-1540962351504-03099e0a754b?auto=format&fit=crop&q=80&w=800', order: 40 },
  { key: 'chardham', title: 'Char Dham Yatra', description: 'Spiritual pilgrim tour packages to Yamunotri, Gangotri, Kedarnath, and Badrinath.', theme: 'orange', icon: 'mappin', path: '/taxi/user/tours', image: '', imagePos: 'bottom', order: 50 },
];

let seeded = false;
const ensureSeeded = async () => {
  if (seeded) return;
  // Only when the collection is empty: deleting a default must stay deleted.
  if ((await AppService.estimatedDocumentCount()) === 0) {
    await AppService.insertMany(DEFAULT_SERVICES, { ordered: false }).catch(() => {});
  }
  seeded = true;
};

const FIELDS = ['title', 'description', 'image', 'imagePos', 'path', 'ctaText', 'theme', 'icon', 'isActive', 'order'];

const pick = (body) => {
  const out = {};
  for (const field of FIELDS) {
    if (body[field] === undefined) continue;
    if (field === 'isActive') out.isActive = body.isActive === true || body.isActive === 'true';
    else if (field === 'order') { const n = Number(body.order); if (Number.isFinite(n)) out.order = n; }
    else out[field] = String(body[field]).trim();
  }
  if (out.theme && !SERVICE_THEMES.includes(out.theme)) delete out.theme;
  if (out.icon && !SERVICE_ICONS.includes(out.icon)) delete out.icon;
  if (out.imagePos && !['center', 'top', 'bottom'].includes(out.imagePos)) delete out.imagePos;
  return out;
};

// Links must stay inside the app (e.g. /hotels) or be a normal web address.
const isSafePath = (value) => /^\/(?!\/)[^\s]*$/.test(value) || /^https:\/\/[^\s]+$/i.test(value);

const slugify = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const fail = (res, status, message) => res.status(status).json({ success: false, message });

const withImage = async (req, data) => {
  if (req.file) {
    const uploaded = await uploadToCloudinary(req.file.path, 'app-services');
    data.image = uploaded.url;
  }
  return data;
};

export const listAppServices = async (req, res) => {
  try {
    await ensureSeeded();
    const services = await AppService.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: services, settings: await getHomeSettings() });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const adminListAppServices = async (req, res) => {
  try {
    await ensureSeeded();
    const services = await AppService.find().sort({ order: 1, createdAt: 1 }).lean();
    res.json({ success: true, data: services, settings: await getHomeSettings(), options: { themes: SERVICE_THEMES, icons: SERVICE_ICONS } });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const createAppService = async (req, res) => {
  try {
    await ensureSeeded();
    const data = await withImage(req, pick(req.body));
    if (!data.title) return fail(res, 400, 'Title is required');
    if (!data.path || !isSafePath(data.path)) return fail(res, 400, 'Link must start with / (e.g. /hotels) or https://');
    let key = slugify(req.body.key || data.title) || `service-${Date.now()}`;
    if (await AppService.exists({ key })) key = `${key}-${Date.now().toString(36)}`;
    if (data.order === undefined) {
      const last = await AppService.findOne().sort({ order: -1 }).lean();
      data.order = (last?.order || 0) + 10;
    }
    const service = await AppService.create({ ...data, key });
    res.status(201).json({ success: true, data: service });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const updateAppService = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 404, 'Service not found');
    const data = await withImage(req, pick(req.body));
    if (data.title !== undefined && !data.title) return fail(res, 400, 'Title is required');
    if (data.path !== undefined && !isSafePath(data.path)) return fail(res, 400, 'Link must start with / (e.g. /hotels) or https://');
    const service = await AppService.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!service) return fail(res, 404, 'Service not found');
    res.json({ success: true, data: service });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const deleteAppService = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 404, 'Service not found');
    const service = await AppService.findByIdAndDelete(req.params.id);
    if (!service) return fail(res, 404, 'Service not found');
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const updateHomeSettings = async (req, res) => {
  try {
    const update = {};
    for (const field of ['greetingSubtitle', 'sectionTitle']) {
      if (req.body?.[field] !== undefined) update[field] = String(req.body[field]).trim().slice(0, 80);
    }
    if (update.sectionTitle === '') return fail(res, 400, 'Section title is required');
    await AppHomeSettings.findOneAndUpdate({}, { $set: update }, { upsert: true, setDefaultsOnInsert: true });
    res.json({ success: true, settings: await getHomeSettings() });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

// Saves a new order from the admin's drag/arrow list: body.ids in display order.
export const reorderAppServices = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter((id) => mongoose.Types.ObjectId.isValid(id)) : [];
    if (!ids.length) return fail(res, 400, 'Nothing to reorder');
    await AppService.bulkWrite(ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: (index + 1) * 10 } } }
    })));
    res.json({ success: true });
  } catch (error) {
    fail(res, 500, error.message);
  }
};
