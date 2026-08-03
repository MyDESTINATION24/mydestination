import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Compass, Calendar, User, Phone, Mail, FileText, ArrowRight, UserPlus, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../../../shared/context/SettingsContext';
import {
  getUserTourById,
  createUserTourBooking,
  createUserTourBookingOrder,
  verifyUserTourBookingPayment,
} from '../../services/toursService';

const PHONEPE_PENDING_TOUR_KEY = 'taxi-tour-phonepe-booking';

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

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-400/5';
const labelClass = 'mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400';

const containerVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } }
};

const TourBooking = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [travelDate, setTravelDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('reserve');
  const [notes, setNotes] = useState('');
  const [passengerNames, setPassengerNames] = useState(['']);

  const { settings } = useSettings();
  const activePaymentGateway = settings.paymentGateway || null;
  const isTrek = tour?.category === 'trek';

  // PhonePe sends the customer back here with ?phonepe_txn=... The booking is
  // only created once the gateway confirms the payment actually completed.
  useEffect(() => {
    const merchantTransactionId = new URLSearchParams(window.location.search).get('phonepe_txn');
    if (!merchantTransactionId) return;

    const clearQuery = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('phonepe_txn');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    };

    const verify = async () => {
      let pending = null;
      try {
        pending = JSON.parse(window.sessionStorage.getItem(PHONEPE_PENDING_TOUR_KEY) || 'null');
      } catch {
        pending = null;
      }

      if (!pending || pending.tourId !== id) {
        clearQuery();
        toast.error('Could not restore your pending PhonePe booking details.');
        return;
      }

      setSubmitting(true);
      try {
        const result = await verifyUserTourBookingPayment({
          gateway: 'phone_pay',
          merchantTransactionId,
          ...pending,
        });

        if (result?.status === 'pending') {
          toast('Payment is still processing. Check My Bookings shortly.');
          return;
        }
        if (result?.status === 'failed') {
          toast.error('Payment was not completed.');
          return;
        }

        window.sessionStorage.removeItem(PHONEPE_PENDING_TOUR_KEY);
        toast.success('Booked and paid successfully.');
        navigate(`/taxi/user/tours/confirmation/${result.id}`, { state: { booking: result } });
      } catch (error) {
        toast.error(error?.message || 'Could not verify the PhonePe payment.');
      } finally {
        setSubmitting(false);
        clearQuery();
      }
    };

    verify();
  }, [id, navigate]);

  useEffect(() => {
    const loadTourAndProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserTourById(id);
        setTour(data);

        // Pre-fill from local user profile
        let stored = {};
        try {
          stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
        } catch {
          stored = {};
        }

        setCustomerName(stored.name || '');
        setCustomerPhone(stored.phone || '');
        setCustomerEmail(stored.email || '');
      } catch {
        toast.error('Failed to load package details');
        navigate('/taxi/user/tours');
      } finally {
        setLoading(false);
      }
    };
    loadTourAndProfile();
  }, [id, navigate]);

  // Server-derived, so the quote shown here always matches what gets charged.
  const tourDays = Number(tour?.durationDays) || 1;

  // Calculate pricing breakdown
  const invoice = useMemo(() => {
    if (!tour) return { base: 0, subtotal: 0, tax: 0, total: 0 };
    const base = Number(tour.price || 0);
    const count = passengerNames.length;
    
    // Subtotal: if per_day pricing frequency, multiply by tour days
    const subtotal = tour.priceType === 'per_day' 
      ? base * tourDays * count 
      : base * count;

    // Service tax / GST (5% standard)
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    return { base, subtotal, tax, total };
  }, [tour, tourDays, passengerNames.length]);

  const handlePassengerNameChange = (idx, value) => {
    const list = [...passengerNames];
    list[idx] = value;
    setPassengerNames(list);
  };

  const addPassenger = () => {
    setPassengerNames([...passengerNames, '']);
  };

  const removePassenger = (idx) => {
    if (passengerNames.length <= 1) return;
    const list = passengerNames.filter((_, i) => i !== idx);
    setPassengerNames(list);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!travelDate) {
      toast.error('Please select a travel departure date');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Please enter customer contact name');
      return;
    }

    const cleanedPassengers = passengerNames.filter(name => name.trim() !== '');
    if (cleanedPassengers.length === 0) {
      toast.error('Please add at least one traveler passenger name');
      return;
    }

    const bookingPayload = {
      tourId: tour.id,
      customerName,
      customerPhone,
      customerEmail,
      numberOfPassengers: passengerNames.length,
      travelDate,
      notes,
      passengerNames: cleanedPassengers,
    };

    try {
      setSubmitting(true);

      // Pay later: no gateway involved, booking is created straight away.
      if (paymentMethod !== 'online') {
        const res = await createUserTourBooking({ ...bookingPayload, paymentMethod: 'reserve' });
        toast.success(isTrek ? 'Trek reserved!' : 'Yatra reservation confirmed!');
        navigate(`/taxi/user/tours/confirmation/${res.id}`);
        return;
      }

      if (!activePaymentGateway) {
        throw new Error('No payment gateway is enabled in the admin panel right now.');
      }

      if (activePaymentGateway.slug === 'phone_pay') {
        const session = await createUserTourBookingOrder(bookingPayload);
        if (!session?.checkoutUrl) {
          throw new Error('Unable to start PhonePe payment');
        }

        // Stashed so the booking can be rebuilt when PhonePe redirects back.
        window.sessionStorage.setItem(PHONEPE_PENDING_TOUR_KEY, JSON.stringify(bookingPayload));
        window.location.assign(session.checkoutUrl);
        return;
      }

      if (activePaymentGateway.slug !== 'razor_pay') {
        throw new Error(`${activePaymentGateway.label} is enabled by admin, but tour checkout is not implemented for it yet.`);
      }

      if (!(await loadRazorpayScript())) {
        throw new Error('Razorpay SDK failed to load');
      }

      const order = await createUserTourBookingOrder(bookingPayload);
      if (!order?.keyId || !order?.orderId) {
        throw new Error('Unable to start payment');
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: tour.name,
        description: `${passengerNames.length} traveller${passengerNames.length === 1 ? '' : 's'}`,
        order_id: order.orderId,
        prefill: { name: customerName, email: customerEmail, contact: customerPhone },
        modal: { ondismiss: () => setSubmitting(false) },
        handler: async (response) => {
          try {
            const booking = await verifyUserTourBookingPayment({
              gateway: 'razor_pay',
              ...response,
              ...bookingPayload,
            });
            toast.success('Booked and paid successfully.');
            navigate(`/taxi/user/tours/confirmation/${booking.id}`, { state: { booking } });
          } catch (error) {
            toast.error(
              error?.message ||
              'Payment verification failed. Please contact support if payment was deducted.',
            );
          } finally {
            setSubmitting(false);
          }
        },
        theme: { color: '#10b981' },
      });

      rzp.on('payment.failed', (event) => {
        toast.error(event?.error?.description || event?.error?.reason || 'Payment failed');
        setSubmitting(false);
      });

      rzp.open();
      return;
    } catch (error) {
      toast.error(error?.message || 'Failed to register tour reservation');
    } finally {
      if (paymentMethod !== 'online') {
        setSubmitting(false);
      }
    }
  };

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F1F5F9_50%,#E2E8F0_100%)] pb-12 mx-auto w-full max-w-lg lg:max-w-3xl relative overflow-x-hidden font-sans">
      
      {/* Sticky Top Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
        <button
          onClick={() => navigate(`/taxi/user/tours/${tour.id}`)}
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-sm hover:bg-slate-50 transition active:scale-90"
        >
          <ChevronLeft size={18} className="text-slate-800" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest text-slate-900">
          Book Yatra
        </h1>
        <div className="w-10 h-10" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="px-6 py-6 space-y-6"
      >
        {/* Yatra Summary Card */}
        <div className="rounded-3xl bg-emerald-600 p-5 text-white shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="inline-flex rounded-lg bg-white/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white">
              Selected tour
            </span>
            <h2 className="text-base font-black tracking-tight">{tour.name}</h2>
            <p className="text-[10px] font-semibold text-slate-300">Duration: {tour.duration}</p>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 shrink-0">
            <Compass size={22} className="animate-spin-slow" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 1: Travel Date */}
          <div className="rounded-[32px] bg-white p-6 shadow-sm border border-slate-100 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Calendar size={16} className="text-indigo-600" />
                Select Travel Date
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Yatra departure date.</p>
            </div>
            
            <div className="relative">
              <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                className={inputClass}
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Section 2: Contact Info */}
          <div className="rounded-[32px] bg-white p-6 shadow-sm border border-slate-100 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <User size={16} className="text-indigo-600" />
                Contact Information
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Roster main traveler contact details.</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className={inputClass}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Main Traveler Full Name"
                  required
                />
              </div>

              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  className={inputClass}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Mobile Phone Number"
                />
              </div>

              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  className={inputClass}
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Email Address"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Passenger Roster */}
          <div className="rounded-[32px] bg-white p-6 shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Passenger Roster</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Names of all travelers in your group.</p>
              </div>
              <button
                type="button"
                onClick={addPassenger}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-2 text-[10px] font-black text-indigo-700 hover:bg-indigo-100 transition"
              >
                <UserPlus size={12} /> Add Person
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {passengerNames.map((name, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2 overflow-hidden"
                  >
                    <div className="relative flex-1">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        className={`${inputClass} pl-10`}
                        value={name}
                        onChange={(e) => handlePassengerNameChange(idx, e.target.value)}
                        placeholder={`Traveler #${idx + 1} Name`}
                        required
                      />
                    </div>
                    {passengerNames.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePassenger(idx)}
                        className="p-3 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Section 4: Payment Mode */}
          <div className="rounded-[32px] bg-white p-6 shadow-sm border border-slate-100 space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <CreditCard size={16} className="text-indigo-600" />
                Payment Method
              </h3>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">Select how you want to settle the payment.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'reserve', label: 'Book & Settle Later', desc: 'Reserve spot now', enabled: true },
                {
                  id: 'online',
                  label: 'Pay Now',
                  desc: activePaymentGateway?.label || 'Unavailable',
                  enabled: Boolean(activePaymentGateway),
                }
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  disabled={!method.enabled}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`rounded-2xl border p-4 text-left transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    paymentMethod === method.id
                      ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/5'
                      : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-black text-slate-900">{method.label}</p>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{method.desc}</p>
                </button>
              ))}
            </div>

            {!activePaymentGateway && (
              <p className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                No payment gateway is enabled in the admin panel, so online payment is unavailable. Bookings can still be reserved and settled later.
              </p>
            )}
          </div>

          {/* Section 5: Notes */}
          <div className="rounded-[32px] bg-white p-6 shadow-sm border border-slate-100 space-y-4">
            <label className="text-sm font-black text-slate-900 block">Special Notes / Requests</label>
            <div className="relative">
              <FileText size={16} className="absolute left-4 top-4 text-slate-400 pointer-events-none" />
              <textarea
                className={`${inputClass} min-h-20 pl-10`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. VIP Pooja timings, airport pickup coordinate coordinates, wheelchair support..."
              />
            </div>
          </div>

          {/* Interactive Invoice Billing Card */}
          <div className="rounded-[32px] bg-emerald-700 p-6 text-white shadow-2xl relative overflow-hidden space-y-4">
            <div className="absolute top-[-30px] right-[-30px] h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-white/10 p-2 text-indigo-400">
                <Compass size={16} />
              </div>
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-300">Yatra Fare Details</h4>
            </div>

            <div className="space-y-2.5 pt-2 text-xs font-semibold text-slate-300">
              <div className="flex justify-between">
                <span>Base Rate:</span>
                <span className="text-white">₹{invoice.base.toLocaleString('en-IN')} {tour.priceType === 'per_day' ? '/ day' : ''}</span>
              </div>
              {tour.priceType === 'per_day' && (
                <div className="flex justify-between">
                  <span>Yatra Duration:</span>
                  <span className="text-white">{tourDays} Days</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Total Travelers:</span>
                <span className="text-white">{passengerNames.length} Pax</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-2.5">
                <span>Subtotal:</span>
                <span className="text-white font-bold">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>GST / Airport Aviation tax (5%):</span>
                <span className="text-white">₹{invoice.tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t-2 border-dashed border-white/20 pt-3 text-sm font-black">
                <span className="text-emerald-400 uppercase tracking-widest">Total Payable:</span>
                <span className="text-white text-base">₹{invoice.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-emerald-500 transition active:scale-95 disabled:opacity-50"
          >
            {submitting ? 'Processing Yatra Reservation...' : 'Confirm & Reserve Yatra'}
            <ArrowRight size={14} />
          </button>

        </form>
      </motion.div>

    </div>
  );
};

export default TourBooking;
