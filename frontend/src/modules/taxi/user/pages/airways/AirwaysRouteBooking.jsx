import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  MapPin,
  Phone,
  PlaneTakeoff,
  ShieldCheck,
  Ticket,
  UserRound,
  Users,
  Clock3,
  Camera,
  Info,
  ChevronDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../../../shared/context/SettingsContext';
import { userService } from '../../services/userService';

// Asset Imports (Using the generated image)
import premiumHeliHero from '@/assets/airways/premium_heli_hero.png';

const PHONEPE_PENDING_BOOKING_KEY = 'taxi-airway-phonepe-booking';

const tomorrowDateValue = () => {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  return next.toISOString().slice(0, 10);
};

// Rounded, same as the sector cards -- base + a percentage tax lands on
// fractions of a rupee, and the two screens must not disagree on the price.
const formatCurrency = (value) => `Rs. ${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

const formatTravelDate = (value) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return 'Select travel date';
  }
  return parsed.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

const formatTimeLabel = (value = '') => {
  const normalized = String(value || '').trim();
  if (!normalized) return '--';

  const date = new Date(`2000-01-01T${normalized}`);
  if (Number.isNaN(date.getTime())) return normalized;

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const readStoredUser = () => {
  try {
    return JSON.parse(window.localStorage.getItem('userInfo') || '{}');
  } catch {
    return {};
  }
};

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const AirwaysRouteBooking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { routeId } = useParams();
  const { settings } = useSettings();
  const activePaymentGateway = settings.paymentGateway || null;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [route, setRoute] = useState(null);
  const [seatCount, setSeatCount] = useState(1);
  const [travelDate, setTravelDate] = useState(location.state?.travelDate || tomorrowDateValue());
  const [selectedAirwayId, setSelectedAirwayId] = useState(location.state?.selectedAirwayId || '');
  const [passengerNames, setPassengerNames] = useState(['']);
  const [currentStep, setCurrentStep] = useState(1); // 1: Route & Date, 2: Passengers, 3: Payment
  const [formData, setFormData] = useState(() => {
    const storedUser = readStoredUser();
    return {
      customerName: storedUser?.name || '',
      customerPhone: storedUser?.phone || '',
      customerEmail: storedUser?.email || '',
      notes: '',
    };
  });
  const paymentMethod = 'online';

  const routeAirways = Array.isArray(route?.airways) && route.airways.length > 0
    ? route.airways
    : route?.airway
      ? [route.airway]
      : [];
  
  const selectedAirway = routeAirways.find((item) => item?.id === selectedAirwayId) || routeAirways[0] || route?.airway || null;
  
  const heroImage = selectedAirway?.image
    || selectedAirway?.gallery?.[0]
    || route?.image
    || route?.gallery?.[0]
    || premiumHeliHero;

  const subtotalFare = Number(selectedAirway?.basePrice || route?.baseFare || 0) * seatCount;
  const serviceTaxPercent = Number(selectedAirway?.serviceTaxPercent || route?.serviceTaxPercent || 0);
  const serviceTaxAmount = (subtotalFare * serviceTaxPercent) / 100;
  const totalFare = subtotalFare + serviceTaxAmount;

  const buildBookingPayload = () => ({
    routeId: route?.id,
    selectedAirwayId: selectedAirway?.id || selectedAirwayId || route?.airway?.id || '',
    seatCount,
    customerName: formData.customerName,
    customerPhone: formData.customerPhone,
    customerEmail: formData.customerEmail,
    passengerNames,
    notes: formData.notes,
    travelDate,
    subtotalFare,
    serviceTaxPercent,
    serviceTaxAmount,
    totalFare,
    paymentMethod,
    paymentMethodLabel: activePaymentGateway?.label || 'Online',
    gatewaySlug: activePaymentGateway?.slug || '',
  });

  useEffect(() => {
    const loadRoute = async () => {
      try {
        setLoading(true);
        const nextRoute = await userService.getAirwayRoute(routeId);
        if (!nextRoute) {
          toast.error('Helicopter route not found.');
          navigate('/taxi/user/airways', { replace: true });
          return;
        }
        const routeAirwayIds = Array.isArray(nextRoute?.airways) ? nextRoute.airways.map((item) => item.id).filter(Boolean) : [];
        if (routeAirwayIds.length > 0) {
          setSelectedAirwayId((current) => (
            current && routeAirwayIds.includes(current)
              ? current
              : (location.state?.selectedAirwayId && routeAirwayIds.includes(location.state.selectedAirwayId))
                ? location.state.selectedAirwayId
                : routeAirwayIds[0]
          ));
        }
        setRoute(nextRoute);
      } catch (error) {
        console.error(error);
        toast.error('Could not load the helicopter route.');
        navigate('/taxi/user/airways', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadRoute();
  }, [navigate, routeId]);

  useEffect(() => {
    setPassengerNames((current) => {
      const next = Array.from({ length: seatCount }, (_, index) => current[index] || '');
      if (!next[0] && formData.customerName) {
        next[0] = formData.customerName;
      }
      return next;
    });
  }, [formData.customerName, seatCount]);

  useEffect(() => {
    const merchantTransactionId = new URLSearchParams(window.location.search).get('phonepe_txn');
    if (!merchantTransactionId || activePaymentGateway?.slug !== 'phone_pay') {
      return;
    }

    let cancelled = false;

    const clearPhonePeQuery = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('phonepe_txn');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    };

    const verifyPhonePePayment = async () => {
      let pendingPayload = null;
      try {
        pendingPayload = JSON.parse(window.sessionStorage.getItem(PHONEPE_PENDING_BOOKING_KEY) || 'null');
      } catch {
        pendingPayload = null;
      }

      if (!pendingPayload || pendingPayload.routeId !== routeId) {
        clearPhonePeQuery();
        toast.error('Could not restore your pending PhonePe booking details.');
        return;
      }

      setSubmitting(true);
      try {
        const response = await userService.verifyAirwayBookingPayment({
          gateway: 'phone_pay',
          merchantTransactionId,
          ...pendingPayload,
        });

        if (cancelled) return;

        if (response?.status === 'pending') {
          toast.error('PhonePe payment is still pending. Please wait a moment and refresh.');
          return;
        }

        if (response?.status === 'failed') {
          toast.error('PhonePe payment was not completed.');
          return;
        }

        window.sessionStorage.removeItem(PHONEPE_PENDING_BOOKING_KEY);
        clearPhonePeQuery();
        toast.success('Seat booked and paid successfully.');
        navigate(`/taxi/user/airways/confirmation/${response.id}`, { state: { booking: response } });
      } catch (error) {
        if (!cancelled) {
          toast.error(error?.message || 'Could not verify PhonePe payment.');
        }
      } finally {
        if (!cancelled) {
          setSubmitting(false);
        }
      }
    };

    verifyPhonePePayment();

    return () => {
      cancelled = true;
    };
  }, [activePaymentGateway?.slug, navigate, routeId]);

  const setField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const setPassengerName = (index, value) => {
    setPassengerNames((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const handleSeatAdjust = (direction) => {
    setSeatCount((current) => {
      const available = Math.max(1, Number(route?.availableSeats || 1));
      if (direction === 'decrement') {
        return Math.max(1, current - 1);
      }
      return Math.min(available, current + 1);
    });
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!travelDate) {
        toast.error('Please select a travel date.');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
        toast.error('Passenger contact name and phone are required.');
        return false;
      }
      if (passengerNames.some((item) => !String(item || '').trim())) {
        toast.error('Please enter every passenger name before proceeding.');
        return false;
      }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((s) => Math.min(3, s + 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!activePaymentGateway) {
      toast.error('No payment gateway is enabled in the admin panel right now.');
      return;
    }

    try {
      setSubmitting(true);
      const bookingPayload = buildBookingPayload();

      if (activePaymentGateway.slug === 'phone_pay') {
        const session = await userService.createAirwayBookingOrder(bookingPayload);
        if (!session?.checkoutUrl) {
          throw new Error('Unable to start PhonePe payment');
        }

        window.sessionStorage.setItem(PHONEPE_PENDING_BOOKING_KEY, JSON.stringify(bookingPayload));
        window.location.assign(session.checkoutUrl);
        return;
      }

      if (activePaymentGateway.slug !== 'razor_pay') {
        throw new Error(`${activePaymentGateway.label} is enabled by admin, but airway checkout is not implemented for it yet.`);
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      const order = await userService.createAirwayBookingOrder(bookingPayload);
      if (!order?.keyId || !order?.orderId) {
        throw new Error('Unable to start payment');
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: selectedAirway?.airlineName || route?.airway?.airlineName || 'Airways Booking',
        description: `${route?.originAirport || ''} to ${route?.destinationAirport || ''}`.trim(),
        order_id: order.orderId,
        prefill: {
          name: formData.customerName,
          email: formData.customerEmail,
          contact: formData.customerPhone,
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
        handler: async (response) => {
          try {
            const booking = await userService.verifyAirwayBookingPayment({
              gateway: 'razor_pay',
              ...response,
              ...bookingPayload,
            });

            toast.success('Seat booked and paid successfully.');
            navigate(`/taxi/user/airways/confirmation/${booking.id}`, { state: { booking } });
          } catch (error) {
            toast.error(
              error?.message ||
              'Payment verification failed. Please contact support if payment was deducted.',
            );
          } finally {
            setSubmitting(false);
          }
        },
        theme: {
          color: '#0ea5e9',
        },
      });

      rzp.on('payment.failed', (event) => {
        const message = event?.error?.description || event?.error?.reason || 'Payment failed';
        toast.error(message);
        setSubmitting(false);
      });

      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'Could not complete helicopter booking.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
             <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
             <div className="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-sm font-black text-slate-900 uppercase tracking-widest">Preparing Flight...</p>
        </div>
      </div>
    );
  }

  if (!route) return null;

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] pb-32 overflow-x-hidden overflow-y-auto"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* Immersive Hero Section */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <img src={heroImage} alt="Helicopter" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-[#F8FAFC]" />
        
        {/* Floating Header */}
        <div className="absolute top-0 left-0 right-0 z-50 px-4 sm:px-5 py-5 sm:py-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => currentStep > 1 ? prevStep() : navigate('/taxi/user/airways')}
              className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-[20px] bg-white/20 backdrop-blur-xl text-white border border-white/20 active:scale-95 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex h-11 sm:h-12 min-w-0 items-center gap-2 sm:gap-3 px-3.5 sm:px-5 rounded-[20px] bg-white/20 backdrop-blur-xl border border-white/20">
              <Sparkles size={16} className="text-sky-300" />
              <span className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider sm:tracking-widest truncate">Premium Sector</span>
            </div>
          </div>
        </div>

        {/* Hero Title Area */}
        <div className="absolute bottom-10 sm:bottom-12 left-5 right-5">
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
           >
              <p className="text-sky-300 text-[10px] font-black uppercase tracking-[0.3em]">Exclusive Route</p>
              <h1 className="text-white text-2xl sm:text-4xl font-['Outfit'] font-extrabold mt-2 break-words leading-tight drop-shadow-2xl">{route.routeName}</h1>
              <div className="mt-4 flex items-center gap-3">
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
                    <PlaneTakeoff size={12} className="text-sky-300" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">{selectedAirway?.airlineName || 'Helicopter'}</span>
                 </div>
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
                    <div className="h-1 w-1 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Available</span>
                 </div>
              </div>
           </motion.div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto max-w-lg px-5 -mt-8">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-1 sm:px-4">
           {[1, 2, 3].map((step) => (
             <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-2">
                   <div className={`h-10 w-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                     currentStep === step 
                      ? 'bg-emerald-700 border-emerald-700 text-white shadow-xl shadow-slate-950/20 scale-110' 
                      : currentStep > step 
                        ? 'bg-emerald-500 border-emerald-500 text-white' 
                        : 'bg-white border-slate-100 text-slate-400'
                   }`}>
                      {currentStep > step ? <CheckCircle2 size={20} /> : <span className="text-sm font-black">{step}</span>}
                   </div>
                   <span className={`text-[9px] font-black uppercase tracking-widest ${currentStep === step ? 'text-slate-950' : 'text-slate-400'}`}>
                      {step === 1 ? 'Details' : step === 2 ? 'Passengers' : 'Payment'}
                   </span>
                </div>
                {step < 3 && (
                  <div className={`h-0.5 flex-1 mx-2 rounded-full transition-all duration-700 ${currentStep > step ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                )}
             </React.Fragment>
           ))}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Boarding Pass Style Card */}
              <div className="group relative overflow-hidden rounded-[32px] sm:rounded-[40px] bg-white border border-slate-100 shadow-[0_32px_64px_-12px_rgba(15,23,42,0.1)] transition-all hover:shadow-[0_48px_80px_-16px_rgba(15,23,42,0.12)]">
                 <div className="p-5 sm:p-8">
                    {/* min-w-0 + flex-1 so the airport names can shrink. These hold
                        full place names (DEHRADUN, GOVINDGHAT), not IATA codes. */}
                    <div className="flex items-start justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
                       <div className="min-w-0 flex-1 space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</p>
                          <h3 className="text-lg sm:text-3xl font-['Outfit'] font-black text-slate-950 break-words leading-tight">{route.originAirport}</h3>
                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{formatTimeLabel(route.departureTime)}</p>
                       </div>
                       <div className="flex shrink-0 flex-col items-center gap-2 sm:gap-3 pt-4">
                          <div className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-sky-50 text-sky-600 text-[9px] sm:text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
                             {route.durationMinutes}m
                          </div>
                          <div className="flex items-center gap-1.5 sm:gap-2 w-16 sm:w-28">
                             <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200" />
                             <div className="h-px flex-1 bg-slate-100" />
                             <div className="p-1.5 sm:p-2 shrink-0 rounded-xl bg-slate-50 text-sky-500 group-hover:rotate-12 transition-transform duration-500">
                                <PlaneTakeoff size={16} />
                             </div>
                             <div className="h-px flex-1 bg-slate-100" />
                             <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200" />
                          </div>
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Direct</p>
                       </div>
                       <div className="min-w-0 flex-1 text-right space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destination</p>
                          <h3 className="text-lg sm:text-3xl font-['Outfit'] font-black text-slate-950 break-words leading-tight">{route.destinationAirport}</h3>
                          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">{formatTimeLabel(route.arrivalTime)}</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="space-y-4">
                          <div className="relative">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Travel Date</label>
                            <div className="relative">
                               <CalendarDays size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                               <input
                                 type="date"
                                 value={travelDate}
                                 onChange={(e) => setTravelDate(e.target.value)}
                                 className="w-full bg-slate-50 rounded-2xl pl-9 sm:pl-12 pr-3 sm:pr-4 py-3.5 sm:py-4 text-sm font-black text-slate-950 outline-none border border-transparent focus:border-sky-200 transition-all"
                               />
                            </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Total Seats</label>
                          <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-2 h-[54px]">
                             <button 
                               onClick={() => handleSeatAdjust('decrement')}
                               className="h-10 w-10 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm active:scale-90 transition-all"
                             >
                               -
                             </button>
                             <span className="text-lg font-black">{seatCount}</span>
                             <button 
                               onClick={() => handleSeatAdjust('increment')}
                               className="h-10 w-10 rounded-xl bg-white text-slate-900 flex items-center justify-center shadow-sm active:scale-90 transition-all"
                             >
                               +
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Operator Bar */}
                 <div className="bg-slate-50 px-5 py-4 sm:px-8 sm:py-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 overflow-hidden">
                          {selectedAirway?.image ? <img src={selectedAirway.image} className="h-full w-full object-cover" /> : <PlaneTakeoff size={18} />}
                       </div>
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Operator</p>
                          <p className="text-[11px] font-black text-slate-950">{selectedAirway?.airlineName || 'Premium Heli'}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Per Seat</p>
                       <p className="text-base font-black text-sky-600">{formatCurrency(selectedAirway?.basePrice)}</p>
                    </div>
                 </div>
              </div>

              {/* Operator Selector (if multiple) */}
              {routeAirways.length > 1 && (
                <div className="space-y-3">
                   <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] ml-1">Alternative Operators</h3>
                   <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                      {routeAirways.map((airway) => (
                        <button
                          key={airway.id}
                          onClick={() => setSelectedAirwayId(airway.id)}
                          className={`min-w-[200px] rounded-[28px] p-4 border-2 transition-all ${
                            selectedAirwayId === airway.id 
                            ? 'bg-white border-emerald-700 shadow-xl' 
                            : 'bg-white border-transparent shadow-sm'
                          }`}
                        >
                           <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                 {airway.image ? <img src={airway.image} className="h-full w-full object-cover" /> : <PlaneTakeoff size={16} />}
                              </div>
                              <div className="text-left">
                                 <p className="text-[11px] font-black text-slate-950 truncate max-w-[100px]">{airway.airlineName}</p>
                                 <p className="text-[10px] font-bold text-sky-600 mt-0.5">{formatCurrency(airway.basePrice)}</p>
                              </div>
                           </div>
                        </button>
                      ))}
                   </div>
                </div>
              )}

              <button
                onClick={nextStep}
                className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-[24px] sm:rounded-[28px] bg-emerald-700 py-4 sm:py-5 text-white shadow-2xl shadow-slate-950/20 active:scale-[0.98] transition-all group"
              >
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-widest">Continue to Passengers</span>
                <ChevronRight size={18} className="shrink-0 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Contact Information */}
              <div className="rounded-[32px] sm:rounded-[40px] bg-white border border-slate-100 p-5 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-3">
                   <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center">
                      <UserRound size={22} />
                   </div>
                   <div>
                      <h3 className="text-base font-black text-slate-950 uppercase tracking-widest">Contact Info</h3>
                      <p className="text-[11px] font-bold text-slate-400 mt-1">E-ticket will be sent here</p>
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                      <div className="relative">
                         <UserRound size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                         <input 
                           value={formData.customerName}
                           onChange={(e) => setField('customerName', e.target.value)}
                           placeholder="Primary passenger"
                           className="w-full bg-slate-50 rounded-2xl pl-9 sm:pl-12 pr-3 sm:pr-4 py-3.5 sm:py-4 text-sm font-black text-slate-950 outline-none border border-transparent focus:border-violet-200 transition-all"
                         />
                      </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                         <div className="relative">
                            <Phone size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input 
                              value={formData.customerPhone}
                              onChange={(e) => setField('customerPhone', e.target.value)}
                              placeholder="9876..."
                              className="w-full bg-slate-50 rounded-2xl pl-9 sm:pl-12 pr-3 sm:pr-4 py-3.5 sm:py-4 text-sm font-black text-slate-950 outline-none border border-transparent focus:border-violet-200 transition-all"
                            />
                         </div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                         <div className="relative">
                            <FileText size={16} className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input 
                              value={formData.customerEmail}
                              onChange={(e) => setField('customerEmail', e.target.value)}
                              placeholder="alex@.."
                              className="w-full bg-slate-50 rounded-2xl pl-9 sm:pl-12 pr-3 sm:pr-4 py-3.5 sm:py-4 text-sm font-black text-slate-950 outline-none border border-transparent focus:border-violet-200 transition-all"
                            />
                         </div>
                      </div>
                   </div>
                </div>
              </div>

              {/* Passenger Roster */}
              <div className="rounded-[32px] sm:rounded-[40px] bg-white border border-slate-100 p-5 sm:p-8 shadow-sm space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                       <Users size={22} />
                    </div>
                    <div>
                       <h3 className="text-base font-black text-slate-950 uppercase tracking-widest">Passenger List</h3>
                       <p className="text-[11px] font-bold text-slate-400 mt-1">Exact name as per ID</p>
                    </div>
                 </div>

                 <div className="space-y-3">
                    {passengerNames.map((name, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="relative"
                      >
                         <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
                            {idx + 1}
                         </div>
                         <input 
                           value={name}
                           onChange={(e) => setPassengerName(idx, e.target.value)}
                           placeholder={`Passenger ${idx + 1} Full Name`}
                           className="w-full bg-slate-50 rounded-2xl pl-14 pr-4 py-4 text-sm font-black text-slate-950 outline-none border border-transparent focus:border-emerald-200 transition-all shadow-inner"
                         />
                      </motion.div>
                    ))}
                 </div>
              </div>

              <div className="flex gap-4">
                 <button 
                   onClick={prevStep}
                   className="h-14 sm:h-[64px] px-5 sm:px-8 rounded-[24px] sm:rounded-[28px] bg-white border border-slate-100 text-slate-900 font-black text-xs sm:text-sm uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                 >
                    Back
                 </button>
                 <button
                   onClick={nextStep}
                   className="flex-1 h-[64px] rounded-[28px] bg-emerald-700 text-white font-black uppercase tracking-widest active:scale-95 transition-all shadow-2xl shadow-slate-950/20"
                 >
                    Next Step
                 </button>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Fare Summary Card */}
              <div className="rounded-[32px] sm:rounded-[40px] bg-white border border-slate-100 p-5 sm:p-8 shadow-sm space-y-8">
                 <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-slate-950 uppercase tracking-widest">Fare Summary</h3>
                    <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                       <CreditCard size={18} />
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center gap-3 text-[13px] sm:text-sm font-bold text-slate-500">
                       <div className="flex min-w-0 items-center gap-2">
                          <Users size={14} className="shrink-0 text-slate-300" />
                          <span className="truncate">Seats ({seatCount} x {formatCurrency(selectedAirway?.basePrice)})</span>
                       </div>
                       <span className="shrink-0 text-slate-950">{formatCurrency(subtotalFare)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-3 text-[13px] sm:text-sm font-bold text-slate-500">
                       <div className="flex min-w-0 items-center gap-2">
                          <Zap size={14} className="shrink-0 text-slate-300" />
                          <span className="truncate">Service Tax ({serviceTaxPercent}%)</span>
                       </div>
                       <span className="shrink-0 text-slate-950">{formatCurrency(serviceTaxAmount)}</span>
                    </div>
                    <div className="h-px bg-slate-50" />
                    <div className="flex justify-between items-end gap-3">
                       <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Payable</p>
                          <p className="text-2xl sm:text-3xl font-['Outfit'] font-black text-slate-950 mt-1 break-words">{formatCurrency(totalFare)}</p>
                       </div>
                       <div className="shrink-0 px-3 sm:px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-1.5 sm:gap-2">
                          <ShieldCheck size={14} className="shrink-0 text-emerald-600" />
                          <span className="text-[9px] sm:text-[10px] font-black text-emerald-700 uppercase tracking-wider">Secured</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Flight Summary Box */}
              <div className="rounded-[32px] bg-emerald-700 p-6 text-white overflow-hidden relative">
                 <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <PlaneTakeoff size={16} className="text-sky-300" />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-widest text-sky-300">{route.routeName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold">
                       <span>{formatTravelDate(travelDate)}</span>
                       <span className="text-white/60">{formatTimeLabel(route.departureTime)}</span>
                    </div>
                 </div>
                 <PlaneTakeoff size={100} className="absolute -right-8 -bottom-8 text-white/5 rotate-12" />
              </div>

              <div className="flex gap-4">
                 <button 
                   onClick={prevStep}
                   className="h-14 sm:h-[64px] px-5 sm:px-8 rounded-[24px] sm:rounded-[28px] bg-white border border-slate-100 text-slate-900 font-black text-xs sm:text-sm uppercase tracking-widest active:scale-95 transition-all shadow-sm"
                 >
                    Back
                 </button>
                 <button
                   onClick={handleSubmit}
                   disabled={submitting || !activePaymentGateway}
                   className="flex-1 h-14 sm:h-[64px] relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-emerald-700 text-white font-black text-xs sm:text-sm uppercase tracking-widest active:scale-95 transition-all shadow-2xl shadow-slate-950/20 disabled:opacity-50"
                 >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                       {submitting ? (
                         <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                       ) : (
                         <Sparkles size={18} className="text-sky-300" />
                       )}
                       <span>{submitting ? 'Authenticating...' : `Confirm & Pay`}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent animate-pulse" />
                 </button>
              </div>

              {!activePaymentGateway && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                   <AlertCircle size={18} className="text-amber-600 shrink-0" />
                   <p className="text-[10px] font-bold text-amber-800">Payments are currently restricted. Please contact support.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Support Section */}
        <div className="mt-12 text-center">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Need help with booking?</p>
           <div className="mt-4 flex items-center justify-center gap-6">
              <button className="flex flex-col items-center gap-2">
                 <div className="h-12 w-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm active:scale-90 transition-all">
                    <Phone size={18} />
                 </div>
                 <span className="text-[9px] font-black text-slate-950 uppercase tracking-widest">Call</span>
              </button>
              <button className="flex flex-col items-center gap-2">
                 <div className="h-12 w-12 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm active:scale-90 transition-all">
                    <Info size={18} />
                 </div>
                 <span className="text-[9px] font-black text-slate-950 uppercase tracking-widest">Guide</span>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AirwaysRouteBooking;
