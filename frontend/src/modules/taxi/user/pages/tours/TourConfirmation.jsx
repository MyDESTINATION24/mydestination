import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Compass, Calendar, User, Heart, Home, ArrowRight, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { getMyTourBooking } from '../../services/toursService';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const TourConfirmation = () => {
  const navigate = useNavigate();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const data = await getMyTourBooking(bookingId);
        setBooking(data);
      } catch {
        toast.error('Failed to load reservation receipt');
      } finally {
        setLoading(false);
      }
    };
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  if (loading || !booking) {
    return (
      <div className="flex h-screen max-w-lg mx-auto items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <Compass size={40} className="animate-spin text-emerald-500 mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading receipt...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F8FAFC_0%,#F1F5F9_50%,#E2E8F0_100%)] pb-12 mx-auto w-full max-w-lg lg:max-w-2xl relative overflow-hidden font-sans">
      
      {/* Background Glows */}
      <div className="absolute top-[-40px] right-[-30px] h-48 w-48 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute top-80 left-[-40px] h-48 w-48 rounded-full bg-indigo-100/40 blur-3xl pointer-events-none" />

      <div className="px-6 pt-16 pb-6 space-y-8 flex flex-col items-center">
        
        {/* Animated Check Bubble */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          className="w-20 h-20 rounded-[28px] bg-emerald-500 border-4 border-white flex items-center justify-center text-white shadow-xl shadow-emerald-500/20"
        >
          <Check size={36} strokeWidth={4} />
        </motion.div>

        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-1.5"
        >
          <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Yatra Reserved!</h2>
          <p className="text-xs font-semibold text-slate-500">Your helicopter pilgrim tour booking is confirmed.</p>
        </motion.div>

        {/* Ticket Card */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="w-full bg-white rounded-[32px] border border-slate-100 shadow-2xl relative overflow-hidden p-6 space-y-6"
        >
          {/* Top Notch Cuts for Ticket Look */}
          <div className="absolute top-1/2 left-[-12px] -translate-y-1/2 h-6 w-6 rounded-full bg-slate-100 border-r border-slate-100/50" />
          <div className="absolute top-1/2 right-[-12px] -translate-y-1/2 h-6 w-6 rounded-full bg-slate-100 border-l border-slate-100/50" />

          {/* Ticket Header */}
          <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
            <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
              <Compass size={22} className="animate-spin-slow" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pilgrim Ticket</p>
              <h3 className="text-sm font-black text-slate-950">{booking.tourName}</h3>
            </div>
          </div>

          {/* Ticket details */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs font-semibold text-slate-500">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Reservation Code</p>
              <p className="text-sm font-black text-slate-900 mt-1 uppercase tracking-tight">{booking.bookingCode}</p>
            </div>
            
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Departure Date</p>
              <div className="flex items-center gap-1.5 mt-1 text-slate-950">
                <Calendar size={13} className="text-indigo-600" />
                <span className="text-sm font-black">
                  {booking.travelDate ? new Date(booking.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Main Contact</p>
              <div className="flex items-center gap-1.5 mt-1 text-slate-950">
                <User size={13} className="text-indigo-600" />
                <span className="text-xs font-black truncate max-w-[130px]">{booking.customerName}</span>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Group Size</p>
              <p className="text-xs font-black text-slate-900 mt-1">{booking.numberOfPassengers} Travelers</p>
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-4 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Settled Status</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-600">{booking.paymentStatus}</span>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Price Paid</p>
                <p className="text-lg font-black text-indigo-600 tracking-tight mt-1">
                  ₹{Number(booking.totalFare || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Passenger Roster */}
          {booking.passengerNames && booking.passengerNames.length > 0 && (
            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Traveler Roster</p>
              <div className="grid grid-cols-2 gap-2">
                {booking.passengerNames.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </motion.div>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full space-y-3"
        >
          <button
            onClick={() => navigate('/taxi/user')}
            className="w-full h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-emerald-500 transition active:scale-95"
          >
            <Home size={14} />
            Back to Dashboard
          </button>
        </motion.div>

      </div>

    </div>
  );
};

export default TourConfirmation;
