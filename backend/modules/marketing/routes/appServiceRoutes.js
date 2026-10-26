import express from 'express';
import {
  listAppServices,
  adminListAppServices,
  createAppService,
  updateAppService,
  deleteAppService,
  reorderAppServices,
  updateHomeSettings
} from '../controllers/appServiceController.js';
import { protect, authorizedRoles } from '../../../middlewares/authMiddleware.js';
import upload from '../../../utils/multer.js';

const router = express.Router();
const adminOnly = [protect, authorizedRoles('admin', 'superadmin')];

// Public: the app home screen's "Explore Services" cards.
router.get('/', listAppServices);

// Admin
router.get('/admin/all', ...adminOnly, adminListAppServices);
router.post('/admin', ...adminOnly, upload.single('image'), createAppService);
router.put('/admin/reorder', ...adminOnly, reorderAppServices);
router.put('/admin/settings', ...adminOnly, updateHomeSettings);
router.put('/admin/:id', ...adminOnly, upload.single('image'), updateAppService);
router.delete('/admin/:id', ...adminOnly, deleteAppService);

export default router;
