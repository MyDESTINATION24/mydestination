import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // UPLOAD_DRAFT, PUBLISH, ROLLBACK, DELETE
    slug: { type: String, required: true },
    version: { type: Number },
    adminUser: { type: String, default: 'System Admin' },
    ipAddress: { type: String },
    details: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('DocxAuditLog', AuditLogSchema);
