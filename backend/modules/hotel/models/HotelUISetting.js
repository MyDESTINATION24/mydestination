import mongoose from 'mongoose';

const HotelUISettingSchema = new mongoose.Schema({
  hotelId: { 
    type: String, 
    required: true,
    unique: true,
    index: true 
  },
  theme: {
    primaryColor: { type: String, default: '#FFD000' },
    secondaryColor: { type: String, default: '#1E293B' },
    backgroundColor: { type: String, default: '#F8FAFC' },
    cardBgColor: { type: String, default: '#F8FAFC' },
    fontFamily: { type: String, default: 'Inter, sans-serif' },
    borderRadius: { type: String, default: '16px' },
    useGradient: { type: Boolean, default: true },
    gradientStart: { type: String, default: '#FFD000' },
    gradientEnd: { type: String, default: '#FF9E00' },
    cardHeaderColor: { type: String, default: '#FFD000' },
    vipTheme: { type: String, default: 'dark_gold' }
  },
  heroBanner: {
    bannerUrl: { type: String, default: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80' },
    title: { type: String, default: 'Welcome to Grand Luxury Stay' },
    subTitle: { type: String, default: 'Enjoy world-class hospitality & premium room service' }
  },
  activeServices: {
    roomService: { type: Boolean, default: true },
    spaBooking: { type: Boolean, default: true },
    cabBooking: { type: Boolean, default: true },
    laundryService: { type: Boolean, default: true },
    diningBooking: { type: Boolean, default: false },
    eventHall: { type: Boolean, default: false }
  },
  customAnnouncement: {
    enabled: { type: Boolean, default: false },
    text: { type: String, default: '' }
  }
}, { timestamps: true });

export default mongoose.model('HotelUISetting', HotelUISettingSchema);
