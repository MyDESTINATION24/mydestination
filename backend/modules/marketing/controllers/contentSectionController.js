import mongoose from 'mongoose';
import ContentSection from '../models/ContentSection.js';
import SectionItem from '../models/SectionItem.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.js';

// The Blogs and Articles headings used to be hardcoded in LandingPage.jsx and
// their navbar tabs in the header components. They are seeded here with that
// same text the first time sections are read, and from then on the CMS owns
// them. $setOnInsert never overwrites what an admin has since changed.
const BUILTIN_SECTIONS = [
  {
    kind: 'blogs',
    slug: 'blogs',
    navLabel: 'Blogs',
    subtitle: 'Stories & Insights',
    title: 'Latest Blogs & Travel Hacks',
    description: 'Handpicked travel guides, stay tips, and smart booking hacks from our team.',
    buttonText: 'Explore All Blogs',
    order: 20
  },
  {
    kind: 'articles',
    slug: 'articles',
    navLabel: 'Articles',
    subtitle: 'Reads & Deep Dives',
    title: 'Travel Articles',
    description: 'Longer reads on destinations, culture and planning, written by our editors.',
    buttonText: 'Explore All Articles',
    order: 10
  }
];

let builtinsEnsured = false;
const ensureBuiltinSections = async () => {
  if (builtinsEnsured) return;
  await Promise.all(BUILTIN_SECTIONS.map((section) =>
    ContentSection.updateOne(
      { kind: section.kind },
      { $setOnInsert: section },
      { upsert: true }
    )
  ));
  builtinsEnsured = true;
};

const SECTION_FIELDS = ['navLabel', 'subtitle', 'title', 'description', 'buttonText', 'homeLimit', 'showInNav', 'showOnHome', 'isActive', 'order'];
const ITEM_FIELDS = ['title', 'image', 'category', 'badge', 'readTime', 'excerpt', 'content', 'isActive', 'order'];
const RESERVED_SLUGS = new Set(['blogs', 'articles', 'admin', 'new']);

const toBool = (value) => value === true || value === 'true' || value === '1' || value === 1;

const pickFields = (body, fields) => {
  const out = {};
  for (const field of fields) {
    if (body[field] === undefined) continue;
    if (['showInNav', 'showOnHome', 'isActive'].includes(field)) {
      out[field] = toBool(body[field]);
    } else if (['homeLimit', 'order'].includes(field)) {
      const n = Number(body[field]);
      if (Number.isFinite(n)) out[field] = n;
    } else {
      out[field] = String(body[field]);
    }
  }
  return out;
};

const slugify = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

const fail = (res, status, message) => res.status(status).json({ success: false, message });

// ---------- public ----------

export const listSections = async (req, res) => {
  try {
    await ensureBuiltinSections();
    const sections = await ContentSection.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();

    // Homepage cards for custom sections, so the landing page needs one call.
    const customIds = sections.filter((s) => s.kind === 'custom' && s.showOnHome).map((s) => s._id);
    const items = customIds.length
      ? await SectionItem.find({ section: { $in: customIds }, isActive: true }).sort({ order: 1, createdAt: -1 }).lean()
      : [];
    const bySection = new Map();
    for (const item of items) {
      const key = String(item.section);
      if (!bySection.has(key)) bySection.set(key, []);
      bySection.get(key).push(item);
    }

    res.json({
      success: true,
      data: sections.map((section) => (
        section.kind === 'custom'
          ? { ...section, items: (bySection.get(String(section._id)) || []).slice(0, section.homeLimit || 3) }
          : section
      ))
    });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const getSectionBySlug = async (req, res) => {
  try {
    await ensureBuiltinSections();
    const section = await ContentSection.findOne({ slug: String(req.params.slug).toLowerCase(), isActive: true }).lean();
    if (!section) return fail(res, 404, 'Section not found');
    const items = section.kind === 'custom'
      ? await SectionItem.find({ section: section._id, isActive: true }).sort({ order: 1, createdAt: -1 }).lean()
      : [];
    res.json({ success: true, data: { section, items } });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const getSectionItem = async (req, res) => {
  try {
    const { slug, itemId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(itemId)) return fail(res, 404, 'Not found');
    const section = await ContentSection.findOne({ slug: String(slug).toLowerCase(), kind: 'custom', isActive: true }).lean();
    if (!section) return fail(res, 404, 'Section not found');
    const item = await SectionItem.findOne({ _id: itemId, section: section._id, isActive: true }).lean();
    if (!item) return fail(res, 404, 'Not found');
    const related = await SectionItem.find({ section: section._id, isActive: true, _id: { $ne: item._id } })
      .sort({ order: 1, createdAt: -1 }).limit(3).lean();
    res.json({ success: true, data: { section, item, related } });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

// ---------- admin ----------

export const adminListSections = async (req, res) => {
  try {
    await ensureBuiltinSections();
    const sections = await ContentSection.find().sort({ order: 1, createdAt: 1 }).lean();
    const counts = await SectionItem.aggregate([{ $group: { _id: '$section', count: { $sum: 1 } } }]);
    const countBy = new Map(counts.map((c) => [String(c._id), c.count]));
    res.json({
      success: true,
      data: sections.map((s) => ({ ...s, itemCount: countBy.get(String(s._id)) || 0 }))
    });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const createSection = async (req, res) => {
  try {
    const data = pickFields(req.body, SECTION_FIELDS);
    if (!data.navLabel?.trim()) return fail(res, 400, 'Navbar label is required');
    const slug = slugify(req.body.slug || data.navLabel);
    if (!slug) return fail(res, 400, 'Enter a label using letters or numbers');
    if (RESERVED_SLUGS.has(slug)) return fail(res, 400, `"${slug}" is reserved, choose another name`);
    if (await ContentSection.exists({ slug })) return fail(res, 409, 'A section with this name already exists');
    if (data.order === undefined) {
      const last = await ContentSection.findOne().sort({ order: -1 }).lean();
      data.order = (last?.order || 0) + 10;
    }
    const section = await ContentSection.create({ ...data, slug, kind: 'custom' });
    res.status(201).json({ success: true, data: section });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const updateSection = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 404, 'Section not found');
    const data = pickFields(req.body, SECTION_FIELDS);
    if (data.navLabel !== undefined && !data.navLabel.trim()) return fail(res, 400, 'Navbar label is required');
    const section = await ContentSection.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!section) return fail(res, 404, 'Section not found');
    res.json({ success: true, data: section });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const deleteSection = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 404, 'Section not found');
    const section = await ContentSection.findById(req.params.id);
    if (!section) return fail(res, 404, 'Section not found');
    if (section.kind !== 'custom') {
      return fail(res, 400, 'Blogs and Articles cannot be deleted. Turn off "Active" to hide them.');
    }
    await SectionItem.deleteMany({ section: section._id });
    await section.deleteOne();
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const adminListItems = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 404, 'Section not found');
    const items = await SectionItem.find({ section: req.params.id }).sort({ order: 1, createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

const resolveImage = async (req, current) => {
  if (req.file) {
    const uploaded = await uploadToCloudinary(req.file.path, 'sections');
    return uploaded.url;
  }
  return req.body.image !== undefined ? String(req.body.image) : current;
};

export const createItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return fail(res, 404, 'Section not found');
    const section = await ContentSection.findOne({ _id: req.params.id, kind: 'custom' });
    if (!section) return fail(res, 404, 'Section not found');
    const data = pickFields(req.body, ITEM_FIELDS);
    data.image = await resolveImage(req, '');
    if (!data.title?.trim()) return fail(res, 400, 'Title is required');
    if (!data.image) return fail(res, 400, 'Image is required');
    const item = await SectionItem.create({ ...data, section: section._id });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const updateItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) return fail(res, 404, 'Item not found');
    const item = await SectionItem.findById(req.params.itemId);
    if (!item) return fail(res, 404, 'Item not found');
    const data = pickFields(req.body, ITEM_FIELDS);
    data.image = await resolveImage(req, item.image);
    if (data.title !== undefined && !data.title.trim()) return fail(res, 400, 'Title is required');
    if (!data.image) return fail(res, 400, 'Image is required');
    Object.assign(item, data);
    await item.save();
    res.json({ success: true, data: item });
  } catch (error) {
    fail(res, 500, error.message);
  }
};

export const deleteItem = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.itemId)) return fail(res, 404, 'Item not found');
    const item = await SectionItem.findByIdAndDelete(req.params.itemId);
    if (!item) return fail(res, 404, 'Item not found');
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    fail(res, 500, error.message);
  }
};
