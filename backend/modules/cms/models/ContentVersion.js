import mongoose from 'mongoose';

const ContentVersionSchema = new mongoose.Schema(
  {
    contentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DocxContent', required: true, index: true },
    slug: { type: String, required: true, index: true },
    jsonAst: { type: Array, required: true },
    version: { type: Number, required: true },
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
    createdBy: { type: String, default: 'System Admin' },
    validationReport: { type: Object, default: {} },
  },
  { timestamps: true }
);

ContentVersionSchema.index({ contentId: 1, version: -1 });

export default mongoose.model('DocxContentVersion', ContentVersionSchema);
