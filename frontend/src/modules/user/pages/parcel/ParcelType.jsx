import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Clock3,
  Coins,
  Headset,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import api from '../../../../shared/api/axiosInstance';

import trucksImg from '@/assets/images/delivery/trucks.png';
import bikeImg from '@/assets/images/delivery/bike.png';
import moversImg from '@/assets/images/delivery/movers.png';

const Motion = motion;
const PARCEL_BOOKING_DRAFT_KEY = 'parcelBookingDraft';

const DELIVERY_CATEGORY_OPTIONS = [
  {
    id: 'trucks',
    title: 'Trucks',
    subtitle: 'Perfect for large and heavy shipments',
    badge: 'Best for Heavy Loads',
    capacity: 'Up to 10,000 kg',
    img: trucksImg,
    icon: Truck,
    accent: {
      soft: 'bg-blue-50 text-blue-700',
      solid: 'bg-blue-600',
      border: 'border-blue-200',
      glow: 'shadow-[0_20px_60px_rgba(37,99,235,0.18)]',
    },
    searchTokens: ['truck', 'lcv', 'hcv', 'mcv', 'loader'],
  },
  {
    id: '2wheeler',
    title: '2 Wheeler',
    subtitle: 'Ideal for small parcels and documents',
    badge: 'Fast & Affordable',
    capacity: 'Up to 20 kg',
    img: bikeImg,
    icon: PackageCheck,
    accent: {
      soft: 'bg-emerald-50 text-emerald-700',
      solid: 'bg-emerald-600',
      border: 'border-emerald-200',
      glow: 'shadow-[0_20px_60px_rgba(5,150,105,0.16)]',
    },
    searchTokens: ['bike', 'scooter', 'cycle', '2-wheeler'],
  },
  {
    id: 'movers',
    title: 'Packers & Movers',
    subtitle: 'Safe and reliable moving for home or office',
    badge: 'Door to Door Service',
    capacity: 'Up to 5,000 kg',
    img: moversImg,
    icon: BadgeCheck,
    accent: {
      soft: 'bg-violet-50 text-violet-700',
      solid: 'bg-violet-600',
      border: 'border-violet-200',
      glow: 'shadow-[0_20px_60px_rgba(124,58,237,0.14)]',
    },
    searchTokens: ['mover', 'packers'],
  },
];

const FEATURE_PILLS = [
  {
    id: 'insured',
    title: 'Safe & Secure',
    subtitle: 'Parcels are handled with extra care',
    icon: ShieldCheck,
    accent: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'ontime',
    title: 'On-time Delivery',
    subtitle: 'Quick assignment and real-time movement',
    icon: Clock3,
    accent: 'text-amber-600 bg-amber-50',
  },
  {
    id: 'support',
    title: '24/7 Support',
    subtitle: 'We stay available through the trip',
    icon: Headset,
    accent: 'text-emerald-600 bg-emerald-50',
  },
];

const ParcelType = () => {
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickupAddress] = useState('Tap to set your pickup location');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/vehicle-types');
        const items = response?.results || response?.data?.results || [];
        setVehicleTypes(items.filter((v) => v.active && (v.transport_type === 'delivery' || v.transport_type === 'both')));
      } catch (err) {
        console.error('Failed to load vehicles:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const availableCount = useMemo(() => vehicleTypes.length || DELIVERY_CATEGORY_OPTIONS.length, [vehicleTypes.length]);

  const handleCategorySelect = (category) => {
    const filteredVehicles = vehicleTypes.filter((vehicle) => {
      const configuredCategory = String(vehicle.delivery_category || '').trim().toLowerCase();
      if (configuredCategory) {
        return configuredCategory === category.id;
      }

      const name = String(vehicle.name || '').toLowerCase();
      const iconType = String(vehicle.icon_types || '').toLowerCase();
      return category.searchTokens.some((token) => name.includes(token) || iconType.includes(token));
    });

    if (loading || vehicleTypes.length === 0) return;

    const selectedVehicle = filteredVehicles[0] || vehicleTypes[0];
    const selectedVehicleIds = filteredVehicles.length
      ? filteredVehicles.map((vehicle) => vehicle?._id || vehicle?.id).filter(Boolean)
      : [selectedVehicle?._id || selectedVehicle?.id].filter(Boolean);
    const selectedVehicles = filteredVehicles.length ? filteredVehicles : selectedVehicle ? [selectedVehicle] : [];

    const nextState = {
      parcelType: 'General Parcel',
      selectedVehicle,
      selectedVehicles,
      selectedVehicleId: selectedVehicle?._id || selectedVehicle?.id,
      selectedVehicleIds,
      category: category.id,
      deliveryCategory: category.id,
      pickup: pickupAddress,
    };

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(PARCEL_BOOKING_DRAFT_KEY, JSON.stringify(nextState));
    }

    navigate('/taxi/user/parcel/details', { state: nextState });
  };

  return (
    <div className="min-h-screen bg-[#f4f7ff] max-w-lg mx-auto flex flex-col font-sans relative overflow-x-hidden">
      <div className="relative overflow-hidden px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-6">
        <div className="absolute inset-x-0 top-0 h-[280px] bg-[linear-gradient(180deg,#edf4ff_0%,#f8fbff_55%,#f4f7ff_100%)]" />
        <div className="absolute left-[-40px] top-[120px] h-28 w-28 rounded-full bg-blue-200/30 blur-2xl" />
        <div className="absolute right-[-20px] top-10 h-24 w-24 rounded-full bg-sky-200/30 blur-2xl" />

        <button
          onClick={() => navigate(-1)}
          className="relative z-20 mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-blue-700 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        >
          <ArrowLeft size={18} />
        </button>

        <Motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#f7fbff_55%,#eef5ff_100%)] px-5 pb-5 pt-4 shadow-[0_24px_60px_rgba(59,130,246,0.12)]"
        >
          <div className="absolute left-[-18px] bottom-0 h-24 w-24 rounded-full bg-blue-400/15 blur-2xl" />
          <div className="absolute right-[-32px] top-[-18px] h-24 w-24 rounded-full bg-sky-400/15 blur-2xl" />
          <div className="absolute right-5 top-10 h-10 w-10 rounded-full bg-white/70 shadow-sm" />
          <div className="absolute left-[58%] top-12 text-blue-400/70">
            <MapPin size={20} strokeWidth={2.4} />
          </div>
          <svg className="absolute right-[36%] top-6 h-20 w-28 text-blue-300/80" viewBox="0 0 120 80" fill="none" aria-hidden="true">
            <path d="M5 62C22 38 44 50 60 28C73 10 86 17 109 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="5 5" />
            <path d="M100 4L109 8L103 17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>

          <div className="relative z-10 flex gap-2">
            <div className="min-w-0 flex-1 pt-2">
              <p className="max-w-[210px] text-[15px] font-black leading-[1.18] text-slate-900">
                Send it your way,
                <span className="mt-1 block text-[15px] text-[#1d4ed8]">We&apos;ll deliver with care.</span>
              </p>
              <p className="mt-2 max-w-[190px] text-[11px] font-semibold leading-5 text-slate-500">
                Choose the best vehicle for your delivery and get it picked up in minutes.
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-700">
                <PackageCheck size={12} strokeWidth={2.5} />
                {availableCount} delivery options
              </div>
            </div>

            <div className="relative flex w-[215px] shrink-0 items-end justify-end pr-1">
              <img src={trucksImg} alt="Delivery truck" className="pointer-events-none absolute bottom-0 left-0 w-[128px] drop-shadow-[0_18px_28px_rgba(30,64,175,0.2)]" />
              <img src={bikeImg} alt="Two wheeler delivery" className="pointer-events-none absolute bottom-[3px] left-[92px] w-[84px] drop-shadow-[0_16px_24px_rgba(37,99,235,0.18)]" />
              <img src={moversImg} alt="Packers and movers" className="pointer-events-none relative z-10 w-[98px] drop-shadow-[0_18px_26px_rgba(59,130,246,0.16)]" />
            </div>
          </div>
        </Motion.section>

        <Motion.button
          type="button"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          onClick={() => navigate('/taxi/user/parcel/details', { state: { editPickup: true } })}
          className="relative z-20 -mt-4 flex w-full items-center gap-3 rounded-[22px] border border-white bg-white px-4 py-4 text-left shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <MapPin size={20} strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-700">Pick up from</p>
            <p className="mt-1 truncate text-[13px] font-semibold text-slate-500">{pickupAddress}</p>
          </div>
          <ChevronRight size={20} className="text-slate-400" />
        </Motion.button>
      </div>

      <main className="flex-1 px-4 pb-8">
        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <div className="h-5 w-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowRight size={12} strokeWidth={3} />
            </div>
            <h2 className="text-[16px] font-black text-slate-900">Choose your delivery type</h2>
          </div>

          <div className="space-y-3">
            {DELIVERY_CATEGORY_OPTIONS.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <Motion.button
                  key={cat.id}
                  type="button"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 + idx * 0.06 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleCategorySelect(cat)}
                  className={`w-full overflow-hidden rounded-[24px] border bg-white p-4 text-left shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-transform ${idx === 0 ? `${cat.accent.border} ${cat.accent.glow}` : 'border-slate-100'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black ${cat.accent.soft}`}>
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full ${cat.accent.solid} text-white`}>
                        <Icon size={10} strokeWidth={2.8} />
                      </span>
                      {cat.badge}
                    </div>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${cat.accent.soft}`}>
                      <Icon size={19} strokeWidth={2.4} />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-[92px] w-[108px] shrink-0 items-end justify-center overflow-hidden rounded-[20px] bg-slate-50">
                      <img src={cat.img} alt={cat.title} className="max-h-[84px] w-auto object-contain drop-shadow-[0_12px_20px_rgba(15,23,42,0.12)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[24px] font-black leading-none text-slate-900">{cat.title}</h3>
                      <p className="mt-2 text-[13px] font-semibold leading-5 text-slate-500">{cat.subtitle}</p>
                      <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-black ${cat.accent.soft}`}>
                        {cat.capacity}
                      </div>
                    </div>
                  </div>
                </Motion.button>
              );
            })}
          </div>
        </section>

        <Motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="relative mt-5 overflow-hidden rounded-[26px] bg-[linear-gradient(90deg,#1f3fc8_0%,#2948d5_55%,#2a50e6_100%)] px-5 py-4 text-white shadow-[0_22px_48px_rgba(37,99,235,0.24)]"
        >
          <div className="absolute right-4 top-3 h-16 w-16 rounded-full bg-white/8 blur-xl" />
          <div className="absolute right-0 bottom-0 flex items-end gap-1 pr-4 pb-3 opacity-95">
            <div className="mb-1 flex gap-1">
              <div className="h-6 w-4 rounded-[4px] bg-yellow-400" />
              <div className="h-8 w-5 rounded-[4px] bg-yellow-500" />
              <div className="h-5 w-4 rounded-[4px] bg-yellow-300" />
            </div>
            <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-b from-yellow-300 to-amber-500 shadow-[0_12px_20px_rgba(0,0,0,0.18)]">
              <div className="absolute inset-x-2 top-2 h-2 rounded-full bg-blue-500/90" />
              <div className="absolute inset-y-2 left-1/2 w-1 -translate-x-1/2 bg-blue-500/90" />
            </div>
            <div className="ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-amber-900">
              <Coins size={15} strokeWidth={2.5} />
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="max-w-[68%]">
              <h3 className="text-[14px] font-black">Explore Rewards</h3>
              <p className="mt-1 text-[11px] font-semibold text-white/80">Earn 2 coins for every 100 spent</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2342cf]">
              <ArrowRight size={18} strokeWidth={3} />
            </div>
          </div>
        </Motion.section>

        <section className="mt-5 rounded-[24px] border border-white/80 bg-white/80 px-4 py-3 shadow-[0_14px_32px_rgba(15,23,42,0.04)] backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-2">
            {FEATURE_PILLS.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="min-w-0 rounded-[18px] bg-slate-50/90 px-3 py-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-2xl ${item.accent}`}>
                    <Icon size={18} strokeWidth={2.2} />
                  </div>
                  <p className="mt-3 text-[11px] font-black leading-4 text-slate-900">{item.title}</p>
                  <p className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{item.subtitle}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ParcelType;
