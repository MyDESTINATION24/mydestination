import { Router } from 'express';
import * as commonController from '../controllers/commonController.js';
import { authenticate } from '../../middlewares/authMiddleware.js';

export const commonRouter = Router();

// Universal image upload endpoint. Any signed-in role may use it -- drivers,
// owners and admins all upload through here -- but it was open to the whole
// internet, which made it free Cloudinary hosting billed to this account,
// with a caller-controlled folder to scatter it through.
commonRouter.post(
  '/common/upload/image',
  authenticate(['user', 'driver', 'owner', 'admin', 'service_center', 'bus_driver', 'pooling']),
  commonController.uploadImage,
);
commonRouter.get('/common/referrals/translation', commonController.getReferralTranslation);
commonRouter.get('/common/referrals/settings', commonController.getReferralSettingsContent);
commonRouter.get('/common/payment-gateway', commonController.getPaymentGatewayConfig);
commonRouter.get('/common/set-prices', commonController.getRidePricingRules);
commonRouter.post('/common/payment-gateway/phonepe/callback', commonController.acknowledgePhonePeCallback);
