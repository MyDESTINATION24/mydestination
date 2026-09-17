import express from 'express';
import {
  listSections,
  getSectionBySlug,
  getSectionItem,
  adminListSections,
  createSection,
  updateSection,
  deleteSection,
  adminListItems,
  createItem,
  updateItem,
  deleteItem
} from '../controllers/contentSectionController.js';
import { protect, authorizedRoles } from '../../../middlewares/authMiddleware.js';
import upload from '../../../utils/multer.js';

const router = express.Router();
const adminOnly = [protect, authorizedRoles('admin', 'superadmin')];

// Admin (declared before /:slug so "admin" is never read as a slug)
router.get('/admin/all', ...adminOnly, adminListSections);
router.post('/admin', ...adminOnly, createSection);
router.put('/admin/:id', ...adminOnly, updateSection);
router.delete('/admin/:id', ...adminOnly, deleteSection);
router.get('/admin/:id/items', ...adminOnly, adminListItems);
router.post('/admin/:id/items', ...adminOnly, upload.single('image'), createItem);
router.put('/admin/items/:itemId', ...adminOnly, upload.single('image'), updateItem);
router.delete('/admin/items/:itemId', ...adminOnly, deleteItem);

// Public
router.get('/', listSections);
router.get('/:slug', getSectionBySlug);
router.get('/:slug/items/:itemId', getSectionItem);

export default router;
