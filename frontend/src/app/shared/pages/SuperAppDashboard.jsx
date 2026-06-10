import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Building2, Car, Heart, ChevronRight, Compass } from 'lucide-react';

const services = [
  {
    id: 'hotel',
    title: 'Hotels & Stays',
    description: 'Book luxury hotels, resorts, and homestays at the best prices.',
    icon: Building2,
    color: 'from-green-500 to-emerald-600',
    bgLight: 'bg-surface/10',
    cardBg: 'bg-[#39593f]/5',
    textColor: 'text-surface',
    path: '/hotels',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'taxi',
    title: 'Cab Booking',
    description: 'Ride safely with our verified drivers. Outstation & local cabs.',
    icon: Car,
    color: 'from-yellow-400 to-orange-500',
    bgLight: 'bg-yellow-50',
    cardBg: 'bg-yellow-50/50',
    textColor: 'text-yellow-600',
    path: '/taxi',
    image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'wedding',
    title: 'Wedding Planner',
    description: 'Plan your dream destination wedding with top vendors & venues.',
    icon: Heart,
    color: 'from-pink-500 to-rose-500',
    bgLight: 'bg-pink-50',
    cardBg: 'bg-pink-50/50',
    textColor: 'text-pink-600',
    path: '/wedding',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800'
  }
];

const SuperAppDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="fixed inset-0 overflow-y-auto bg-gray-50 px-4 py-8 pb-24 md:p-8 md:flex md:items-center md:justify-center">
      <div className="max-w-4xl mx-auto w-full">
        
        {/* Header Section */}
        <div className="mb-6 md:mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-2"
          >
            <div className="w-12 h-12 rounded-full bg-surface text-white flex items-center justify-center text-xl font-bold shadow-lg">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">
                Hi, {user?.name?.split(' ')[0] || 'User'}! 👋
              </h1>
              <p className="text-gray-500 font-medium">What are you looking for today?</p>
            </div>
          </motion.div>
        </div>

        {/* Explore Title */}
        <div className="flex items-center gap-2 mb-4 md:mb-5 text-gray-800">
          <Compass className="text-surface" size={24} />
          <h2 className="text-xl font-black">Explore Services</h2>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(service.path)}
              className={`group cursor-pointer ${service.cardBg} rounded-[20px] md:rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-row md:flex-col`}
            >
              <div className="h-28 w-28 md:h-36 md:w-full shrink-0 overflow-hidden relative">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10" />
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute top-2 right-2 md:top-4 md:right-4 z-20 ${service.bgLight} ${service.textColor} p-1.5 md:p-3 rounded-lg md:rounded-2xl shadow-md backdrop-blur-md bg-opacity-90`}>
                  <service.icon className="w-4 h-4 md:w-6 md:h-6" />
                </div>
              </div>
              
              <div className="p-4 md:p-5 flex-1 flex flex-col justify-center">
                <h3 className="text-base md:text-lg font-black text-gray-900 mb-1 md:mb-2">{service.title}</h3>
                <p className="text-gray-500 text-xs md:text-sm leading-snug md:leading-relaxed mb-2 md:mb-4 line-clamp-2 md:line-clamp-none">
                  {service.description}
                </p>
                <div className={`flex items-center text-xs md:text-sm font-bold ${service.textColor} group-hover:gap-1.5 transition-all mt-auto`}>
                  Explore <ChevronRight className="ml-0.5 w-3 h-3 md:w-4 md:h-4" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>



      </div>
    </div>
  );
};

export default SuperAppDashboard;
