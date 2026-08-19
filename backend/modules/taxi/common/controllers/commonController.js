import { asyncHandler } from '../../../../utils/asyncHandler.js';
import { uploadDataUrlToCloudinary } from '../../../../utils/cloudinaryUpload.js';
import { env } from '../../../../config/env.js';
import { getReferralSettings, getReferralTranslationContent } from '../../admin/services/adminService.js';
import { getPublicActivePaymentGateway } from '../../services/paymentGatewayService.js';
import { SetPrice } from '../../admin/models/SetPrice.js';

/**
 * Common controller for shared utilities like file uploads
 */
export const uploadImage = asyncHandler(async (req, res) => {
    const { image, folder = 'general' } = req.body;

    if (!image) {
        return res.status(400).json({ success: false, message: 'Image data is required' });
    }

    // folder is interpolated straight into the Cloudinary path, so keep it to a
    // single plain segment -- otherwise a caller picks where their upload lands.
    const safeFolder = String(folder).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'general';

    const uploadResult = await uploadDataUrlToCloudinary({
        dataUrl: image,
        folder: `${env.cloudinary.folder}/${safeFolder}`,
        publicIdPrefix: `content-${safeFolder}`
    });

    return res.json({
        success: true,
        data: {
            url: uploadResult.secureUrl,
            publicId: uploadResult.publicId,
            format: uploadResult.format
        }
    });
});

export const getReferralTranslation = asyncHandler(async (req, res) => {
    const languageCode = String(req.query?.language || req.query?.lang || '').trim().toLowerCase();
    const data = await getReferralTranslationContent(languageCode);

    return res.json({
        success: true,
        data,
    });
});

export const getReferralSettingsContent = asyncHandler(async (req, res) => {
    const type = String(req.query?.type || '').trim().toLowerCase();
    const data = await getReferralSettings(type || undefined);

    return res.json({
        success: true,
        data,
    });
});

export const getPaymentGatewayConfig = asyncHandler(async (_req, res) => {
    const data = await getPublicActivePaymentGateway();

    return res.json({
        success: true,
        data,
    });
});

export const acknowledgePhonePeCallback = asyncHandler(async (_req, res) => {
    return res.json({
        success: true,
        message: 'Callback received',
    });
});

// The rider app needs the ride pricing rules to quote a fare. It used to read
// them from /admin/types/set-prices, which is admin-only: a user token got a
// 403, the rules came back empty, and every trip was quoted at a placeholder
// price far below the server's minimum -- so long bookings were rejected.
// These are the numbers already shown to the rider, so they are safe to serve;
// only the fields the fare calculator needs are returned.
export const getRidePricingRules = asyncHandler(async (_req, res) => {
  const rules = await SetPrice.find({ pricing_scope: 'ride', active: 1 })
    .select([
      'vehicle_type',
      'service_location_id',
      'transport_type',
      'pricing_scope',
      'active',
      'status',
      'base_price',
      'base_distance',
      'price_per_distance',
      'time_price',
      'service_tax',
      'createdAt',
      'updatedAt',
    ].join(' '))
    .lean();

  const results = rules.map((rule) => ({
    ...rule,
    id: String(rule._id),
    type_id: rule.vehicle_type ? String(rule.vehicle_type) : null,
    vehicle_type: rule.vehicle_type ? String(rule.vehicle_type) : null,
    service_location_id: rule.service_location_id ? String(rule.service_location_id) : null,
  }));

  return res.json({ success: true, results, paginator: { data: results } });
});
