import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search, Wallet, Bell } from 'lucide-react';
import { DEFAULT_LOCATION_LABEL, getSavedLocationLabel, LOCATION_UPDATED_EVENT } from '../services/locationStore';


const fallingCoins = [
  { id: 1, left: '24%', delay: 0 },
  { id: 2, left: '50%', delay: 0.65 },
  { id: 3, left: '72%', delay: 1.2 },
];

import { useSettings } from '../../../shared/context/SettingsContext';

const HeaderGreeting = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const appLogo = settings.general?.logo || settings.customization?.logo || settings.general?.favicon || '';
  const appName = settings.general?.app_name || 'App';
  const [locationLabel, setLocationLabel] = useState(getSavedLocationLabel);

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
    <div className="px-5 pt-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">


          <motion.button
            type="button"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.03, ease: 'easeOut' }}
            whileTap={{ scale: 0.99 }}
            onClick={() => navigate('/ride/select-location')}
            className="group flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-transparent px-0 py-0 text-left transition-opacity active:opacity-80"
          >
            <MapPin size={16} className="text-slate-500 transition-colors group-hover:text-slate-700" strokeWidth={2.5} />

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black uppercase tracking-[0.22em] text-slate-400">Location</p>
              <p className="truncate text-[11px] font-black tracking-tight text-slate-900">{locationLabel}</p>
            </div>
          </motion.button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/taxi/wallet')}
            className="relative p-2.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shadow-sm active:scale-95"
            title="My Wallet"
          >
            <Wallet size={20} />
          </button>
          
          <button
            onClick={() => navigate('/taxi/notifications')}
            className="relative p-2.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors shadow-sm active:scale-95"
            title="Notifications"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05, ease: 'easeOut' }}
        className="mt-3 space-y-2.5"
      >
        <motion.button
          type="button"
          whileTap={{ scale: 0.99 }}
          onClick={() => navigate('/ride/select-location')}
          className="flex w-full items-center gap-2 rounded-[18px] border border-white/80 bg-white/92 px-3.5 py-3 text-left shadow-[0_12px_26px_rgba(15,23,42,0.06)]"
        >
          <Search size={16} className="text-slate-500" strokeWidth={2.5} />
          <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-slate-500">
            Search destination
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">Go</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default HeaderGreeting;
