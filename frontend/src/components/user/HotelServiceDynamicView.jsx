import React, { useEffect, useState } from 'react';
import { 
  Utensils, 
  Sparkles, 
  Car, 
  Shirt, 
  Coffee, 
  PartyPopper, 
  ArrowRight,
  ShieldCheck,
  PhoneCall,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const HotelServiceDynamicView = ({ hotelId = 'global-default' }) => {
  const [uiConfig, setUiConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHotelUIConfig();
  }, [hotelId]);

  const fetchHotelUIConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/hotel-ui/settings/${hotelId}`);
      const data = await res.json();
      if (data.success && data.data) {
        setUiConfig(data.data);
      }
    } catch (error) {
      console.error('Error loading hotel UI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-500 border-t-transparent mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Loading Hotel Services...</p>
      </div>
    );
  }

  const { theme, heroBanner, activeServices, customAnnouncement } = uiConfig || {};
  const primaryColor = theme?.primaryColor || '#FF385C';
  const borderRadius = theme?.borderRadius || '16px';
  const textColor = theme?.secondaryColor || '#1E293B';

  const handleServiceClick = (serviceName) => {
    toast.success(`${serviceName} request sent to hotel reception!`);
  };

  return (
    <div 
      className="max-w-4xl mx-auto p-4 md:p-6 space-y-6"
      style={{ fontFamily: theme?.fontFamily || 'Inter, sans-serif' }}
    >
      {/* Dynamic Announcement Banner */}
      {customAnnouncement?.enabled && customAnnouncement?.text?.trim() && !customAnnouncement.text.includes('Spa & Wellness Services') && (
        <div 
          className="p-3 text-center text-sm font-semibold text-white shadow-sm flex items-center justify-center gap-2"
          style={{ backgroundColor: primaryColor, borderRadius }}
        >
          <span>{customAnnouncement.text}</span>
        </div>
      )}

      {/* Dynamic Hero Banner */}
      <div 
        className="relative h-64 md:h-80 overflow-hidden shadow-lg flex flex-col justify-end p-6 md:p-8 text-white"
        style={{ borderRadius }}
      >
        <img 
          src={heroBanner?.bannerUrl} 
          alt="Hotel Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className="relative z-10 space-y-2">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-semibold rounded-full border border-white/30 uppercase tracking-wider">
            Guest Services
          </span>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight drop-shadow-md">
            {heroBanner?.title}
          </h1>
          <p className="text-sm md:text-base text-slate-200 drop-shadow-sm max-w-xl">
            {heroBanner?.subTitle}
          </p>
        </div>
      </div>

      {/* Active Services Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-xl font-bold" style={{ color: textColor }}>
            Available Hotel Services
          </h2>
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> 24/7 Desk Support
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {activeServices?.roomService && (
            <div 
              onClick={() => handleServiceClick('Room Service')}
              className="p-5 bg-white border border-slate-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
              style={{ borderRadius }}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-rose-50 rounded-xl" style={{ color: primaryColor }}>
                  <Utensils className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">In-Room Dining</h3>
                <p className="text-xs text-slate-500 mt-1">Order food & beverages directly to your room.</p>
              </div>
            </div>
          )}

          {activeServices?.spaBooking && (
            <div 
              onClick={() => handleServiceClick('Spa & Wellness')}
              className="p-5 bg-white border border-slate-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
              style={{ borderRadius }}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-purple-50 rounded-xl" style={{ color: primaryColor }}>
                  <Sparkles className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Spa & Massage</h3>
                <p className="text-xs text-slate-500 mt-1">Book relaxing massage sessions and therapies.</p>
              </div>
            </div>
          )}

          {activeServices?.cabBooking && (
            <div 
              onClick={() => handleServiceClick('Cab Booking')}
              className="p-5 bg-white border border-slate-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
              style={{ borderRadius }}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-amber-50 rounded-xl" style={{ color: primaryColor }}>
                  <Car className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Airport & City Taxi</h3>
                <p className="text-xs text-slate-500 mt-1">Request chauffeur-driven cabs for travel.</p>
              </div>
            </div>
          )}

          {activeServices?.laundryService && (
            <div 
              onClick={() => handleServiceClick('Laundry Service')}
              className="p-5 bg-white border border-slate-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
              style={{ borderRadius }}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-blue-50 rounded-xl" style={{ color: primaryColor }}>
                  <Shirt className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Laundry & Dry Clean</h3>
                <p className="text-xs text-slate-500 mt-1">Express garment wash and ironing service.</p>
              </div>
            </div>
          )}

          {activeServices?.diningBooking && (
            <div 
              onClick={() => handleServiceClick('Dining Table')}
              className="p-5 bg-white border border-slate-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
              style={{ borderRadius }}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-emerald-50 rounded-xl" style={{ color: primaryColor }}>
                  <Coffee className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Restaurant Reservation</h3>
                <p className="text-xs text-slate-500 mt-1">Reserve table for breakfast, lunch & dinner.</p>
              </div>
            </div>
          )}

          {activeServices?.eventHall && (
            <div 
              onClick={() => handleServiceClick('Event Hall')}
              className="p-5 bg-white border border-slate-100 shadow-sm hover:shadow-md transition duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
              style={{ borderRadius }}
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-indigo-50 rounded-xl" style={{ color: primaryColor }}>
                  <PartyPopper className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Banquet & Event Hall</h3>
                <p className="text-xs text-slate-500 mt-1">Book venues for parties, conferences & meetings.</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Quick Contact Footer */}
      <div 
        className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        style={{ borderRadius }}
      >
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/10 rounded-xl">
            <PhoneCall className="w-6 h-6 text-rose-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Need Reception Support?</h4>
            <p className="text-xs text-slate-400">Dial 0 from your room phone or tap to call</p>
          </div>
        </div>
        <button 
          onClick={() => handleServiceClick('Direct Reception Call')}
          className="px-5 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer transition"
          style={{ backgroundColor: primaryColor, borderRadius: '10px' }}
        >
          Call Desk
        </button>
      </div>

    </div>
  );
};

export default HotelServiceDynamicView;
