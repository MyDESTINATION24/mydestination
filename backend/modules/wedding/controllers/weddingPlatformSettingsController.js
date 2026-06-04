import WeddingPlatformSettings from '../models/WeddingPlatformSettings.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await WeddingPlatformSettings.findOne();
    if (!settings) {
      settings = await WeddingPlatformSettings.create({});
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

  export const updateSettings = async (req, res) => {
    try {
      const { 
        platformFee, vendorCommission, platformFeeType, vendorCommissionType,
        freeTrialEnabled, freeTrialStartDate, freeTrialEndDate, freeTrialDays, freeTrialLeads 
      } = req.body;
      
      let settings = await WeddingPlatformSettings.findOne();
      if (!settings) {
        settings = await WeddingPlatformSettings.create({ 
          platformFee, vendorCommission, platformFeeType, vendorCommissionType,
          freeTrialEnabled, freeTrialStartDate, freeTrialEndDate, freeTrialDays, freeTrialLeads
        });
      } else {
        if (platformFee !== undefined) settings.platformFee = platformFee;
        if (vendorCommission !== undefined) settings.vendorCommission = vendorCommission;
        if (platformFeeType !== undefined) settings.platformFeeType = platformFeeType;
        if (vendorCommissionType !== undefined) settings.vendorCommissionType = vendorCommissionType;
        if (freeTrialEnabled !== undefined) settings.freeTrialEnabled = freeTrialEnabled;
        if (freeTrialStartDate !== undefined) settings.freeTrialStartDate = freeTrialStartDate;
        if (freeTrialEndDate !== undefined) settings.freeTrialEndDate = freeTrialEndDate;
        if (freeTrialDays !== undefined) settings.freeTrialDays = freeTrialDays;
        if (freeTrialLeads !== undefined) settings.freeTrialLeads = freeTrialLeads;
        await settings.save();
      }
      
      res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
