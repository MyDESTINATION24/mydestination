import mongoose from 'mongoose';

const careerApplicationSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  image: { type: String }, // Keep for compatibility
  profileImage: { type: String }, // URL of the uploaded profile picture
  resume: { type: String }, // URL of the uploaded resume/CV
  status: { type: String, enum: ['New', 'Reviewed', 'Contacted', 'Rejected'], default: 'New' },
}, { timestamps: true });

export default mongoose.model('CareerApplication', careerApplicationSchema);
