import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Backpack,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Compass,
  FileText,
  MapPin,
  Mountain,
  Package,
  Phone,
  Route,
  ShieldCheck,
  Users,
  Utensils,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserTourById } from '../../services/toursService';

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`;

const SectionCard = ({ title, icon: Icon, action = null, children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}>
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
      <div className="flex items-center gap-2">
        {Icon ? <Icon size={15} className="text-emerald-600" /> : null}
        <h2 className="text-[12px] font-black uppercase tracking-[0.14em] text-slate-800">{title}</h2>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const TourDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [allDaysOpen, setAllDaysOpen] = useState(false);
  const [openDay, setOpenDay] = useState(0);

  const isTrek = tour?.category === 'trek';

  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        setTour(await getUserTourById(id));
      } catch {
        toast.error('Failed to load tour details');
        navigate('/taxi/user/tours');
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [id, navigate]);

  // "Dehradun(IN) → Kedarnath(IN) → Dehradun(IN)"
  const routeLine = useMemo(() => {
    if (!tour) return '';
    return [tour.startPoint, ...(tour.destinations || []), tour.endPoint]
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .filter((part, index, all) => index === 0 || part !== all[index - 1])
      .join('  →  ');
  }, [tour]);

  const specs = useMemo(() => {
    if (!tour) return [];
    return [
      { label: 'Duration', value: tour.duration, icon: Calendar },
      isTrek
        ? { label: 'Difficulty', value: tour.difficulty, icon: Mountain }
        : { label: 'Fleet Type', value: tour.helicopterType, icon: Compass },
      { label: 'Meals Plan', value: tour.meals, icon: Utensils },
      isTrek
        ? { label: 'Max Altitude', value: tour.maxAltitudeM > 0 ? `${Number(tour.maxAltitudeM).toLocaleString('en-IN')} m` : '', icon: Route }
        : { label: 'Package Type', value: tour.packageType, icon: Package },
    ].filter((spec) => spec.value);
  }, [tour, isTrek]);

  if (loading || !tour) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="space-y-2 text-center">
          <Compass size={40} className="mx-auto animate-spin text-emerald-500" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Loading details...</p>
        </div>
      </div>
    );
  }

  const visibleDays = allDaysOpen ? tour.itinerary : tour.itinerary.slice(0, 3);
  const gearBlocks = [
    { title: 'Gear Provided', items: tour.gearProvided, dot: 'bg-emerald-500', icon: CheckCircle2 },
    { title: 'Gear To Carry', items: tour.gearToCarry, dot: 'bg-slate-400', icon: Backpack },
    { title: 'Permits Required', items: tour.permitsRequired, dot: 'bg-sky-500', icon: ShieldCheck },
  ].filter((block) => (block.items || []).length > 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 font-sans lg:pb-12">
      {/* Hero */}
      <div className="relative h-[300px] w-full overflow-hidden bg-slate-800 sm:h-[360px] lg:h-[400px]">
        {tour.image ? (
          <img src={tour.image} alt={tour.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <Compass size={64} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-slate-950/45" />

        <button
          onClick={() => navigate(-1)}
          aria-label="Back"
          className="absolute left-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25 active:scale-95 lg:left-8"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-7xl px-5 pb-8 lg:px-8 lg:pb-10">
            <span className="inline-block rounded-md bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow">
              {isTrek ? 'Trek Package' : 'Pilgrim Package'}
            </span>
            <h1 className="mt-3 text-[1.6rem] font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-[2.15rem]">
              {tour.name}
            </h1>
            {routeLine ? (
              <p className="mt-2 flex items-start gap-2 text-[12px] font-bold text-white/85 sm:text-sm">
                <MapPin size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                <span>{routeLine}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        {/* Spec strip overlapping the hero */}
        {specs.length > 0 ? (
          <div className="relative z-10 -mt-7 grid grid-cols-2 divide-slate-100 rounded-2xl border border-slate-100 bg-white shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] sm:grid-cols-4 sm:divide-x">
            {specs.map((spec) => (
              <div key={spec.label} className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <spec.icon size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{spec.label}</p>
                  <p className="mt-0.5 truncate text-[13px] font-black capitalize text-slate-900">{spec.value}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {/* Overview + Itinerary */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
          <SectionCard title="Tour Overview" icon={FileText}>
            <p className={`whitespace-pre-line text-[12.5px] font-medium leading-relaxed text-slate-600 ${overviewOpen ? '' : 'line-clamp-[10]'}`}>
              {tour.overview}
            </p>
            {String(tour.overview || '').length > 420 ? (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => setOverviewOpen((open) => !open)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-4 py-1.5 text-[11px] font-black text-slate-600 transition hover:bg-slate-50"
                >
                  {overviewOpen ? 'View Less' : 'View More'}
                  <ChevronDown size={13} className={`transition-transform ${overviewOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
            ) : null}
          </SectionCard>

          <SectionCard
            title="Itinerary"
            icon={Route}
            action={tour.itinerary.length > 3 ? (
              <button
                onClick={() => setAllDaysOpen((open) => !open)}
                className="rounded-full border border-slate-200 px-3.5 py-1.5 text-[10px] font-black text-slate-600 transition hover:bg-slate-50"
              >
                {allDaysOpen ? 'Collapse' : 'View Full Itinerary'}
              </button>
            ) : null}
          >
            {tour.itinerary.length === 0 ? (
              <p className="py-6 text-center text-xs font-bold italic text-slate-400">No itinerary published yet.</p>
            ) : (
              <div className="relative space-y-1">
                {visibleDays.map((day, idx) => {
                  const open = openDay === idx;
                  return (
                    <div key={idx} className="relative flex gap-4 pb-4 last:pb-0">
                      {/* Timeline rail */}
                      <div className="relative flex shrink-0 flex-col items-center">
                        <span className="flex h-10 w-10 flex-col items-center justify-center rounded-full bg-emerald-600 text-white">
                          <span className="text-[7px] font-black uppercase leading-none tracking-wider">Day</span>
                          <span className="text-[12px] font-black leading-none">{String(idx + 1).padStart(2, '0')}</span>
                        </span>
                        {idx < visibleDays.length - 1 ? (
                          <span className="mt-1 w-px flex-1 bg-emerald-100" />
                        ) : null}
                      </div>

                      <button
                        onClick={() => setOpenDay(open ? -1 : idx)}
                        className="min-w-0 flex-1 pt-1 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-[13px] font-black leading-snug text-slate-900">
                            {day.title || day.day}
                          </h3>
                          <ChevronDown size={16} className={`mt-0.5 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                        </div>
                        <AnimatePresence initial={false}>
                          {open && day.description ? (
                            <motion.p
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden text-[12px] font-medium leading-relaxed text-slate-500"
                            >
                              <span className="mt-1.5 block">{day.description}</span>
                            </motion.p>
                          ) : null}
                        </AnimatePresence>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Trek-only detail */}
        {isTrek ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
            {tour.fitnessNote ? (
              <SectionCard title="Fitness Requirement" icon={AlertTriangle}>
                <p className="text-[12.5px] font-medium leading-relaxed text-slate-600">{tour.fitnessNote}</p>
                {tour.bestMonths.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {tour.bestMonths.map((month) => (
                      <span key={month} className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                        {month}
                      </span>
                    ))}
                  </div>
                ) : null}
              </SectionCard>
            ) : null}

            {tour.guide?.name ? (
              <SectionCard title="Your Trek Guide" icon={Users}>
                <div className="flex items-start gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-emerald-600">
                    {tour.guide.photo
                      ? <img src={tour.guide.photo} alt={tour.guide.name} className="h-full w-full object-cover" />
                      : <Users size={20} />}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-black text-slate-900">{tour.guide.name}</h3>
                    {tour.guide.experienceYears > 0 ? (
                      <p className="text-[11px] font-bold text-slate-500">{tour.guide.experienceYears} years leading treks</p>
                    ) : null}
                  </div>
                </div>
                {tour.guide.bio ? (
                  <p className="mt-3 text-[12px] font-medium leading-relaxed text-slate-600">{tour.guide.bio}</p>
                ) : null}
                {tour.guide.certifications.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tour.guide.certifications.map((cert) => (
                      <span key={cert} className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-600">
                        <Award size={10} className="text-emerald-600" /> {cert}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  {tour.guide.languages.length > 0 ? (
                    <p className="text-[11px] font-bold text-slate-400">Speaks {tour.guide.languages.join(', ')}</p>
                  ) : null}
                  {tour.guide.phone ? (
                    <a href={`tel:${tour.guide.phone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white active:scale-95">
                      <Phone size={11} /> Call Guide
                    </a>
                  ) : null}
                </div>
              </SectionCard>
            ) : null}

            {gearBlocks.map((block) => (
              <SectionCard key={block.title} title={block.title} icon={block.icon}>
                <ul className="space-y-2">
                  {block.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-[12.5px] font-semibold text-slate-600">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${block.dot}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ))}
          </div>
        ) : null}

        {/* Hotels */}
        {!isTrek && tour.hotels.length > 0 ? (
          <div className="mt-6">
            <SectionCard title="Hotels" icon={Building2}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tour.hotels.map((hotel, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">{hotel.destination}</p>
                    <p className="mt-1 text-[13px] font-black text-slate-900">{hotel.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <Utensils size={11} /> {hotel.mealPlan}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        ) : null}

        {/* Inclusions / Exclusions + booking */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div className="space-y-6">
            {tour.inclusions.length > 0 ? (
              <SectionCard title="Inclusions" icon={CheckCircle2}>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {tour.inclusions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-[12.5px] font-semibold text-slate-600">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            {tour.exclusions.length > 0 ? (
              <SectionCard title="Exclusions" icon={XCircle}>
                <ul className="grid gap-2.5 sm:grid-cols-2">
                  {tour.exclusions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-[12.5px] font-semibold text-slate-600">
                      <XCircle size={14} className="mt-0.5 shrink-0 text-rose-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}
          </div>

          {/* Booking panel: sticky on desktop, fixed bar on mobile */}
          <div className="hidden lg:block lg:sticky lg:top-6">
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Starting Cost</p>
              <p className="mt-1.5 text-[2rem] font-black leading-none tracking-tight text-slate-900">
                {formatPrice(tour.price)}
                <span className="text-[12px] font-bold text-slate-400"> /{tour.priceType === 'per_day' ? 'day' : 'package'}</span>
              </p>

              {tour.availableSlots !== null ? (
                <p className={`mt-3 inline-block rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                  tour.availableSlots === 0 ? 'bg-slate-100 text-slate-500' : 'bg-rose-50 text-rose-600'
                }`}>
                  {tour.availableSlots === 0 ? 'Sold out' : `${tour.availableSlots} spots left`}
                </p>
              ) : null}

              {tour.maxGroupSize > 0 ? (
                <p className="mt-3 flex items-center gap-2 text-[11px] font-bold text-slate-500">
                  <Users size={13} className="text-slate-400" /> Up to {tour.maxGroupSize} people per booking
                </p>
              ) : null}

              <button
                onClick={() => navigate(`/taxi/user/tours/book/${tour.id}`)}
                disabled={tour.availableSlots === 0}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-[12px] font-black uppercase tracking-widest text-white shadow-lg transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isTrek ? 'Book Trek Now' : 'Book Yatra Now'}
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile booking bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-slate-100 bg-white/95 p-4 shadow-2xl backdrop-blur-md lg:hidden">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest leading-none text-slate-400">Starting Cost</p>
          <p className="mt-1 truncate text-lg font-black leading-none tracking-tight text-slate-900">
            {formatPrice(tour.price)}
            <span className="text-[10px] font-bold text-slate-400"> /{tour.priceType === 'per_day' ? 'day' : 'package'}</span>
          </p>
        </div>
        <button
          onClick={() => navigate(`/taxi/user/tours/book/${tour.id}`)}
          disabled={tour.availableSlots === 0}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg transition active:scale-95 disabled:opacity-50"
        >
          {isTrek ? 'Book Trek' : 'Book Yatra'}
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default TourDetails;
