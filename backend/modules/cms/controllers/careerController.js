import CareerApplication from '../models/CareerApplication.js';
import notificationService from '../../../services/notificationService.js';
import { uploadToCloudinary } from '../../../utils/cloudinary.js';

// Public endpoint to submit application
export const submitApplication = async (req, res) => {
  try {
    const { firstName, lastName, email, role } = req.body;
    let profileImage = null;
    let resume = null;

    if (req.files) {
      if (req.files.profileImage && req.files.profileImage[0]) {
        const file = req.files.profileImage[0];
        const uploadResult = await uploadToCloudinary(file.path, 'career/profiles');
        profileImage = uploadResult.url;
      }
      if (req.files.resume && req.files.resume[0]) {
        const file = req.files.resume[0];
        const uploadResult = await uploadToCloudinary(file.path, 'career/resumes');
        resume = uploadResult.url;
      }
    }

    const application = await CareerApplication.create({
      firstName,
      lastName,
      email,
      role,
      profileImage,
      resume,
      image: resume // Keep for compatibility
    });

    // Notify admins (optional)
    try {
      await notificationService.sendToAdmins({
        title: 'New Job Application',
        body: `${firstName} ${lastName} applied for ${role}.`,
        data: { type: 'career_application', applicationId: application._id.toString() }
      });
    } catch (notifErr) {
      console.error('Failed to notify admins of new career application:', notifErr);
    }

    res.status(201).json({ success: true, message: 'Application submitted successfully', data: application });
  } catch (error) {
    console.error('Submit Application Error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application', error: error.message });
  }
};

// Admin endpoint to get all applications
export const getApplications = async (req, res) => {
  try {
    const applications = await CareerApplication.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error('Get Applications Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications', error: error.message });
  }
};

// Admin endpoint to update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await CareerApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, message: 'Status updated successfully', data: application });
  } catch (error) {
    console.error('Update Application Status Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// Admin endpoint to delete application
export const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await CareerApplication.findByIdAndDelete(id);

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.status(200).json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Delete Application Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete application', error: error.message });
  }
};
