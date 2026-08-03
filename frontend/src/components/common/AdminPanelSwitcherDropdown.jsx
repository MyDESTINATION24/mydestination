import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Hotel, 
  Heart, 
  Car, 
  LayoutDashboard, 
  ChevronDown, 
  Palette,
  ShieldCheck
} from 'lucide-react';

const PANELS = [
  {
    key: 'hotel',
    label: 'Hotel Admin',
    sublabel: 'Hotel & Property Management',
    icon: Hotel,
    path: '/admin/dashboard',
    color: '#10b981',
    bgColor: 'bg-emerald-50 text-emerald-600',
    borderColor: 'border-emerald-200'
  },
  {
    key: 'wedding',
    label: 'Wedding Admin',
    sublabel: 'Destination Wedding Management',
    icon: Heart,
    path: '/wedding/admin/dashboard',
    color: '#ec4899',
    bgColor: 'bg-pink-50 text-pink-600',
    borderColor: 'border-pink-200'
  },
  {
    key: 'taxi',
    label: 'Rider / Taxi Admin',
    sublabel: 'Taxi & Transport Management',
    icon: Car,
    path: '/taxi/admin',
    color: '#f59e0b',
    bgColor: 'bg-amber-50 text-amber-600',
    borderColor: 'border-amber-200'
  },
  {
    key: 'cms',
    label: 'CMS Admin',
    sublabel: 'Website Content Management',
    icon: LayoutDashboard,
    path: '/cms-admin',
    color: '#6366f1',
    bgColor: 'bg-indigo-50 text-indigo-600',
    borderColor: 'border-indigo-200'
  }
];

const AdminPanelSwitcherDropdown = ({ currentPanelKey = 'cms', isCompact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Detect current active panel based on URL if not passed
  let activePanel = PANELS.find(p => p.key === currentPanelKey) || PANELS[0];
  if (location.pathname.startsWith('/cms-admin')) {
    activePanel = PANELS.find(p => p.key === 'cms');
  } else if (location.pathname.startsWith('/admin')) {
    activePanel = PANELS.find(p => p.key === 'hotel');
  } else if (location.pathname.startsWith('/wedding')) {
    activePanel = PANELS.find(p => p.key === 'wedding');
  } else if (location.pathname.startsWith('/taxi')) {
    activePanel = PANELS.find(p => p.key === 'taxi');
  } else if (location.pathname.startsWith('/partner/ui-customizer')) {
    activePanel = PANELS.find(p => p.key === 'hotel-ui');
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPanel = (panel) => {
    setIsOpen(false);
    navigate(panel.path);
  };

  const ActiveIcon = activePanel.icon;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
        Select Management Panel
      </div>

      {/* Selected Panel Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-400 transition cursor-pointer text-left group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl flex-shrink-0 ${activePanel.bgColor}`}>
            <ActiveIcon size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-sm text-slate-800 truncate leading-tight">
              {activePanel.label}
            </h4>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {activePanel.sublabel}
            </p>
          </div>
        </div>
        <ChevronDown 
          size={18} 
          className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? 'rotate-180 text-slate-700' : ''
          }`} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-[105%] z-50 bg-white rounded-2xl border border-slate-100 shadow-2xl p-2 space-y-1.5 animate-fadeIn max-h-80 overflow-y-auto">
          {PANELS.map((panel) => {
            const Icon = panel.icon;
            const isSelected = panel.key === activePanel.key;

            return (
              <button
                key={panel.key}
                type="button"
                onClick={() => handleSelectPanel(panel)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition cursor-pointer ${
                  isSelected 
                    ? 'bg-slate-50 border border-slate-200/60 font-semibold' 
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl flex-shrink-0 ${panel.bgColor}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-extrabold text-slate-800 truncate">
                    {panel.label}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {panel.sublabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminPanelSwitcherDropdown;
