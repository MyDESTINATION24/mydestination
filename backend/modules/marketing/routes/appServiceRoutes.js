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
import {
  adminListBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  reorderBanners
} from '../controllers/appBannerController.js';
import { protect, authorizedRoles } from '../../../middlewares/authMiddleware.js';
import upload from '../../../utils/multer.js';

const router = express.Router();
const adminOnly = [protect, authorizedRoles('admin', 'superadmin')];

// Public: the app home screen's "Explore Services" cards.
router.get('/', listAppServices);

// Admin: banners (registered before /admin/:id)
router.get('/admin/banners', ...adminOnly, adminListBanners);
router.post('/admin/banners', ...adminOnly, upload.single('image'), createBanner);
router.put('/admin/banners/reorder', ...adminOnly, reorderBanners);
router.put('/admin/banners/:id', ...adminOnly, upload.single('image'), updateBanner);
router.delete('/admin/banners/:id', ...adminOnly, deleteBanner);

// Admin
router.get('/admin/all', ...adminOnly, adminListAppServices);
router.post('/admin', ...adminOnly, upload.single('image'), createAppService);
router.put('/admin/reorder', ...adminOnly, reorderAppServices);
router.put('/admin/settings', ...adminOnly, updateHomeSettings);
router.put('/admin/:id', ...adminOnly, upload.single('image'), updateAppService);
router.delete('/admin/:id', ...adminOnly, deleteAppService);

export default router;
