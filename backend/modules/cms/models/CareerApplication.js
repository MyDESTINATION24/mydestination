import mongoose from 'mongoose';

const careerApplicationSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  image: { type: String }, // URL of the uploaded image/resume
  status: { type: String, enum: ['New', 'Reviewed', 'Contacted', 'Rejected'], default: 'New' },
}, { timestamps: true });

export default mongoose.model('CareerApplication', careerApplicationSchema);
