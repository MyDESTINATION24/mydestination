import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  BusFront,
  ArrowRightLeft,
  Loader2,
  Route,
  MapPin,
  Search,
  Ticket,
  X,
} from 'lucide-react';
import { useSettings } from '../../../../shared/context/SettingsContext';
import userBusService from '../../services/busService';
import BottomNavbar from '../../components/BottomNavbar';

const getRoutePrefix = (pathname = '') =>
  pathname.startsWith('/taxi/user')
    ? '/taxi/user'
    : pathname.startsWith('/taxi')
      ? '/taxi'
      : '';

const getDateOffset = (offset = 1) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
};

const getTodayDate = () => getDateOffset(0);

const getTomorrowDate = () => getDateOffset(1);

const getNextWeekendDate = () => {
  const date = new Date();
  const day = date.getDay();

  if (day === 6 || day === 0) {
    return formatDateKey(date);
  }

  const daysUntilSaturday = (6 - day + 7) % 7;
  date.setDate(date.getDate() + daysUntilSaturday);
  return formatDateKey(date);
};

const getMonthStart = (value) => new Date(value.getFullYear(), value.getMonth(), 1);

const addMonths = (value, amount) => new Date(value.getFullYear(), value.getMonth() + amount, 1);

const formatDateKey = (value) => {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildCalendarDays = (monthDate) => {
  const start = getMonthStart(monthDate);
  const startOffset = (start.getDay() + 6) % 7;
  const gridStart = new Date(start);
  gridStart.setDate(start.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const value = new Date(gridStart);
    value.setDate(gridStart.getDate() + index);
    return value;
  });
};

const formatTravelDate = (value) => {
  if (!value) return '';

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const normalizeCity = (value = '') => value.trim().toLowerCase();
const getListKey = (value, index, prefix) => `${String(value || '').trim() || prefix}-${index}`;
const getRouteKey = (route, index) => {
  const fromCity = String(route?.fromCity || '').trim();
  const toCity = String(route?.toCity || '').trim();
  const operatorName = String(route?.operatorName || '').trim();
  return `${fromCity || 'from'}-${toCity || 'to'}-${operatorName || index}`;
};

const BusHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const routePrefix = useMemo(() => getRoutePrefix(location.pathname), [location.pathname]);
  const busEnabled = String(settings.transportRide?.enable_bus_service || '0') === '1';

  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [error, setError] = useState('');
  const [routeSuggestions, setRouteSuggestions] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => getMonthStart(new Date(getTomorrowDate())));
  const [banners, setBanners] = useState([]);
  const [offers, setOffers] = useState([]);
  const [bannersLoading, setBannersLoading] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  useEffect(() => {
    let active = true;

    const loadBanners = async () => {
      setBannersLoading(true);
      try {
        const response = await userBusService.getBanners({ type: 'banner' });
        if (!active) return;
        const bannerList = response?.data?.results || response?.results || [];
        setBanners(bannerList);
      } catch (err) {
        console.error('Failed to load bus banners:', err);
      } finally {
        if (active) {
          setBannersLoading(false);
        }
      }
    };

    const loadOffers = async () => {
      setOffersLoading(true);
      try {
        const response = await userBusService.getBanners({ type: 'offer' });
        if (!active) return;
        const offerList = response?.data?.results || response?.results || [];
        setOffers(offerList);
      } catch (err) {
        console.error('Failed to load bus offers:', err);
      } finally {
        if (active) {
          setOffersLoading(false);
        }
      }
    };

    loadBanners();
    loadOffers();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [banners]);

  const handleBannerClick = (linkUrl) => {
    if (!linkUrl) return;
    if (linkUrl.startsWith('http')) {
      window.open(linkUrl, '_blank', 'noopener,noreferrer');
    } else {
      navigate(linkUrl);
    }
  };

  useEffect(() => {
    if (!busEnabled) {
      setRouteSuggestions([]);
      return;
    }

    let active = true;

    const loadRoutes = async () => {
      setRoutesLoading(true);
      setRoutesError('');
      try {
        const response = await userBusService.getRoutes();
        if (!active) return;
        setRouteSuggestions(Array.isArray(response?.data?.results) ? response.data.results : []);
      } catch (err) {
        if (!active) return;
        setRoutesError(err?.message || 'Failed to load route suggestions');
      } finally {
        if (active) {
          setRoutesLoading(false);
        }
      }
    };

    loadRoutes();

    return () => {
      active = false;
    };
  }, [busEnabled]);

  const cityOptions = useMemo(() => {
    const cities = new Set();

    routeSuggestions.forEach((route) => {
      const fromCity = String(route?.fromCity || '').trim();
      const toCity = String(route?.toCity || '').trim();

      if (fromCity) cities.add(fromCity);
      if (toCity) cities.add(toCity);
    });

    return Array.from(cities).sort((left, right) => left.localeCompare(right));
  }, [routeSuggestions]);

  const matchingRoute = useMemo(
    () =>
      routeSuggestions.find(
        (route) =>
          normalizeCity(route.fromCity) === normalizeCity(fromCity) &&
          normalizeCity(route.toCity) === normalizeCity(toCity),
      ) || null,
    [fromCity, routeSuggestions, toCity],
  );

  const hasTypedInvalidRoute =
    fromCity.trim() &&
    toCity.trim() &&
    normalizeCity(fromCity) !== normalizeCity(toCity) &&
    routeSuggestions.length > 0 &&
    !matchingRoute;

  const horizontalQuickDates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 3 }, (_, index) => {
      const d = new Date(today);
      d.setDate(today.getDate() + index);
      const dateStr = formatDateKey(d);
      return {
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        day: d.getDate(),
        value: dateStr,
      };
    });
  }, []);

  const formatCalendarLabel = (dateStr) => {
    if (!dateStr) return '';
    const parsed = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    const weekday = parsed.toLocaleDateString('en-US', { weekday: 'short' });
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = parsed.toLocaleDateString('en-US', { month: 'short' });
    return `${weekday}, ${day} ${month}`;
  };

  const filteredFromCities = useMemo(() => {
    const source = normalizeCity(fromCity);
    const destinations = new Set(
      routeSuggestions
        .filter((route) => (!toCity ? true : normalizeCity(route.toCity) === normalizeCity(toCity)))
        .map((route) => route.fromCity)
        .filter(Boolean),
    );

    return Array.from(destinations)
      .filter((city) => (!source ? true : normalizeCity(city).includes(source)))
      .slice(0, 6);
  }, [fromCity, routeSuggestions, toCity]);

  const filteredToCities = useMemo(() => {
    const destination = normalizeCity(toCity);
    const origins = new Set(
      routeSuggestions
        .filter((route) => (!fromCity ? true : normalizeCity(route.fromCity) === normalizeCity(fromCity)))
        .map((route) => route.toCity)
        .filter(Boolean),
    );

    return Array.from(origins)
      .filter((city) => (!destination ? true : normalizeCity(city).includes(destination)))
      .slice(0, 6);
  }, [fromCity, routeSuggestions, toCity]);

  const featuredRoutes = useMemo(() => routeSuggestions.slice(0, 6), [routeSuggestions]);
  const minimumDate = useMemo(() => new Date(`${getTodayDate()}T00:00:00`), []);
  const selectedDateValue = useMemo(() => (date ? new Date(`${date}T00:00:00`) : null), [date]);
  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const monthLabel = useMemo(
    () =>
      calendarMonth.toLocaleDateString('en-IN', {
        month: 'long',
        year: 'numeric',
      }),
    [calendarMonth],
  );

  const handleSearch = () => {
    const source = fromCity.trim();
    const destination = toCity.trim();

    if (!busEnabled) {
      setError('Bus service is disabled right now.');
      return;
    }

    if (!source || !destination) {
      setError('Choose both source and destination first.');
      return;
    }

    if (normalizeCity(source) === normalizeCity(destination)) {
      setError('From and destination cannot be the same.');
      return;
    }

    if (!date) {
      setError('Select a travel date.');
      return;
    }

    if (date < getTodayDate()) {
      setError('Please select today or a future travel date.');
      return;
    }

    if (!matchingRoute) {
      setError('This route is not active yet. Pick one from the available routes below.');
      return;
    }

    setError('');
    navigate(`${routePrefix}/bus/list`, {
      state: {
        fromCity: source,
        toCity: destination,
        date,
      },
    });
  };

  const fillRoute = (route) => {
    setFromCity(route.fromCity || '');
    setToCity(route.toCity || '');
    setError('');

    if (date) {
      navigate(`${routePrefix}/bus/list`, {
        state: {
          fromCity: route.fromCity || '',
          toCity: route.toCity || '',
          date,
        },
      });
    }
  };

  const swapCities = () => {
    setFromCity(toCity);
    setToCity(fromCity);
    setError('');
  };

  const openCalendar = () => {
    const activeDate = selectedDateValue && !Number.isNaN(selectedDateValue.getTime()) ? selectedDateValue : minimumDate;
    setCalendarMonth(getMonthStart(activeDate));
    setCalendarOpen(true);
  };

  const selectCalendarDate = (value) => {
    const nextValue = formatDateKey(value);
    if (nextValue < getTodayDate()) {
      return;
    }

    setDate(nextValue);
    setCalendarOpen(false);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#99f6e4] via-[#ccfbf1] to-[#f0fdfa] mx-auto w-full max-w-lg lg:max-w-5xl font-sans pb-32 lg:pb-16 relative overflow-hidden">
      <header className="bg-transparent px-5 pt-12 pb-2 lg:px-8 lg:pt-8 sticky top-0 z-20 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center shadow-sm active:scale-95 transition-all hover:bg-white"
        >
          <ArrowLeft size={20} className="text-gray-800" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-[#0d9488]/80">Bus Tickets</p>
          <h1 className="text-xl font-bold text-gray-900 leading-none">Book your journey</h1>
        </div>
      </header>
 
      <div className="px-5 pt-4 space-y-5 lg:px-8">
        {/* Source/Destination inputs */}
        <div className="bg-white/65 backdrop-blur-lg border border-white/50 rounded-[28px] p-5 shadow-sm space-y-4 relative">
          <div className="flex items-center gap-3 relative z-10">
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full border-2 border-gray-400 bg-white" />
            </span>
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400/90 mb-0.5">Enter Departure</label>
              <input
                type="text"
                list="bus-route-cities"
                value={fromCity}
                onChange={(event) => setFromCity(event.target.value)}
                placeholder="Source city"
                className="w-full bg-transparent text-base font-bold text-gray-800 focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>
          </div>

          <div className="relative pl-8">
            <div className="w-full h-px bg-gray-100/80" />
            <div className="absolute left-2.5 -top-[18px] bottom-[10px] border-l border-dashed border-teal-500/40" />
          </div>

          <div className="flex items-center gap-3 relative z-10">
            <span className="w-5 h-5 flex items-center justify-center text-teal-600 shrink-0">
              <MapPin size={18} className="stroke-[2.5px]" />
            </span>
            <div className="flex-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400/90 mb-0.5">Enter Destination</label>
              <input
                type="text"
                list="bus-route-cities"
                value={toCity}
                onChange={(event) => setToCity(event.target.value)}
                placeholder="Destination city"
                className="w-full bg-transparent text-base font-bold text-gray-800 focus:outline-none placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>
          </div>

          <div className="absolute right-5 top-[39%] -translate-y-1/2 z-20">
            <button
              type="button"
              onClick={swapCities}
              className="w-11 h-11 bg-white rounded-2xl shadow-md border border-gray-50 text-teal-600 flex items-center justify-center rotate-45 active:scale-95 transition-all hover:bg-gray-50"
            >
              <ArrowRightLeft size={16} className="-rotate-45" />
            </button>
          </div>
        </div>

        {/* Date Selection Card */}
        <div className="bg-white/65 backdrop-blur-lg border border-white/50 rounded-[24px] p-3 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {horizontalQuickDates.map((item) => {
              const isSelected = date === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDate(item.value)}
                  className={`flex flex-col items-center justify-center w-[4.25rem] py-2 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-[#0d9488] text-white font-bold shadow-md shadow-teal-500/10 scale-[1.03]'
                      : 'bg-white text-gray-850 border border-gray-100 hover:bg-gray-50/50'
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-teal-100/90' : 'text-gray-450'}`}>
                    {item.weekday}
                  </span>
                  <span className="text-base font-black mt-0.5 leading-none">{item.day}</span>
                </button>
              );
            })}
          </div>

          <div className="h-10 w-px bg-gray-200/80 shrink-0" />

          <button
            type="button"
            onClick={openCalendar}
            className="flex-1 flex items-center justify-end gap-2 text-right pl-2 select-none"
          >
            <Calendar size={18} className="text-teal-600 shrink-0" />
            <span className="text-sm font-black text-gray-800 leading-none truncate select-none">
              {formatCalendarLabel(date) || 'Select Date'}
            </span>
          </button>
        </div>

        <datalist id="bus-route-cities">
          {cityOptions.map((city, index) => (
            <option key={getListKey(city, index, 'city')} value={city} />
          ))}
        </datalist>

        <div className="space-y-4">
          {matchingRoute && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Route size={14} className="text-emerald-600" />
                <span className="text-xs font-bold text-emerald-700">Route available</span>
              </div>
              <span className="text-xs font-bold text-emerald-700">
                Starts at ₹{Number(matchingRoute.startingPrice || 0)}
              </span>
            </div>
          )}

          {hasTypedInvalidRoute && (
            <div className="rounded-2xl bg-bus-light border border-bus-light-border px-4 py-3 text-xs font-bold text-bus-dark/70 shadow-sm">
              This specific route is not available. Please check the list below.
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-rose-50 border border-rose-100 px-4 py-3 text-xs font-bold text-rose-600 shadow-sm">
              {error}
            </div>
          )}

          {!busEnabled && (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs font-bold text-amber-700 shadow-sm">
              Bus service is currently disabled.
            </div>
          )}

          {/* Search Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSearch}
            className="w-full bg-black hover:bg-slate-900 text-white py-4.5 rounded-full text-base font-black flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-95 transition-all"
          >
            <Search size={18} className="stroke-[2.5px]" />
            <span>Search Buses</span>
          </motion.button>

          {/* Ticket Banner */}
          <div className="bg-[#ccfbf1]/50 border border-teal-100/50 rounded-[20px] px-4 py-3.5 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-teal-600 shadow-sm shrink-0">
                <Ticket size={16} className="fill-teal-50" />
              </span>
              <span className="text-xs font-black text-teal-800 tracking-wide">
                Your next journey starts here
              </span>
            </div>
            <ChevronRight size={16} className="text-teal-600 stroke-[2.5px]" />
          </div>
        </div>

        {/* Banner Section (Dynamic Carousel / Skeleton Loading) */}
        {bannersLoading ? (
          <div className="w-full h-44 sm:h-52 rounded-[28px] bg-slate-100 animate-pulse mt-2" />
        ) : banners.length > 0 ? (
          <div className="relative overflow-hidden rounded-[28px] border border-teal-100/50 bg-white shadow-sm mt-2">
            <div className="relative w-full h-44 sm:h-52 overflow-hidden">
              <AnimatePresence initial={false} mode="wait">
                <motion.img
                  key={currentBannerIndex}
                  src={banners[currentBannerIndex]?.imageUrl}
                  alt={banners[currentBannerIndex]?.title || 'Promo Banner'}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  onClick={() => handleBannerClick(banners[currentBannerIndex]?.linkUrl)}
                  className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
                />
              </AnimatePresence>

              {banners[currentBannerIndex]?.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-10">
                  <p className="text-white text-xs font-bold truncate">
                    {banners[currentBannerIndex]?.title}
                  </p>
                </div>
              )}
            </div>

            {banners.length > 1 && (
              <div className="absolute bottom-3 right-4 flex gap-1.5 z-10 bg-black/25 backdrop-blur-md px-2 py-1 rounded-full">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      idx === currentBannerIndex ? 'bg-white scale-125' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}

        {/* Offers & Popular Routes Drawer Card */}
        <div className="bg-white rounded-t-[36px] shadow-[0_-12px_40px_rgba(0,0,0,0.03)] border-t border-gray-100/60 p-6 space-y-5 -mx-5 pb-10">
          <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto -mt-2 mb-2" />
          
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900">Offers & Promotions</h3>
          </div>

          {/* Horizontal Promo Scroll */}
          {offersLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="w-72 h-32 rounded-3xl bg-slate-100 animate-pulse shrink-0 p-5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200/80 rounded w-1/4" />
                    <div className="h-4 bg-slate-200/80 rounded w-3/4" />
                    <div className="h-3 bg-slate-200/80 rounded w-5/6" />
                  </div>
                  <div className="h-3 bg-slate-200/80 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : offers.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
              {offers.map((offer) => (
                <div
                  key={offer.id || offer._id}
                  onClick={() => handleBannerClick(offer.linkUrl)}
                  className="w-72 h-32 rounded-3xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0 cursor-pointer shadow-sm relative group"
                >
                  <img
                    src={offer.imageUrl}
                    alt={offer.title || 'Offer Banner'}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  {offer.title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-6">
                      <p className="text-white text-[11px] font-black truncate">
                        {offer.title}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar -mx-6 px-6">
              {/* Metro Ride Offer (From image) */}
              <div className="w-72 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-100 rounded-3xl p-5 shrink-0 flex flex-col justify-between space-y-4">
                <div>
                  <span className="bg-teal-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Special Offer
                  </span>
                  <h4 className="text-base font-black text-teal-900 mt-2.5 leading-snug">
                    YOUR METRO RIDE IS ON US
                  </h4>
                  <p className="text-[11px] font-semibold text-teal-700/80 mt-1 leading-normal">
                    Book a NueGo ticket in Hyderabad & Get a FREE Metro Ride to/from your boarding/drop point.
                  </p>
                </div>
                <div className="border-t border-teal-100 pt-3 flex items-center justify-between">
                  <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest">
                    Show PNR at Counter
                  </span>
                  <ChevronRight size={14} className="text-teal-600" />
                </div>
              </div>

              {/* Promo Offer 2 */}
              <div className="w-72 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-5 shrink-0 flex flex-col justify-between space-y-4">
                <div>
                  <span className="bg-amber-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Save Big
                  </span>
                  <h4 className="text-base font-black text-amber-900 mt-2.5 leading-snug">
                    Flat 10% Off on First Ride
                  </h4>
                  <p className="text-[11px] font-semibold text-amber-700/80 mt-1 leading-normal">
                    Save up to ₹150 with code FIRSTBUS on all booking routes. Safe, clean, and reliable coaches.
                  </p>
                </div>
                <div className="border-t border-amber-100 pt-3 flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                    Use Code: FIRSTBUS
                  </span>
                  <ChevronRight size={14} className="text-amber-600" />
                </div>
              </div>

              {/* Promo Offer 3 */}
              <div className="w-72 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-5 shrink-0 flex flex-col justify-between space-y-4">
                <div>
                  <span className="bg-blue-600 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    Flexibility
                  </span>
                  <h4 className="text-base font-black text-blue-900 mt-2.5 leading-snug">
                    Free Booking Cancellations
                  </h4>
                  <p className="text-[11px] font-semibold text-blue-700/80 mt-1 leading-normal">
                    Change of plans? Cancel your ticket for free up to 6 hours before departure on selected buses.
                  </p>
                </div>
                <div className="border-t border-blue-100 pt-3 flex items-center justify-between">
                  <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">
                    Terms & Conditions Apply
                  </span>
                  <ChevronRight size={14} className="text-blue-600" />
                </div>
              </div>
            </div>
          )}

          {/* Popular Routes List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Available Routes</h4>
              {routesLoading && <Loader2 size={14} className="animate-spin text-teal-600" />}
            </div>
            
            {featuredRoutes.map((route, index) => (
              <button
                key={getRouteKey(route, index)}
                type="button"
                onClick={() => fillRoute(route)}
                className="w-full rounded-2xl border border-gray-100 bg-white px-4 py-3.5 text-left shadow-sm active:scale-[0.99] transition-transform flex items-center justify-between hover:border-teal-500/30"
              >
                <div className="min-w-0 pr-3">
                  <h5 className="text-sm font-bold text-gray-800 truncate">
                    {route.fromCity} → {route.toCity}
                  </h5>
                  <p className="mt-0.5 text-[10px] font-bold text-gray-400 truncate">
                    {route.operatorName || 'Multiple operators available'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[9px] font-bold uppercase text-gray-400">From</p>
                  <p className="text-base font-black text-[#0d9488]">₹{Number(route.startingPrice || 0)}</p>
                </div>
              </button>
            ))}

            {!routesLoading && !featuredRoutes.length && !routesError && (
              <p className="text-center py-6 text-xs font-bold text-gray-400">No active routes found.</p>
            )}

            {routesError && (
              <p className="text-center py-6 text-xs font-bold text-rose-500">{routesError}</p>
            )}
          </div>
        </div>
      </div>
 
      {calendarOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm flex items-end justify-center p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase text-bus-dark/50 mb-1">Select Journey Date</p>
                <h3 className="text-xl font-bold text-bus-darker">{monthLabel}</h3>
              </div>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="w-10 h-10 rounded-full bg-bus-light text-bus-accent flex items-center justify-center hover:bg-bus-light-border transition-colors"
              >
                <X size={20} />
              </button>
            </div>
 
            <div className="flex items-center justify-between gap-4 mb-6">
              <button
                type="button"
                onClick={() => setCalendarMonth((current) => addMonths(current, -1))}
                className="w-10 h-10 rounded-xl border border-bus-light-border flex items-center justify-center text-bus-dark hover:bg-bus-light"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex-1 text-center">
                <span className="text-sm font-bold text-bus-darker px-4 py-2 bg-bus-light rounded-full">
                  {formatTravelDate(date)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCalendarMonth((current) => addMonths(current, 1))}
                className="w-10 h-10 rounded-xl border border-bus-light-border flex items-center justify-center text-bus-dark hover:bg-bus-light"
              >
                <ChevronRight size={20} />
              </button>
            </div>
 
            <div className="grid grid-cols-7 gap-1 mb-6">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-bus-dark/50 py-2">
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => {
                const key = formatDateKey(day);
                const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
                const isDisabled = key < getTodayDate();
                const isSelected = key === date;
 
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => selectCalendarDate(day)}
                    className={`aspect-square rounded-xl text-sm font-bold transition-all flex items-center justify-center ${
                      isSelected
                        ? 'bg-bus-primary text-white shadow-lg shadow-bus-primary/20'
                        : isDisabled
                          ? 'text-slate-200'
                          : isCurrentMonth
                            ? 'text-bus-darker hover:bg-bus-light'
                            : 'text-bus-dark/30'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
 
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDate(getTodayDate());
                  setCalendarOpen(false);
                }}
                className="flex-1 py-3 rounded-2xl bg-bus-light text-bus-dark text-sm font-bold border border-bus-light-border hover:bg-bus-light-border/60 transition-colors"
              >
                Tomorrow
              </button>
              <button
                type="button"
                onClick={() => setCalendarOpen(false)}
                className="flex-1 py-3 rounded-2xl bg-bus-primary hover:bg-bus-primary-hover text-white text-sm font-bold shadow-md shadow-bus-primary/10 transition-colors"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
 
      <BottomNavbar />
    </div>
  );
};

export default BusHome;
