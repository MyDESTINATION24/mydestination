import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Wallet, Bell, Menu } from 'lucide-react';
import { DEFAULT_LOCATION_LABEL, getSavedLocationLabel, LOCATION_UPDATED_EVENT } from '../services/locationStore';


const fallingCoins = [
  { id: 1, left: '24%', delay: 0 },
  { id: 2, left: '50%', delay: 0.65 },
  { id: 3, left: '72%', delay: 1.2 },
];

import { useSettings } from '../../../shared/context/SettingsContext';
import TaxiSidebar from './TaxiSidebar';

const HeaderGreeting = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const appLogo = settings.general?.logo || settings.customization?.logo || settings.general?.favicon || '';
  const appName = settings.general?.app_name || 'App';
  const [locationLabel, setLocationLabel] = useState(getSavedLocationLabel);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const syncLocationLabel = () => {
      setLocationLabel(getSavedLocationLabel());
    };

    syncLocationLabel();
    window.addEventListener('storage', syncLocationLabel);
    window.addEventListener(LOCATION_UPDATED_EVENT, syncLocationLabel);

    return () => {
      window.removeEventListener('storage', syncLocationLabel);
      window.removeEventListener(LOCATION_UPDATED_EVENT, syncLocationLabel);
    };
  }, []);

  return (
    <>
      <TaxiSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* TOP HEADER (Sticky, Yellow, Flat Bottom) */}
      <div className="bg-[#FFCC00] px-5 pt-6 pb-4 w-full sticky top-0 z-50 rounded-none shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1 -ml-1 text-slate-800 hover:opacity-80 transition-opacity"
            >
              <Menu size={24} />
            </button>

            <div className="h-6 w-[1px] bg-slate-800/20 mx-1"></div>

            <motion.button
              type="button"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.03, ease: 'easeOut' }}
              whileTap={{ scale: 0.99 }}
              onClick={() => navigate('/ride/select-location')}
              className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-transparent px-0 py-0 text-left transition-opacity active:opacity-80"
            >
              <MapPin size={16} className="text-slate-800 transition-colors" strokeWidth={2.5} />

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-700">Location</p>
                <p className="truncate text-[11px] font-black tracking-tight text-slate-900">{locationLabel}</p>
              </div>
            </motion.button>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/taxi/wallet')}
              className="relative p-2.5 rounded-full bg-white/40 text-slate-900 hover:bg-white/60 transition-colors shadow-sm border border-white/30 active:scale-95"
              title="My Wallet"
            >
              <Wallet size={20} />
            </button>
            
            <button
              onClick={() => navigate('/taxi/notifications')}
              className="relative p-2.5 rounded-full bg-white/40 text-slate-900 hover:bg-white/60 transition-colors shadow-sm border border-white/30 active:scale-95"
              title="Notifications"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[#FFCC00] rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

    </>
  );
};

export default HeaderGreeting;
