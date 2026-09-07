import LandingPageConfig from '../models/LandingPageConfig.js';

const STALE_ADDRESSES = ['1 My Address, My Street, New York City, NY, USA', '1 Street, New York, NY, USA'];

// Get the public configuration
export const getLandingPageConfig = async (req, res) => {
  try {
    let config = await LandingPageConfig.findOne();
    if (!config) {
      config = await LandingPageConfig.create({});
    } else if (STALE_ADDRESSES.includes(config.footer?.address)) {
      config.footer.address = 'Flat No. 68, Chotti Gwal Toli, Sarwate Bus Stand, Indore, Madhya Pradesh - 452001';
      await config.save();
    }
    res.status(200).json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching landing page config:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update configuration
export const updateLandingPageConfig = async (req, res) => {
  try {
    const updateData = req.body;
    let config = await LandingPageConfig.findOne();
    
    if (!config) {
      config = new LandingPageConfig(updateData);
      await config.save();
    } else {
      // Update fields explicitly using $set to prevent nested array drops
      config = await LandingPageConfig.findOneAndUpdate({}, { $set: updateData }, { new: true, runValidators: true });
    }
    
    res.status(200).json({ success: true, data: config, message: 'Configuration updated successfully' });
  } catch (error) {
    console.error('Error updating landing page config:', error);
    res.status(500).json({ success: false, message: 'Server error updating config' });
  }
};
