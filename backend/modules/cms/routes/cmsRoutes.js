import express from 'express';
import { getLandingPageConfig, updateLandingPageConfig } from '../controllers/cmsController.js';
import { protect, authorizedRoles } from '../../../middlewares/authMiddleware.js';

import upload, { uploadCareer } from '../../../utils/multer.js';
import { submitApplication, getApplications, updateApplicationStatus, deleteApplication } from '../controllers/careerController.js';

// Import DOCX CMS Controller
import {
  uploadMiddleware,
  uploadDraft,
  publishContent,
  rollbackVersion,
  getPublishedContent,
  getVersionHistory,
} from '../controllers/docxCmsController.js';

const router = express.Router();

// Public route to fetch configuration
router.get('/landing-page', getLandingPageConfig);

// Protected route for CMS admin
router.put('/landing-page', protect, authorizedRoles('superadmin', 'cms_admin'), updateLandingPageConfig);

// Career Application Routes
router.post('/career/apply', uploadCareer.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), submitApplication); // Public
router.get('/career/applications', protect, authorizedRoles('admin', 'superadmin', 'cms_admin'), getApplications);
router.put('/career/applications/:id/status', protect, authorizedRoles('admin', 'superadmin', 'cms_admin'), updateApplicationStatus);
router.delete('/career/applications/:id', protect, authorizedRoles('admin', 'superadmin', 'cms_admin'), deleteApplication);

// ==========================================
// DYNAMIC DOCX TYPOGRAPHY CMS API ROUTES
// ==========================================
// 1. Upload DOCX Draft
// These three were unauthenticated: anyone could upload a draft to any slug,
// publish it live at /docx/content/:slug, or roll back a version.
router.post('/docx/upload', protect, authorizedRoles('admin', 'superadmin', 'cms_admin'), uploadMiddleware, uploadDraft);

// 2. Publish Draft Live
router.post('/docx/publish/:slug', protect, authorizedRoles('admin', 'superadmin', 'cms_admin'), publishContent);

// 3. Rollback to legacy version
router.post('/docx/rollback/:versionId', protect, authorizedRoles('admin', 'superadmin', 'cms_admin'), rollbackVersion);

// 4. Public API for React Frontend Placeholders
router.get('/docx/content/:slug', getPublishedContent);

// 5. Version History & Audit Trail
router.get('/docx/history/:slug', getVersionHistory);

export default router;
