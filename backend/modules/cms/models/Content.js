import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true, lowercase: true },
    locale: { type: String, default: 'en-US' },
    publishedAst: { type: Array, default: [] },
    publishedVersion: { type: Number, default: 0 },
    currentDraftAst: { type: Array, default: [] },
    hasUnpublishedChanges: { type: Boolean, default: true },
    lastValidationReport: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model('DocxContent', ContentSchema);
