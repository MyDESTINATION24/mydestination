import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Bell, Menu, User } from 'lucide-react';



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


  return (
    <>
      {/* TOP HEADER (Fixed, Yellow, Flat Bottom) */}
      <div className="bg-[#FFCC00] px-5 pt-[calc(env(safe-area-inset-top)+0.6rem)] pb-2.5 md:pt-3 md:pb-3 w-full fixed top-0 left-0 right-0 z-50 rounded-none shadow-sm">
        <div className="flex items-center justify-between gap-3">
          {/* LEFT: Hamburger + Logo */}
          <div className="flex min-w-0 items-center gap-3">
            {/* Hamburger: opens global TaxiSidebar */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openTaxiSidebar'))}
              className="p-1 -ml-1 text-slate-800 hover:opacity-80 transition-opacity"
            >
              <Menu size={24} />
            </button>

            {/* App Name / Logo: desktop only */}
            {appLogo ? (
              <div className="hidden md:flex items-center gap-2">
                <img src={appLogo} alt={appName} className="h-9 object-contain" />
                <span className="text-[17px] font-black tracking-tight text-slate-900">MyDestination</span>
              </div>
            ) : (
              <span className="hidden md:block text-slate-900 font-black text-lg tracking-tight">{appName}</span>
            )}
          </div>

          {/* CENTER: Desktop Nav Links (only on md+) */}
          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate('/home')}
              className="text-slate-800 hover:text-slate-600 font-bold text-sm transition-colors"
            >
              Services
            </button>
            <button
              onClick={() => navigate('/taxi/ride/select-location')}
              className="text-slate-800 hover:text-slate-600 font-bold text-sm transition-colors"
            >
              Ride
            </button>
            <button
              onClick={() => navigate('/taxi/user/activity')}
              className="text-slate-800 hover:text-slate-600 font-bold text-sm transition-colors"
            >
              My Rides
            </button>
            <button
              onClick={() => navigate('/taxi/user/bus')}
              className="text-slate-800 hover:text-slate-600 font-bold text-sm transition-colors"
            >
              Bus
            </button>
            <button
              onClick={() => navigate('/taxi/user/support')}
              className="text-slate-800 hover:text-slate-600 font-bold text-sm transition-colors"
            >
              Support
            </button>
          </nav>

          {/* RIGHT: Action icons */}
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

            {/* Profile button: desktop only */}
            <button
              onClick={() => navigate('/taxi/user/profile')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/40 border border-white/30 text-slate-900 hover:bg-white/60 transition-colors shadow-sm active:scale-95"
              title="My Profile"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
              <span className="text-xs font-black tracking-tight">
                {JSON.parse(localStorage.getItem('user') || '{}')?.name?.split(' ')[0] || 'Profile'}
              </span>
            </button>
          </div>
        </div>
      </div>

    </>
  );
};

export default HeaderGreeting;
