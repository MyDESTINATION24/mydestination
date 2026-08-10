import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Clock, Map, User, BusFront, LayoutGrid } from 'lucide-react';
import { useSettings } from '../../../shared/context/SettingsContext';

const BottomNavbar = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { settings } = useSettings();
  const showBusService = String(settings.transportRide?.enable_bus_service || '0') === '1';

  const navItems = [
    { icon: LayoutGrid, label: 'Services', path: '/home' },
    { icon: Home, label: 'Ride', path: '/taxi/user' },
    { icon: Clock, label: 'Rides', path: '/taxi/user/activity' },
    ...(showBusService ? [{ icon: BusFront, label: 'Bus', path: '/taxi/user/bus' }] : []),
    { icon: Map, label: 'Support', path: '/taxi/user/support' },
    { icon: User, label: 'Profile', path: '/taxi/user/profile' },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] print:hidden">
      <div className="flex items-center justify-around pt-1.5 pb-1 px-1">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive =
            path === '/taxi/user'
              ? pathname === path
              : pathname === path || pathname.startsWith(`${path}/`);

          return (
            <button
              key={label}
              type="button"
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-1 min-w-[60px] transition-all duration-300 ${isActive ? "scale-105" : "hover:scale-105"} outline-none tap-highlight-transparent`}
            >
              <div className={`w-12 h-11 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 ${isActive
                  ? "bg-yellow-400/20 text-yellow-600" 
                  : "text-slate-400"
                }`}>
                <Icon className={`w-[22px] h-[22px] ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.12em] mt-0.5 ${isActive ? "text-yellow-600" : "text-slate-400"}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavbar;
