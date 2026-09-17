import mongoose from 'mongoose';

// A card inside a custom ContentSection.
const sectionItemSchema = new mongoose.Schema({
  section: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ContentSection',
    required: true,
    index: true
  },
  title: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  category: { type: String, default: '', trim: true },
  badge: { type: String, default: '', trim: true },
  readTime: { type: String, default: '', trim: true },
  excerpt: { type: String, default: '' },
  content: { type: String, default: '' },
  date: {
    type: String,
    default: () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('SectionItem', sectionItemSchema);
