import LandingPageConfig from '../models/LandingPageConfig.js';

// Get the public configuration
export const getLandingPageConfig = async (req, res) => {
  try {
    let config = await LandingPageConfig.findOne();
    if (!config) {
      // If none exists, create a default one
      config = await LandingPageConfig.create({});
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
