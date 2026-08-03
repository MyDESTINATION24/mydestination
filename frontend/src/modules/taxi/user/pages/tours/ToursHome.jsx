import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  Compass,
  Grid2X2,
  Heart,
  List,
  MapPin,
  Mountain,
  Layers,
  SlidersHorizontal,
  Tag,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getUserTourBanner, getUserTours } from '../../services/toursService';

const CATEGORIES = [
  {
    id: 'all',
    label: 'All',
    title: 'All Packages',
  },
  {
    id: 'yatra',
    label: 'Yatras',
    title: 'Pilgrim Yatras',
  },
  {
    id: 'trek',
    label: 'Treks',
    title: 'Himalayan Treks',
  },
];

const DURATION_FILTERS = [
  { id: 'any', label: 'Any Duration', match: () => true },
  { id: 'short', label: 'Up to 3 days', match: (t) => t.durationDays > 0 && t.durationDays <= 3 },
  { id: 'mid', label: '4 to 6 days', match: (t) => t.durationDays >= 4 && t.durationDays <= 6 },
  { id: 'long', label: '7 days or more', match: (t) => t.durationDays >= 7 },
];

const PRICE_FILTERS = [
  { id: 'any', label: 'Any Price', match: () => true },
  { id: 'lt10', label: 'Under ₹10,000', match: (t) => t.price < 10000 },
  { id: '10to50', label: '₹10,000 – ₹50,000', match: (t) => t.price >= 10000 && t.price <= 50000 },
  { id: 'gt50', label: 'Above ₹50,000', match: (t) => t.price > 50000 },
];

const SORTS = [
  { id: 'recommended', label: 'Recommended', sort: null },
  { id: 'price-asc', label: 'Price: Low to High', sort: (a, b) => a.price - b.price },
  { id: 'price-desc', label: 'Price: High to Low', sort: (a, b) => b.price - a.price },
  { id: 'duration-asc', label: 'Shortest First', sort: (a, b) => a.durationDays - b.durationDays },
];

const PRICE_SUFFIX = { per_day: '/ day', total: '/ total' };

const formatPrice = (price) => `₹${Number(price || 0).toLocaleString('en-IN')}`;

// "Helicopter" / "Taxi / Cab" / "Group Tour" style pill on the card image.
const getModeLabel = (tour) => {
  if (tour.category === 'trek') return tour.difficulty || 'Trek';
  if (tour.helicopterType) return 'Helicopter';
  const type = String(tour.packageType || '').toLowerCase();
  if (type.includes('group')) return 'Group Tour';
  if (type.includes('taxi') || type.includes('cab')) return 'Taxi / Cab';
  return tour.packageType || 'Package';
};

const Dropdown = ({ icon: Icon, label, value, options, onChange }) => (
  <div className="flex min-w-0 flex-1 items-center gap-3 px-5 py-3">
    <Icon size={16} className="shrink-0 text-slate-400" />
    <div className="min-w-0 flex-1">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none bg-transparent pr-5 text-[13px] font-bold text-slate-900 outline-none cursor-pointer truncate"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
    </div>
  </div>
);

const ToursHome = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tours, setTours] = useState([]);
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);

  const [destination, setDestination] = useState('all');
  const [duration, setDuration] = useState('any');
  const [price, setPrice] = useState('any');
  const [sortBy, setSortBy] = useState('recommended');
  const [view, setView] = useState('grid');

  const category = CATEGORIES.some((item) => item.id === searchParams.get('category'))
    ? searchParams.get('category')
    : 'all';
  const isTrek = category === 'trek';

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [nextTours, nextBanner] = await Promise.all([
          getUserTours(category === 'all' ? '' : category),
          getUserTourBanner(category === 'all' ? 'yatra' : category).catch(() => null),
        ]);
        setTours(Array.isArray(nextTours) ? nextTours : []);
        setBanner((Array.isArray(nextBanner) ? nextBanner[0] : nextBanner) || null);
      } catch {
        toast.error('Failed to load packages');
      } finally {
        setLoading(false);
      }
    };
    load();
    setDestination('all');
    setDuration('any');
    setPrice('any');
    setSortBy('recommended');
  }, [category]);

  const destinationOptions = useMemo(() => {
    const all = new Set();
    tours.forEach((tour) => (tour.destinations || []).forEach((d) => d && all.add(d)));
    return [
      { id: 'all', label: 'All Destinations' },
      ...[...all].sort().map((d) => ({ id: d, label: d })),
    ];
  }, [tours]);

  const visibleTours = useMemo(() => {
    const durationFilter = DURATION_FILTERS.find((f) => f.id === duration) || DURATION_FILTERS[0];
    const priceFilter = PRICE_FILTERS.find((f) => f.id === price) || PRICE_FILTERS[0];
    const sorter = SORTS.find((s) => s.id === sortBy)?.sort;

    const filtered = tours.filter((tour) => {
      if (destination !== 'all' && !(tour.destinations || []).includes(destination)) return false;
      return durationFilter.match(tour) && priceFilter.match(tour);
    });

    return sorter ? [...filtered].sort(sorter) : filtered;
  }, [tours, destination, duration, price, sortBy]);



  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      {/* Hero: the uploaded banner and nothing else. No banner, no hero.
          No header bar -- back is a floating control so the banner starts at
          the top of the page. */}
      <div className="relative">
        <button
          onClick={() => navigate('/taxi/user')}
          aria-label="Back"
          className="absolute left-5 top-5 z-30 flex h-10 items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/90 px-4 text-[13px] font-bold text-slate-800 shadow-md backdrop-blur-md transition hover:bg-white active:scale-95 lg:left-8"
        >
          <ChevronLeft size={17} />
          Back
        </button>

        {banner?.imageUrl ? (
          <div className="w-full overflow-hidden bg-slate-100">
            <img
              src={banner.imageUrl}
              alt=""
              className="h-[200px] w-full object-cover sm:h-[280px] lg:h-[320px]"
            />
          </div>
        ) : null}

        {/* Filter bar overlapping the hero */}
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className={`relative z-10 flex flex-col divide-y ${banner?.imageUrl ? '-mt-8' : 'mt-20'}  divide-slate-100 rounded-2xl border border-slate-100 bg-white shadow-[0_16px_40px_-12px_rgba(15,23,42,0.15)] lg:flex-row lg:divide-x lg:divide-y-0`}>
            <Dropdown
              icon={Layers}
              label="Package Type"
              value={category}
              options={CATEGORIES.map((item) => ({ id: item.id, label: item.title }))}
              onChange={(next) => setSearchParams(next === 'all' ? {} : { category: next }, { replace: true })}
            />
            <Dropdown
              icon={MapPin}
              label="Destination"
              value={destination}
              options={destinationOptions}
              onChange={setDestination}
            />
            <Dropdown icon={Calendar} label="Duration" value={duration} options={DURATION_FILTERS} onChange={setDuration} />
            <Dropdown icon={Tag} label="Price Range" value={price} options={PRICE_FILTERS} onChange={setPrice} />
            <Dropdown icon={SlidersHorizontal} label="Sort By" value={sortBy} options={SORTS} onChange={setSortBy} />
            <div className="flex shrink-0 items-center px-5 py-3">
              <span className="text-[12px] font-bold text-slate-500">
                Showing {visibleTours.length} Package{visibleTours.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Packages */}
      <div id="tour-packages" className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Available Packages</h2>
            <p className="mt-0.5 text-[12px] font-medium text-slate-500">
              {isTrek
                ? 'Choose from our guided Himalayan treks'
                : category === 'all'
                  ? 'Every pilgrimage and trek we run, in one place'
                  : 'Choose from our carefully curated pilgrimage experiences'}
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-1 rounded-xl border border-slate-100 bg-white p-1 shadow-sm sm:flex">
            {[{ id: 'grid', icon: Grid2X2, label: 'Grid' }, { id: 'list', icon: List, label: 'List' }].map((option) => (
              <button
                key={option.id}
                onClick={() => setView(option.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-bold transition ${
                  view === option.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <option.icon size={14} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[420px] animate-pulse rounded-2xl border border-slate-100 bg-white" />
            ))}
          </div>
        ) : visibleTours.length === 0 ? (
          <div className="rounded-2xl border border-slate-100 bg-white py-20 text-center">
            {isTrek ? <Mountain size={40} className="mx-auto text-slate-200" /> : <Compass size={40} className="mx-auto text-slate-200" />}
            <p className="mt-3 font-bold text-slate-600">No packages match these filters.</p>
            <p className="mt-1 text-xs text-slate-400">Try widening the duration or price range.</p>
          </div>
        ) : (
          <div className={view === 'grid'
            ? 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'flex flex-col gap-4'}
          >
            {visibleTours.map((tour) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/taxi/user/tours/${tour.id}`)}
                className={`group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:shadow-lg ${
                  view === 'list' ? 'sm:flex' : ''
                }`}
              >
                {/* Image */}
                <div className={`relative overflow-hidden bg-slate-100 ${view === 'list' ? 'h-44 sm:h-auto sm:w-64 sm:shrink-0' : 'h-44'}`}>
                  {tour.image ? (
                    <img src={tour.image} alt={tour.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                      <Compass size={32} />
                    </div>
                  )}

                  <span className="absolute left-3 top-3 rounded-md bg-emerald-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow">
                    {getModeLabel(tour)}
                  </span>

                  {tour.availableSlots !== null && tour.availableSlots <= 10 ? (
                    <span className={`absolute left-3 bottom-3 rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow ${
                      tour.availableSlots === 0 ? 'bg-slate-900' : 'bg-rose-500'
                    }`}>
                      {tour.availableSlots === 0 ? 'Sold out' : `${tour.availableSlots} spots left`}
                    </span>
                  ) : null}

                  <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow">
                    <Heart size={15} />
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-[15px] font-black leading-snug text-slate-900 transition group-hover:text-emerald-700">
                    {tour.name}
                  </h3>

                  <div className="mt-3 space-y-2 text-[12px] font-semibold text-slate-500">
                    {(tour.destinations || []).length > 0 ? (
                      <p className="flex items-start gap-2">
                        <MapPin size={13} className="mt-0.5 shrink-0 text-slate-400" />
                        <span className="line-clamp-2">{tour.destinations.join(', ')}</span>
                      </p>
                    ) : null}

                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0 space-y-2">
                        <p className="flex items-center gap-2">
                          <Calendar size={13} className="shrink-0 text-slate-400" />
                          <span className="truncate">{tour.duration}</span>
                        </p>
                        {tour.maxGroupSize > 0 ? (
                          <p className="flex items-center gap-2">
                            <Users size={13} className="shrink-0 text-slate-400" />
                            <span>Max {tour.maxGroupSize} People</span>
                          </p>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">From</p>
                        <p className="text-[17px] font-black leading-tight text-emerald-700">{formatPrice(tour.price)}</p>
                        <p className="text-[10px] font-bold text-slate-400">{PRICE_SUFFIX[tour.priceType] || '/ total'}</p>
                      </div>
                    </div>
                  </div>

                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 py-2.5 text-[12px] font-black text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                    View Details
                    <ChevronLeft size={14} className="rotate-180" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToursHome;
