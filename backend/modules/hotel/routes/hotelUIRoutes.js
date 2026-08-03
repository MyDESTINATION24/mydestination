import express from 'express';
import { getHotelUISettings, updateHotelUISettings } from '../controllers/hotelUIController.js';

const router = express.Router();

// GET hotel UI settings by hotelId
router.get('/settings/:hotelId', getHotelUISettings);

// PUT update hotel UI settings by hotelId
router.put('/settings/:hotelId', updateHotelUISettings);

export default router;
