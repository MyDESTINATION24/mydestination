import express from 'express';
import { getLandingPageConfig, updateLandingPageConfig } from '../controllers/cmsController.js';
import { protect, authorizedRoles } from '../../../middlewares/authMiddleware.js';

import upload, { uploadCareer } from '../../../utils/multer.js';
import { submitApplication, getApplications, updateApplicationStatus, deleteApplication } from '../controllers/careerController.js';

const router = express.Router();

// Public route to fetch configuration
router.get('/landing-page', getLandingPageConfig);

// Protected route for CMS admin
// Using superadmin or a new cms_admin role for now. Assuming superadmin has access.
router.put('/landing-page', protect, authorizedRoles('superadmin', 'cms_admin'), updateLandingPageConfig);

// Career Application Routes
router.post('/career/apply', uploadCareer.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), submitApplication); // Public
router.get('/career/applications', protect, authorizedRoles('admin', 'superadmin', 'cms_admin'), getApplications);
router.put('/career/applications/:id/status', protect, authorizedRoles('admin', 'superadmin', 'cms_admin'), updateApplicationStatus);
router.delete('/career/applications/:id', protect, authorizedRoles('admin', 'superadmin', 'cms_admin'), deleteApplication);

export default router;
