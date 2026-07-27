import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, ChevronLeft, MapPin, Calendar, Clock, Sparkles, Mountain, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserTours } from '../../services/toursService';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { y: 24, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

const CATEGORIES = [
  { id: 'yatra', label: 'Yatras', blurb: 'Book all-inclusive, premium helicopter travel experiences to Char Dham, Kedarnath, and Badrinath.' },
  { id: 'trek', label: 'Treks', blurb: 'Guided Himalayan treks with certified leaders, camping equipment and permits handled end to end.' },
];

const DIFFICULTY_STYLES = {
  easy: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  moderate: 'bg-amber-50 text-amber-600 border-amber-100',
  difficult: 'bg-orange-50 text-orange-600 border-orange-100',
  expedition: 'bg-rose-50 text-rose-600 border-rose-100',
};

const ToursHome = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = CATEGORIES.some((item) => item.id === searchParams.get('category'))
    ? searchParams.get('category')
    : 'yatra';
  const activeCategory = CATEGORIES.find((item) => item.id === category);
  const isTrek = category === 'trek';

  useEffect(() => {
    const fetchTours = async () => {
      try {
        setLoading(true);
        const data = await getUserTours(category);
        setTours(data);
      } catch {
        toast.error('Failed to load packages');
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, [category]);

  const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F1F5F9_50%,#E2E8F0_100%)] pb-12 max-w-lg mx-auto relative overflow-hidden font-sans">
      
      {/* Background Orbs */}
      <div className="absolute top-[-40px] right-[-30px] h-48 w-48 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute top-64 left-[-40px] h-48 w-48 rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />

      {/* Sticky Top Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 pt-14 pb-4 md:py-4 backdrop-blur-md">
        <button
          onClick={() => navigate('/taxi/user')}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition active:scale-90"
        >
          <ChevronLeft size={18} className="text-slate-800" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-1.5">
          {isTrek
            ? <Mountain size={16} className="text-emerald-500" />
            : <Compass size={16} className="text-emerald-500 animate-spin-slow" />}
          {isTrek ? 'Himalayan Treks' : 'Pilgrim Yatras'}
        </h1>
        <div className="w-10 h-10" /> {/* Balancer */}
      </div>

      <div className="px-6 py-6 space-y-6">

        {/* Category Switcher */}
        <div className="flex gap-2 rounded-2xl bg-white/70 p-1.5 border border-slate-100 shadow-sm backdrop-blur-md">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              onClick={() => setSearchParams(item.id === 'yatra' ? {} : { category: item.id }, { replace: true })}
              className={`flex-1 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                category === item.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-500 hover:bg-slate-50 active:scale-95'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Banner Section */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[32px] bg-slate-900 p-6 text-white shadow-xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.15)_0%,rgba(99,102,241,0.15)_100%)]" />
          <div className="absolute right-[-20px] bottom-[-20px] h-32 w-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-300">
              <Sparkles size={11} /> {isTrek ? 'Guided Himalayan treks' : 'Featured pilgrim packages'}
            </div>
            <h2 className="text-2xl font-black tracking-tight mt-1 leading-tight">
              {isTrek ? 'Treks & Summit Climbs' : 'Yatras & Helicopter Tours'}
            </h2>
            <p className="text-xs font-semibold text-slate-300 leading-normal">
              {activeCategory.blurb}
            </p>
          </div>
        </motion.div>

        {/* Tours Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Available Packages</p>
              <h3 className="text-[17px] font-black text-slate-900 leading-tight">Select your destination</h3>
            </div>
            <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-600 shadow-sm border border-slate-100">
              {loading ? '...' : tours.length} Packages
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-[28px] bg-white border border-slate-100" />
              ))}
            </div>
          ) : tours.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              {isTrek ? <Mountain size={48} className="stroke-1 opacity-20 mb-3" /> : <Compass size={48} className="stroke-1 opacity-20 mb-3" />}
              <p className="font-bold">No active {isTrek ? 'treks' : 'yatra packages'} found.</p>
              <p className="text-xs mt-1">Please configure packages from the admin panel first.</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              {tours.map((item) => (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  onClick={() => navigate(`/taxi/user/tours/${item.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-[28px] border border-white/60 bg-white/70 shadow-md transition hover:shadow-lg backdrop-blur-md relative"
                >
                  {/* Tour Image */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-indigo-50 text-indigo-400">
                        <Compass size={40} className="stroke-1" />
                      </div>
                    )}
                    {/* Glassmorphic Price Badge */}
                    <div className="absolute right-4 top-4 rounded-2xl bg-slate-900/85 px-4 py-2.5 text-white backdrop-blur-md shadow-lg border border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-none">Price</p>
                      <p className="mt-1 text-sm font-black tracking-tight leading-none">
                        {formatPrice(item.price)}
                        <span className="text-[10px] font-bold text-slate-300"> / {item.priceType === 'per_day' ? 'day' : 'total'}</span>
                      </p>
                    </div>

                    {/* Difficulty (treks) or transport badge (yatras) */}
                    {isTrek && item.difficulty ? (
                      <div className={`absolute left-4 top-4 rounded-xl border px-3 py-1.5 text-[9px] font-black uppercase tracking-wider shadow-lg ${DIFFICULTY_STYLES[item.difficulty] || 'bg-white/90 text-slate-600 border-slate-100'}`}>
                        {item.difficulty}
                      </div>
                    ) : item.helicopterType ? (
                      <div className="absolute left-4 top-4 rounded-xl bg-emerald-500/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white shadow-lg">
                        Helicopter Travel
                      </div>
                    ) : null}

                    {/* Remaining spots, only once a cap is set */}
                    {item.availableSlots !== null && item.availableSlots <= 10 && (
                      <div className={`absolute left-4 bottom-4 rounded-xl px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-white shadow-lg ${item.availableSlots === 0 ? 'bg-slate-900/90' : 'bg-rose-500/90'}`}>
                        {item.availableSlots === 0 ? 'Fully booked' : `${item.availableSlots} spot${item.availableSlots === 1 ? '' : 's'} left`}
                      </div>
                    )}
                  </div>

                  {/* Tour Description */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-black text-slate-950 group-hover:text-indigo-600 transition leading-snug">
                        {item.name}
                      </h4>
                    </div>

                    <p className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed">
                      {item.overview}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100/50">
                      <div className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600">
                        <Clock size={11} />
                        <span>{item.duration}</span>
                      </div>
                      <div className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600">
                        <MapPin size={11} className="text-emerald-500" />
                        <span className="truncate max-w-[150px]">
                          {isTrek ? (item.baseCamp || item.startPoint) : item.startPoint}
                        </span>
                      </div>
                      {isTrek && item.maxAltitudeM > 0 && (
                        <div className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600">
                          <Mountain size={11} className="text-indigo-500" />
                          <span>{Number(item.maxAltitudeM).toLocaleString('en-IN')} m</span>
                        </div>
                      )}
                      {isTrek && item.guide?.name && (
                        <div className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-600">
                          <Users size={11} className="text-amber-500" />
                          <span className="truncate max-w-[120px]">{item.guide.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToursHome;
