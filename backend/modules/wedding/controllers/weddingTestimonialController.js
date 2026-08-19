import WeddingTestimonial from '../models/WeddingTestimonial.js';
import { uploadBase64ToCloudinary } from '../../../utils/cloudinary.js';

// Public: Submit a testimonial
export const submitTestimonial = async (req, res) => {
  try {
    const { name, location, text, rating, image } = req.body;

    // Basic shape checks before doing any Cloudinary work, so a junk or oversized
    // payload cannot cost an upload. A base64 data URL is ~1.37x the byte size,
    // so 4MB of characters is roughly a 3MB image -- plenty for a testimonial.
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Your name is required' });
    }
    if (typeof location !== 'string' || location.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Location is required' });
    }
    if (typeof text !== 'string' || text.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Testimonial text is required' });
    }
    if (typeof image === 'string' && image.length > 4 * 1024 * 1024) {
      return res.status(413).json({ success: false, message: 'Image is too large' });
    }

    let imageUrl = typeof image === 'string' ? image : '';
    if (imageUrl && imageUrl.startsWith('data:image')) {
      try {
        const uploadResponse = await uploadBase64ToCloudinary(image, 'wedding/testimonials');
        imageUrl = uploadResponse.url;
      } catch (uploadError) {
        console.warn('Cloudinary upload failed for testimonial image', uploadError.message);
      }
    }

    const testimonial = await WeddingTestimonial.create({
      name,
      location,
      text,
      rating,
      image: imageUrl,
      status: 'pending'
    });

    res.status(201).json({ success: true, message: 'Testimonial submitted for review', data: testimonial });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    console.error('submitTestimonial error:', error);
    res.status(500).json({ success: false, message: 'Could not submit testimonial. Please try again.' });
  }
};

// Public: Get approved testimonials
export const getApprovedTestimonials = async (req, res) => {
  try {
    const testimonials = await WeddingTestimonial.find({ status: 'approved' }).sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Get all testimonials
export const getAllTestimonials = async (req, res) => {
  try {
    const testimonials = await WeddingTestimonial.find().sort({ createdAt: -1 });
    res.status(200).json(testimonials);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Approve/Reject testimonial
export const updateTestimonialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const updated = await WeddingTestimonial.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Delete testimonial
export const deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    await WeddingTestimonial.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Testimonial deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
