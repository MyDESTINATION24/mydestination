import mongoose from 'mongoose';

// A content block on the public site: its navbar tab, the heading shown above
// its cards on the homepage, and its own listing page. The Blogs and Articles
// blocks are 'builtin' records whose cards still come from the Blog and
// Article collections; admins add further 'custom' sections whose cards are
// SectionItem documents.
const contentSectionSchema = new mongoose.Schema({
  kind: {
    type: String,
    enum: ['blogs', 'articles', 'custom'],
    default: 'custom',
    index: true
  },
  navLabel: { type: String, required: true, trim: true },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },
  subtitle: { type: String, default: '', trim: true },
  title: { type: String, default: '', trim: true },
  description: { type: String, default: '', trim: true },
  buttonText: { type: String, default: '', trim: true },
  homeLimit: { type: Number, default: 3, min: 1, max: 12 },
  showInNav: { type: Boolean, default: true },
  showOnHome: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('ContentSection', contentSectionSchema);
