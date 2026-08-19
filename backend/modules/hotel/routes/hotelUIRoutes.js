import express from 'express';
import { getHotelUISettings, updateHotelUISettings } from '../controllers/hotelUIController.js';
import { protect, authorizedRoles } from '../../../middlewares/authMiddleware.js';

const router = express.Router();

// GET hotel UI settings by hotelId
router.get('/settings/:hotelId', getHotelUISettings);

// PUT update hotel UI settings by hotelId.
// This was unauthenticated while doing a findOneAndUpdate with upsert, so
// anyone could rewrite any hotel's theme, hero banner and announcement text --
// including the 'global-default' record the whole storefront reads on load.
// The GET above stays public: every page load reads the theme from it.
router.put(
  '/settings/:hotelId',
  protect,
  authorizedRoles('admin', 'superadmin'),
  updateHotelUISettings,
);

export default router;
