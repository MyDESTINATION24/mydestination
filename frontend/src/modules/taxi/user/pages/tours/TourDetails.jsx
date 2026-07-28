import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Compass, CheckCircle2, XCircle, MapPin, Building2, Utensils, Calendar, Sparkles, HelpCircle, ArrowRight, Mountain, Users, Backpack, ShieldCheck, Phone, Award, Route, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserTourById } from '../../services/toursService';

const tabVariants = {
  hidden: { opacity: 0, x: 10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } }
};

const TourDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('itinerary'); // trek, itinerary, hotels, inclusions
  const isTrek = tour?.category === 'trek';

  // Treks open on Trek Info; hotels tab is hidden for them since they camp.
  useEffect(() => {
    if (isTrek) setActiveTab('trek');
  }, [isTrek]);

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        const data = await getUserTourById(id);
        setTour(data);
      } catch {
        toast.error('Failed to load tour details');
        navigate('/taxi/user/tours');
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [id, navigate]);

  const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`;

  if (loading || !tour) {
    return (
      <div className="flex h-screen max-w-lg mx-auto items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <Compass size={40} className="animate-spin text-emerald-500 mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 max-w-lg mx-auto relative overflow-hidden font-sans">
      
      {/* Hero Banner Section */}
      <div className="relative h-64 w-full bg-emerald-600">
        {tour.image ? (
          <img src={tour.image} alt={tour.name} className="h-full w-full object-cover opacity-90" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-indigo-950 text-white/25">
            <Compass size={60} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-600 via-slate-900/30 to-transparent" />
        
        {/* Floating Top Nav bar */}
        <div className="absolute top-12 md:top-4 left-4 right-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/taxi/user/tours')}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition active:scale-90"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="rounded-2xl bg-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
            Pilgrim Package
          </div>
        </div>

        {/* Floating Tour Title Info */}
        <div className="absolute bottom-5 left-6 right-6 text-white space-y-1">
          <h1 className="text-xl font-black tracking-tight leading-tight">{tour.name}</h1>
          <p className="text-xs font-semibold text-slate-300 flex items-center gap-1">
            <MapPin size={12} className="text-emerald-400" />
            {tour.startPoint} → {tour.endPoint}
          </p>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        
        {/* Quick Specs Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <Calendar size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Duration</p>
              <p className="text-xs font-black text-slate-900 mt-0.5">{tour.duration}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Compass size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Fleet Type</p>
              <p className="text-xs font-black text-slate-900 mt-0.5 truncate max-w-[120px]">{tour.helicopterType || 'Helicopter'}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
              <Utensils size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Meals Plan</p>
              <p className="text-xs font-black text-slate-900 mt-0.5">{tour.meals || 'All Meals'}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
              <Building2 size={18} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Package Type</p>
              <p className="text-xs font-black text-slate-900 mt-0.5 truncate max-w-[120px]">{tour.packageType || 'All Inclusive'}</p>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Tour Overview</h3>
          <p className="text-xs font-semibold text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100">
            {tour.overview}
          </p>
        </div>

        {/* Tab selection menu */}
        <div className="flex border-b border-slate-200">
          {[
            ...(isTrek ? [{ id: 'trek', label: 'Trek Info' }] : []),
            { id: 'itinerary', label: 'Itinerary' },
            ...(isTrek ? [] : [{ id: 'hotels', label: 'Hotels' }]),
            { id: 'inclusions', label: 'Inclusions' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 pb-3 text-center text-xs font-black uppercase tracking-wider transition relative ${
                activeTab === tab.id ? 'text-slate-950' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-700"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content area */}
        <div className="min-h-[200px]">
          <AnimatePresence mode="wait">
            {activeTab === 'trek' && (
              <motion.div
                key="trek"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="grid gap-5"
              >
                {/* Trek stats */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Difficulty', value: tour.difficulty, icon: <Mountain size={14} className="text-indigo-500" />, capitalize: true },
                    { label: 'Max Altitude', value: tour.maxAltitudeM > 0 ? `${Number(tour.maxAltitudeM).toLocaleString('en-IN')} m` : '', icon: <Mountain size={14} className="text-emerald-500" /> },
                    { label: 'Trail Distance', value: tour.trailDistanceKm > 0 ? `${tour.trailDistanceKm} km` : '', icon: <Route size={14} className="text-amber-500" /> },
                    { label: 'Base Camp', value: tour.baseCamp, icon: <MapPin size={14} className="text-rose-500" /> },
                  ].filter((stat) => stat.value).map((stat) => (
                    <div key={stat.label} className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        {stat.icon} {stat.label}
                      </p>
                      <p className={`mt-1.5 text-sm font-black text-slate-900 ${stat.capitalize ? 'capitalize' : ''}`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Group size + spots */}
                {(tour.maxGroupSize > 0 || tour.availableSlots !== null) && (
                  <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Users size={14} className="text-slate-400" /> Group
                      </p>
                      <p className="mt-1.5 text-xs font-bold text-slate-600">
                        {tour.minGroupSize > 0 ? `Runs with ${tour.minGroupSize}+ trekkers. ` : ''}
                        {tour.maxGroupSize > 0 ? `Up to ${tour.maxGroupSize} per booking.` : ''}
                      </p>
                    </div>
                    {tour.availableSlots !== null && (
                      <div className={`shrink-0 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider ${tour.availableSlots === 0 ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {tour.availableSlots === 0 ? 'Full' : `${tour.availableSlots} left`}
                      </div>
                    )}
                  </div>
                )}

                {/* Best months */}
                {tour.bestMonths.length > 0 && (
                  <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Calendar size={14} className="text-indigo-500" /> Best Season
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tour.bestMonths.map((month) => (
                        <span key={month} className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[10px] font-black text-indigo-600 border border-indigo-100">
                          {month}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fitness */}
                {tour.fitnessNote && (
                  <div className="rounded-2xl bg-amber-50 p-5 border border-amber-100 space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
                      <AlertTriangle size={14} /> Fitness Requirement
                    </h4>
                    <p className="text-xs font-semibold text-amber-800 leading-relaxed">{tour.fitnessNote}</p>
                  </div>
                )}

                {/* Gear */}
                {[
                  { title: 'Gear Provided', items: tour.gearProvided, icon: <CheckCircle2 size={14} className="text-emerald-500" />, dot: 'bg-emerald-500' },
                  { title: 'Gear To Carry', items: tour.gearToCarry, icon: <Backpack size={14} className="text-slate-600" />, dot: 'bg-slate-400' },
                  { title: 'Permits Required', items: tour.permitsRequired, icon: <ShieldCheck size={14} className="text-sky-500" />, dot: 'bg-sky-500' },
                ].filter((block) => block.items.length > 0).map((block) => (
                  <div key={block.title} className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      {block.icon} {block.title}
                    </h4>
                    <ul className="space-y-2">
                      {block.items.map((item, idx) => (
                        <li key={idx} className="text-xs font-semibold text-slate-600 flex items-start gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full ${block.dot} mt-1.5 shrink-0`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Guide */}
                {tour.guide?.name && (
                  <div className="rounded-2xl bg-emerald-600 p-5 text-white shadow-lg space-y-4 relative overflow-hidden">
                    <div className="absolute right-[-30px] top-[-30px] h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex items-start gap-3">
                      <div className="h-12 w-12 shrink-0 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden">
                        {tour.guide.photo
                          ? <img src={tour.guide.photo} alt={tour.guide.name} className="h-full w-full object-cover" />
                          : <Users size={20} className="text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/80">Your Trek Guide</p>
                        <h4 className="text-base font-black leading-tight mt-0.5">{tour.guide.name}</h4>
                        {tour.guide.experienceYears > 0 && (
                          <p className="text-[11px] font-bold text-slate-300 mt-0.5">{tour.guide.experienceYears} years leading treks</p>
                        )}
                      </div>
                    </div>

                    {tour.guide.bio && (
                      <p className="relative z-10 text-xs font-medium text-slate-300 leading-relaxed">{tour.guide.bio}</p>
                    )}

                    {tour.guide.certifications.length > 0 && (
                      <div className="relative z-10 flex flex-wrap gap-2">
                        {tour.guide.certifications.map((cert) => (
                          <span key={cert} className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-[10px] font-black text-white border border-white/10">
                            <Award size={10} className="text-white/80" /> {cert}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="relative z-10 flex flex-wrap items-center gap-3 pt-1">
                      {tour.guide.languages.length > 0 && (
                        <p className="text-[10px] font-bold text-slate-400">Speaks {tour.guide.languages.join(', ')}</p>
                      )}
                      {tour.guide.phone && (
                        <a href={`tel:${tour.guide.phone}`} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white active:scale-95 transition">
                          <Phone size={11} /> Call Guide
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'itinerary' && (
              <motion.div
                key="itinerary"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="space-y-5 relative pl-4 border-l-2 border-slate-200"
              >
                {tour.itinerary.map((day, idx) => (
                  <div key={idx} className="relative space-y-1">
                    {/* Timeline Node dot */}
                    <div className="absolute left-[-23px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-700 ring-4 ring-slate-100">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="inline-flex rounded-lg bg-emerald-600 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-400">
                      {day.day}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 pt-0.5">{day.title}</h4>
                    <p className="text-xs font-semibold text-slate-500 leading-relaxed pr-2">
                      {day.description}
                    </p>
                  </div>
                ))}
                {tour.itinerary.length === 0 && (
                  <p className="text-xs font-bold italic text-slate-400 py-4 pl-2">No itinerary day list available.</p>
                )}
              </motion.div>
            )}

            {activeTab === 'hotels' && (
              <motion.div
                key="hotels"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="space-y-3"
              >
                {tour.hotels.map((hotel, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{hotel.destination}</p>
                      <h4 className="text-sm font-black text-slate-900">{hotel.name}</h4>
                    </div>
                    <span className="rounded-xl bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-orange-700 font-bold shrink-0">
                      {hotel.mealPlan}
                    </span>
                  </div>
                ))}
                {tour.hotels.length === 0 && (
                  <p className="text-xs font-bold italic text-slate-400 py-4 text-center">No hotel arrangements listed.</p>
                )}
              </motion.div>
            )}

            {activeTab === 'inclusions' && (
              <motion.div
                key="inclusions"
                variants={tabVariants}
                initial="hidden"
                animate="show"
                exit="exit"
                className="grid gap-5"
              >
                {/* Inclusions */}
                <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Package Inclusions
                  </h4>
                  <ul className="space-y-2">
                    {tour.inclusions.map((inc, idx) => (
                      <li key={idx} className="text-xs font-semibold text-slate-600 flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{inc}</span>
                      </li>
                    ))}
                    {tour.inclusions.length === 0 && (
                      <p className="text-xs font-bold italic text-slate-400">No inclusions listed.</p>
                    )}
                  </ul>
                </div>

                {/* Exclusions */}
                <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                    <XCircle size={14} className="text-rose-500" />
                    Package Exclusions
                  </h4>
                  <ul className="space-y-2">
                    {tour.exclusions.map((exc, idx) => (
                      <li key={idx} className="text-xs font-semibold text-slate-600 flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                        <span>{exc}</span>
                      </li>
                    ))}
                    {tour.exclusions.length === 0 && (
                      <p className="text-xs font-bold italic text-slate-400">No exclusions listed.</p>
                    )}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Fixed Sticky Bottom Booking Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white/90 border-t border-slate-100 p-5 backdrop-blur-md max-w-lg mx-auto flex items-center justify-between shadow-2xl">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Starting Cost</p>
          <p className="mt-1 text-xl font-black text-slate-900 tracking-tight leading-none">
            {formatPrice(tour.price)}
            <span className="text-[10px] font-bold text-slate-400"> / {tour.priceType === 'per_day' ? 'day' : 'package'}</span>
          </p>
        </div>
        <button
          onClick={() => navigate(`/taxi/user/tours/book/${tour.id}`)}
          className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-6 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-950/20 hover:bg-emerald-500 transition active:scale-95"
        >
          Book Yatra Now
          <ArrowRight size={14} />
        </button>
      </div>

    </div>
  );
};

export default TourDetails;
