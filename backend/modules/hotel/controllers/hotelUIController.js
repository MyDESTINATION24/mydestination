import HotelUISetting from '../models/HotelUISetting.js';

const defaultSettings = {
  theme: {
    primaryColor: '#FFD000',
    secondaryColor: '#1E293B',
    backgroundColor: '#F8FAFC',
    cardBgColor: '#F8FAFC',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '16px',
    iconRadius: '50%',
    useGradient: true,
    gradientStart: '#FFD000',
    gradientEnd: '#FF9E00',
    cardHeaderColor: '#FFD000',
    vipTheme: 'dark_gold'
  },
  heroBanner: {
    bannerUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    title: 'Welcome to Grand Luxury Stay',
    subTitle: 'Enjoy world-class hospitality & premium room service',
    bannerRadius: '16px'
  },
  activeServices: {
    roomService: true,
    spaBooking: true,
    cabBooking: true,
    laundryService: true,
    diningBooking: false,
    eventHall: false
  },
  customAnnouncement: {
    enabled: false,
    text: ''
  },
  sidebar: {
    profileBgColor: '#5F8575',
    headerBgColor: '#ffffff',
    accentColor: '#5F8575'
  },
  header: {
    headerBgColor: '#5F8575',
    useGradient: false,
    gradientStart: '#5F8575',
    gradientEnd: '#2E5B4B'
  }
};

// GET UI Settings for a Hotel
export const getHotelUISettings = async (req, res) => {
  try {
    const { hotelId } = req.params;
    let settings = await HotelUISetting.findOne({ hotelId });
    
    if (!settings) {
      settings = await HotelUISetting.findOne({ hotelId: 'global-default' });
    }

    if (!settings) {
      return res.status(200).json({
        success: true,
        data: { hotelId, ...defaultSettings, isDefault: true }
      });
    }

    res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching Hotel UI Settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve Hotel UI Settings',
      error: error.message
    });
  }
};

// UPDATE UI Settings for a Hotel
export const updateHotelUISettings = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { theme, heroBanner, activeServices, customAnnouncement, sidebar, header } = req.body;

    const settings = await HotelUISetting.findOneAndUpdate(
      { hotelId },
      {
        hotelId,
        theme,
        heroBanner,
        activeServices,
        customAnnouncement,
        sidebar,
        header
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Hotel UI Settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating Hotel UI Settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update Hotel UI Settings',
      error: error.message
    });
  }
};
