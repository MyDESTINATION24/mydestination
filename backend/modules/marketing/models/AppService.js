import mongoose from 'mongoose';

// A card in the app home screen's "Explore Services" list (Hotels, Cab,
// Wedding, Helicopter, Char Dham...). Colours and icons are chosen from fixed
// presets so admins cannot produce an unreadable or broken card.
export const SERVICE_THEMES = ['emerald', 'amber', 'rose', 'sky', 'orange', 'violet', 'indigo', 'teal'];
export const SERVICE_ICONS = ['building', 'car', 'heart', 'helicopter', 'mappin', 'compass', 'sparkles', 'plane', 'mountain', 'bus'];

const appServiceSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  image: { type: String, default: '' },
  imagePos: { type: String, enum: ['center', 'top', 'bottom'], default: 'center' },
  path: { type: String, required: true, trim: true },
  ctaText: { type: String, default: 'Explore', trim: true },
  theme: { type: String, enum: SERVICE_THEMES, default: 'emerald' },
  icon: { type: String, enum: SERVICE_ICONS, default: 'compass' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('AppService', appServiceSchema);

// Single document: the fixed text around the cards on the app home screen.
const appHomeSettingsSchema = new mongoose.Schema({
  greetingSubtitle: { type: String, default: 'What are you looking for today?', trim: true },
  sectionTitle: { type: String, default: 'Explore Services', trim: true },
}, { timestamps: true });

export const AppHomeSettings = mongoose.model('AppHomeSettings', appHomeSettingsSchema);
