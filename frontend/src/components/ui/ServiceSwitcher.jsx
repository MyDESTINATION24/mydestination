import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Hotel, Heart, Car, ChevronDown, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const services = [
  { id: 'hotel', name: 'Hotels', icon: Hotel, path: '/hotels', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'wedding', name: 'Weddings', icon: Heart, path: '/wedding', color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'taxi', name: 'Taxi', icon: Car, path: '/taxi', color: 'text-yellow-500', bg: 'bg-yellow-50' },
];

const ServiceSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine active service based on path
  const getActiveService = () => {
    if (location.pathname.startsWith('/wedding')) return services[1];
    if (location.pathname.startsWith('/taxi')) return services[2];
    if (location.pathname === '/' || location.pathname === '/home') {
      return { id: 'superapp', name: 'Services', icon: LayoutGrid, path: '/home', color: 'text-[#39593F]', bg: 'bg-[#39593F]/10' };
    }
    return services[0]; // Default to Hotel
  };

  const activeService = getActiveService();

  // Hide for partners/admin
  const isHidden = ['/admin', '/hotel/dashboard', '/wedding/admin', '/wedding/vendor', '/cms-admin'].some(path => location.pathname.startsWith(path));
  if (isHidden) return null;

  return (
    <div className="relative">
      <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-full bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors ${activeService.color}`}
        >
          <activeService.icon size={18} />
          <span className="font-bold text-sm text-gray-800">{activeService.name}</span>
          <ChevronDown size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full mt-2 w-48 left-0 md:left-1/2 md:-translate-x-1/2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-[100]"
            >
              <div className="p-2 flex flex-col gap-1">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setIsOpen(false);
                      if (activeService.id !== service.id) {
                        navigate(service.path);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors hover:bg-gray-50 ${
                      activeService.id === service.id ? service.bg : ''
                    }`}
                  >
                    <service.icon size={18} className={service.color} />
                    <span className={`text-sm font-semibold ${activeService.id === service.id ? 'text-gray-900' : 'text-gray-600'}`}>
                      {service.name}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default ServiceSwitcher;
