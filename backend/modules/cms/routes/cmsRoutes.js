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
import { convertDocxToHtml } from '../services/docxToHtmlService.js';

// Converts an uploaded Word file to clean HTML for rich-text editors (e.g. the
// wedding destination description). Nothing is stored; the editor receives the
// HTML and the admin saves it with the rest of the form.
const docxToHtml = (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, message: 'Choose a .docx file' });
  const isDocx = /\.docx$/i.test(file.originalname || '') && file.buffer?.readUInt32LE?.(0) === 0x04034b50;
  if (!isDocx) {
    return res.status(400).json({ success: false, message: 'Only Word .docx files are supported. In Word use File > Save As > .docx' });
  }
  try {
    const { html, stats } = convertDocxToHtml(file.buffer);
    if (!html.trim()) return res.status(422).json({ success: false, message: 'No text found in this document' });
    res.json({ success: true, data: { html, stats } });
  } catch (error) {
    res.status(422).json({ success: false, message: error.message || 'Could not read this document' });
  }
};

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
router.post('/docx/to-html', protect, authorizedRoles('admin', 'superadmin', 'cms_admin'), uploadMiddleware, docxToHtml);
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
