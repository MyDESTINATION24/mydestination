import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Compass,
  MapPin,
  PlaneTakeoff,
  Search,
  ShieldCheck,
  Ticket,
  Users,
  ChevronRight,
  Info,
  Star,
  Sparkles,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/userService';
import BottomNavbar from '../../components/BottomNavbar';

// Asset Imports (Using the generated image for consistency)
import premiumHeliHero from '@/assets/airways/premium_heli_hero.png';
import kedarnathImg from '@/assets/airways/kedarnath.png';

const CheckCircleIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const tomorrowDateValue = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().slice(0, 10);
};

// Round: fares are base + a percentage tax, so they land on fractions of a
// rupee and toLocaleString would render "Rs. 8,499.75" on the price cards.
const formatCurrency = (value) => `Rs. ${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

const formatTravelDate = (value) => {
  if (!value) return 'Pick a travel date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Pick a travel date';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTimeLabel = (value = '') => {
  const normalized = String(value || '').trim();
  if (!normalized) return '--';
  const parsed = new Date(`2000-01-01T${normalized}`);
  if (Number.isNaN(parsed.getTime())) return normalized;
  return parsed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const AirwaysHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [searchForm, setSearchForm] = useState({ origin: '', destination: '', travelDate: tomorrowDateValue() });
  const [appliedFilters, setAppliedFilters] = useState({ origin: '', destination: '', travelDate: '' });
  const [view, setView] = useState('home'); // 'home' or 'results'
  const [activeInput, setActiveInput] = useState(null);

  const loadRoutes = async (filters = {}) => {
    try {
      setLoading(true);
      const nextRoutes = await userService.getAirwayRoutes(filters);
      setRoutes(nextRoutes);
      if (filters.origin || filters.destination) setView('results');
    } catch (error) {
      console.error(error);
      toast.error('Could not load helicopter routes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes(appliedFilters);
  }, [appliedFilters.origin, appliedFilters.destination, appliedFilters.travelDate]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const nextRoutes = await userService.getAirwayRoutes({ travelDate: '' });
        setAllRoutes(nextRoutes);
      } catch (error) { console.error(error); }
    };
    loadAll();
  }, []);

  // Admin-controlled: any route flagged "Popular Sector" in the airway route
  // manager. Was a hardcoded array, so the prices shown here could not be
  // changed from the admin panel.
  const featuredSectors = useMemo(
    () =>
      allRoutes
        .filter((route) => route.isFeatured)
        .map((route) => ({
          id: route.id,
          name: route.routeName,
          origin: route.originAirport,
          destination: route.destinationAirport,
          image: route.image || kedarnathImg,
          price: route.totalFare,
        })),
    [allRoutes],
  );

  const originSuggestions = useMemo(() => {
    const query = searchForm.origin.trim().toLowerCase();
    const values = [...new Set(allRoutes.map((r) => String(r.originAirport || '').trim()).filter(Boolean))];
    return query ? values.filter((v) => v.toLowerCase().includes(query)).slice(0, 5) : values.slice(0, 5);
  }, [allRoutes, searchForm.origin]);

  const destinationSuggestions = useMemo(() => {
    const query = searchForm.destination.trim().toLowerCase();
    const values = [...new Set(allRoutes.map((r) => String(r.destinationAirport || '').trim()).filter(Boolean))];
    return query ? values.filter((v) => v.toLowerCase().includes(query)).slice(0, 5) : values.slice(0, 5);
  }, [allRoutes, searchForm.destination]);

  const flattenedFlights = useMemo(() => {
    const list = [];
    routes.forEach((route) => {
      const airways = Array.isArray(route?.airways) ? route.airways : (route?.airway ? [route.airway] : []);
      airways.forEach((airway) => {
        list.push({ ...route, selectedAirway: airway, totalPrice: Number(airway.basePrice || 0) * (1 + Number(airway.serviceTaxPercent || 0) / 100) });
      });
    });
    return list;
  }, [routes]);

  const SuggestionsDropdown = ({ items, onSelect, visible }) => {
    if (!visible || items.length === 0) return null;
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] rounded-3xl border border-slate-100 bg-white/95 shadow-2xl backdrop-blur-xl overflow-hidden">
        <div className="max-h-60 overflow-y-auto no-scrollbar py-2">
          {items.map((item) => (
            <button key={item} type="button" onMouseDown={() => onSelect(item)} className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
              <MapPin size={14} className="text-slate-400" />
              <span className="text-sm font-black text-slate-950">{item}</span>
            </button>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 overflow-x-hidden overflow-y-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Immersive Header */}
      <div className="relative h-[40vh] w-full overflow-hidden">
        <img src={premiumHeliHero} alt="Helicopter" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#F8FAFC]" />
        
        <div className="absolute top-12 md:top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center gap-3 z-50">
           <div className="h-11 sm:h-12 min-w-0 px-3.5 sm:px-5 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center gap-2 sm:gap-3">
              <Sparkles size={16} className="text-sky-300" />
              <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider sm:tracking-widest truncate">My Destination Airways</span>
           </div>
           <button onClick={() => navigate('/taxi/user')} className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white">
              <ArrowLeft size={20} />
           </button>
        </div>

        <div className="absolute bottom-16 left-5 right-5 sm:left-6 sm:right-6">
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <p className="text-sky-300 text-[10px] font-black uppercase tracking-[0.3em]">Luxury Sky Transfers</p>
              <h2 className="text-white text-3xl sm:text-4xl font-['Outfit'] font-black mt-2 leading-tight drop-shadow-2xl">Elite Travels</h2>
           </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-lg lg:max-w-6xl px-5 lg:px-8">
        {/* Floating Search Panel */}
        <div className="-mt-10 relative z-10">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-[32px] sm:rounded-[40px] bg-white p-5 sm:p-8 lg:p-6 shadow-[0_32px_64px_-12px_rgba(15,23,42,0.12)] border border-slate-100">
              {/* lg: one horizontal booking bar -- fields beside each other, button at the end */}
              <div className="space-y-4 sm:space-y-5 lg:grid lg:grid-cols-[1.5fr_1fr_auto] lg:items-end lg:gap-4 lg:space-y-0">
                 <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 relative">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">From</label>
                       <div className="relative">
                          <MapPin size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-sky-500" />
                          <input value={searchForm.origin} onChange={(e) => setSearchForm({...searchForm, origin: e.target.value.toUpperCase()})} onFocus={() => setActiveInput('origin')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} placeholder="Origin" className="w-full bg-slate-50 rounded-2xl pl-9 sm:pl-12 pr-3 sm:pr-4 py-3.5 sm:py-4 text-sm font-black outline-none focus:ring-2 focus:ring-sky-100 transition-all" />
                       </div>
                       <SuggestionsDropdown items={originSuggestions} visible={activeInput === 'origin'} onSelect={(v) => setSearchForm({...searchForm, origin: v})} />
                    </div>
                    <div className="space-y-1.5 relative">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">To</label>
                       <div className="relative">
                          <MapPin size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-orange-500" />
                          <input value={searchForm.destination} onChange={(e) => setSearchForm({...searchForm, destination: e.target.value.toUpperCase()})} onFocus={() => setActiveInput('destination')} onBlur={() => setTimeout(() => setActiveInput(null), 200)} placeholder="Dest" className="w-full bg-slate-50 rounded-2xl pl-9 sm:pl-12 pr-3 sm:pr-4 py-3.5 sm:py-4 text-sm font-black outline-none focus:ring-2 focus:ring-orange-100 transition-all" />
                       </div>
                       <SuggestionsDropdown items={destinationSuggestions} visible={activeInput === 'destination'} onSelect={(v) => setSearchForm({...searchForm, destination: v})} />
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departure</label>
                    <div className="relative">
                       <CalendarDays size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input type="date" value={searchForm.travelDate} onChange={(e) => setSearchForm({...searchForm, travelDate: e.target.value})} className="w-full bg-slate-50 rounded-2xl pl-9 sm:pl-12 pr-3 sm:pr-4 py-3.5 sm:py-4 text-sm font-black outline-none focus:ring-2 focus:ring-slate-100 transition-all" />
                    </div>
                 </div>
                 <button onClick={() => setAppliedFilters(searchForm)} className="w-full lg:w-auto lg:px-10 h-14 sm:h-16 lg:h-[52px] rounded-3xl lg:rounded-2xl bg-emerald-700 text-white font-black text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                    <Search size={20} />
                    Explore Routes
                 </button>
              </div>
           </motion.div>
        </div>

        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12 space-y-10">
               {featuredSectors.length > 0 && (
               <section>
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight">Popular Sectors</h3>
                     <Zap size={20} className="text-sky-500" />
                  </div>
                  <div className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar pb-4 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:pb-0">
                     {featuredSectors.map((s) => (
                       <button key={s.id} onClick={() => { setSearchForm({ origin: s.origin, destination: s.destination, travelDate: tomorrowDateValue() }); setAppliedFilters({ origin: s.origin, destination: s.destination, travelDate: tomorrowDateValue() }); }} className="w-[240px] sm:w-[280px] lg:w-auto shrink-0 h-[330px] sm:h-[400px] relative rounded-[32px] sm:rounded-[40px] overflow-hidden group">
                          <img src={s.image} alt={s.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                          <div className="absolute bottom-5 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8 text-left">
                             <div className="flex items-center gap-2 text-white/60 text-[9px] font-black uppercase tracking-[0.15em] mb-2">
                                <span className="truncate">{s.origin}</span>
                                <div className="h-px w-3 shrink-0 bg-white/20" />
                                <span className="truncate">{s.destination}</span>
                             </div>
                             <h4 className="text-white text-lg sm:text-2xl font-['Outfit'] font-black leading-tight break-words">{s.name}</h4>
                             <p className="text-sky-300 text-base sm:text-lg font-black mt-3 sm:mt-4">{formatCurrency(s.price)}</p>
                          </div>
                       </button>
                     ))}
                  </div>
               </section>
               )}

               <section className="grid grid-cols-2 gap-4">
                  <div className="p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-white border border-slate-100 shadow-sm">
                     <ShieldCheck size={24} className="text-sky-500 mb-4" />
                     <h4 className="text-[13px] sm:text-sm font-black text-slate-950 uppercase tracking-wider sm:tracking-widest">Safe Skies</h4>
                     <p className="text-[10px] font-bold text-slate-400 mt-2 leading-relaxed">Certified air fleet with top safety ratings.</p>
                  </div>
                  <div className="p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-white border border-slate-100 shadow-sm">
                     <Clock3 size={24} className="text-orange-500 mb-4" />
                     <h4 className="text-[13px] sm:text-sm font-black text-slate-950 uppercase tracking-wider sm:tracking-widest">Fast Track</h4>
                     <p className="text-[10px] font-bold text-slate-400 mt-2 leading-relaxed">Skip the hills. Reach in minutes, not hours.</p>
                  </div>
               </section>
            </motion.div>
          ) : (
            <motion.div key="results" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="mt-12 space-y-6">
               <div className="flex items-center justify-between px-2">
                  <div>
                     <h3 className="text-xl font-black text-slate-950">{loading ? 'Scanning Sky...' : `${flattenedFlights.length} Flights Found`}</h3>
                     <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{appliedFilters.origin} → {appliedFilters.destination}</p>
                  </div>
                  <button onClick={() => setView('home')} className="h-11 w-11 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                     <ArrowLeft size={18} />
                  </button>
               </div>

               <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                  {loading ? [...Array(3)].map((_, i) => <div key={i} className="h-48 rounded-[40px] bg-white animate-pulse border border-slate-50" />) 
                  : flattenedFlights.length > 0 ? flattenedFlights.map((f, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-[32px] sm:rounded-[40px] bg-white border border-slate-100 p-5 sm:p-8 shadow-sm hover:shadow-xl transition-all">
                       <div className="flex justify-between items-center gap-3 mb-6 sm:mb-8">
                          <div className="flex min-w-0 items-center gap-3">
                             <div className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden">
                                {f.image ? <img src={f.image} className="h-full w-full object-cover" /> : <PlaneTakeoff size={24} className="text-sky-500" />}
                             </div>
                             <div className="min-w-0">
                                <p className="text-[10px] font-black text-sky-600 uppercase tracking-widest truncate">{f.selectedAirway.airlineName}</p>
                                <h4 className="text-sm sm:text-base font-black text-slate-950 mt-1 truncate">#{f.flightNumber}</h4>
                             </div>
                          </div>
                          <div className="shrink-0 text-right">
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                             <p className="text-xl sm:text-2xl font-black text-slate-950 mt-1">{formatCurrency(f.totalPrice)}</p>
                          </div>
                       </div>

                       <div className="flex items-center justify-between gap-2 bg-slate-50 rounded-[24px] sm:rounded-[32px] p-4 sm:p-6 mb-6 sm:mb-8">
                          <div className="min-w-0 flex-1 text-center">
                             <p className="text-base sm:text-lg font-black text-slate-950">{formatTimeLabel(f.departureTime)}</p>
                             <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-wider break-words">{f.originAirport}</p>
                          </div>
                          <div className="flex shrink-0 flex-col items-center gap-1.5 w-16 sm:w-[120px]">
                             <Zap size={14} className="text-sky-500" />
                             <div className="h-px w-full bg-slate-200 relative">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                             </div>
                             <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{f.durationMinutes}m</span>
                          </div>
                          <div className="min-w-0 flex-1 text-center">
                             <p className="text-base sm:text-lg font-black text-slate-950">{formatTimeLabel(f.arrivalTime)}</p>
                             <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-wider break-words">{f.destinationAirport}</p>
                          </div>
                       </div>

                       <button onClick={() => navigate(`/taxi/user/airways/routes/${f.id}`, { state: { travelDate: appliedFilters.travelDate, selectedAirwayId: f.selectedAirway.id } })} className="w-full h-14 sm:h-16 rounded-[24px] sm:rounded-[28px] bg-emerald-700 text-white font-black text-xs sm:text-sm uppercase tracking-widest shadow-lg shadow-slate-950/20 active:scale-95 transition-all">
                          Select Flight
                       </button>
                    </motion.div>
                  )) : <div className="text-center py-20">
                     <Compass size={60} className="text-slate-100 mx-auto mb-6" />
                     <h4 className="text-lg font-black text-slate-950">No Sectors Found</h4>
                     <p className="text-sm font-bold text-slate-400 mt-2 max-w-[200px] mx-auto">Try searching for a different sector or date.</p>
                     <button onClick={() => setView('home')} className="mt-8 text-sky-600 text-xs font-black uppercase tracking-widest underline underline-offset-8">Browse Sectors</button>
                  </div>}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNavbar />
    </div>
  );
};

export default AirwaysHome;
