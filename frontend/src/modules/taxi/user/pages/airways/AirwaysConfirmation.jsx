import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  Phone,
  PlaneTakeoff,
  Ticket,
  Users,
  Download,
  Share2,
  ChevronRight,
  ShieldCheck,
  Clock3,
  Info,
  Sparkles,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { userService } from '../../services/userService';

// Rounded, matching the sector cards and the booking screen.
const formatCurrency = (value) => `Rs. ${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

const formatTravelDate = (value) => {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) {
    return 'Travel date pending';
  }
  return parsed.toLocaleString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatTimeLabel = (value = '') => {
  const normalized = String(value || '').trim();
  if (!normalized) return '--';

  const parsed = new Date(`2000-01-01T${normalized}`);
  if (Number.isNaN(parsed.getTime())) return normalized;

  return parsed.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const AirwaysConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams();
  const [loading, setLoading] = useState(!location.state?.booking);
  const [booking, setBooking] = useState(location.state?.booking || null);

  useEffect(() => {
    if (booking) return;

    const loadBooking = async () => {
      try {
        setLoading(true);
        const nextBooking = await userService.getAirwayBooking(bookingId);
        if (!nextBooking) {
          toast.error('Booking ticket not found.');
          navigate('/taxi/user/airways', { replace: true });
          return;
        }
        setBooking(nextBooking);
      } catch (error) {
        console.error(error);
        toast.error('Could not load the helicopter ticket.');
        navigate('/taxi/user/airways', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [booking, bookingId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
         <div className="text-center">
            <div className="h-16 w-16 border-4 border-slate-100 border-t-sky-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Generating Ticket...</p>
         </div>
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32 overflow-x-hidden overflow-y-auto" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Premium Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 px-5 py-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/taxi/user/airways')}
            className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-slate-50 text-slate-700 active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="text-center">
             <h1 className="text-[11px] font-black text-slate-950 uppercase tracking-[0.25em]">Flight Pass</h1>
             <p className="text-[9px] font-bold text-sky-600 mt-0.5 uppercase tracking-widest">Confirmed</p>
          </div>
          <button className="h-11 w-11 rounded-[18px] bg-slate-50 flex items-center justify-center text-slate-600">
            <Share2 size={18} />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-lg lg:max-w-2xl px-5 py-8 lg:py-12">
        {/* Success Header */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center text-center mb-10"
        >
          <div className="relative">
             <div className="h-24 w-24 rounded-[40px] bg-emerald-700 flex items-center justify-center text-white shadow-2xl shadow-slate-950/20">
                <CheckCircle2 size={44} className="text-white" />
             </div>
             <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-sky-500 flex items-center justify-center text-white border-4 border-[#F8FAFC]">
                <Sparkles size={14} />
             </div>
          </div>
          <h2 className="mt-8 text-3xl font-['Outfit'] font-black text-slate-950 leading-tight">Sky's the Limit!</h2>
          <p className="mt-2 text-sm font-bold text-slate-400">Your helicopter booking is confirmed.</p>
        </motion.div>

        {/* Premium Boarding Pass */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative filter drop-shadow-[0_32px_64px_rgba(15,23,42,0.12)]"
        >
          {/* Main Ticket Body */}
          <div className="bg-white rounded-[32px] sm:rounded-[48px] overflow-hidden">
             {/* Header Section */}
             <div className="p-5 pb-8 sm:p-8 sm:pb-10 border-b border-dashed border-slate-100 relative">
                <div className="flex items-center justify-between gap-3 mb-6 sm:mb-8">
                   <div className="flex min-w-0 items-center gap-3">
                      <div className="h-11 w-11 sm:h-12 sm:w-12 shrink-0 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-sm">
                         <PlaneTakeoff size={24} />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</p>
                         <p className="text-[13px] font-black text-slate-950 mt-0.5 truncate">{booking.airwayName}</p>
                      </div>
                   </div>
                   <div className="shrink-0 text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flight</p>
                      <p className="text-[13px] font-black text-sky-600 mt-0.5">{booking.flightNumber}</p>
                   </div>
                </div>

                {/* min-w-0 lets the name columns shrink: flex children default to
                    min-width:auto and would otherwise force the row wider than
                    the screen. Airports here are full place names, not IATA codes. */}
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                   <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xl sm:text-4xl font-['Outfit'] font-black text-slate-950 leading-none break-words">{booking.originAirport}</p>
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] break-words">{booking.routeName.split(' to ')[0]}</p>
                   </div>
                   <div className="flex shrink-0 flex-col items-center gap-2 w-14 sm:w-[120px] pt-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 w-full">
                         <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200" />
                         <div className="h-px flex-1 bg-slate-100" />
                         <Zap size={14} className="shrink-0 text-sky-500" />
                         <div className="h-px flex-1 bg-slate-100" />
                         <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-slate-200" />
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.15em] sm:tracking-[0.2em]">Non-Stop</span>
                   </div>
                   <div className="min-w-0 flex-1 text-right space-y-1">
                      <p className="text-xl sm:text-4xl font-['Outfit'] font-black text-slate-950 leading-none break-words">{booking.destinationAirport}</p>
                      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em] break-words">{booking.routeName.split(' to ')[1]}</p>
                   </div>
                </div>

                {/* Notches */}
                <div className="absolute -bottom-6 -left-6 h-12 w-12 rounded-full bg-[#F8FAFC]" />
                <div className="absolute -bottom-6 -right-6 h-12 w-12 rounded-full bg-[#F8FAFC]" />
             </div>

             {/* Details Section */}
             <div className="p-5 pt-8 sm:p-8 sm:pt-10 space-y-6 sm:space-y-8">
                <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-y-8">
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Departure</p>
                      <div className="flex items-center gap-2 mt-1">
                         <CalendarDays size={14} className="shrink-0 text-slate-300" />
                         <p className="text-sm font-black text-slate-950 truncate">{formatTravelDate(booking.travelDate)}</p>
                      </div>
                   </div>
                   <div className="min-w-0 text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                         <Clock3 size={14} className="shrink-0 text-slate-300" />
                         <p className="text-sm font-black text-slate-950 truncate">{formatTimeLabel(booking.departureTime)}</p>
                      </div>
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passenger</p>
                      <div className="flex items-center gap-2 mt-1">
                         <UserRound size={14} className="shrink-0 text-slate-300" />
                         <p className="text-sm font-black text-slate-950 truncate">{booking.customerName}</p>
                      </div>
                   </div>
                   <div className="min-w-0 text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seats</p>
                      <div className="flex items-center justify-end gap-2 mt-1">
                         <Users size={14} className="shrink-0 text-slate-300" />
                         <p className="text-sm font-black text-slate-950 truncate">{booking.seatCount} Seat(s)</p>
                      </div>
                   </div>
                </div>

                <div className="p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] bg-slate-50 flex items-center justify-between gap-3 border border-slate-100">
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Booking Code</p>
                      <p className="text-sm sm:text-base font-black text-slate-950 mt-1 break-all">#{booking.bookingCode}</p>
                   </div>
                   <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 bg-white rounded-2xl border border-slate-200 flex items-center justify-center p-2">
                      <Ticket size={32} className="text-slate-100" />
                   </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Fare</p>
                      <p className="text-2xl sm:text-3xl font-['Outfit'] font-black text-sky-600 mt-1 break-words">{formatCurrency(booking.totalFare)}</p>
                   </div>
                   <div className="shrink-0 text-right">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Payment Status</p>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                         <ShieldCheck size={12} />
                         Paid
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="mt-12 space-y-4">
           <button className="w-full h-16 rounded-[28px] bg-emerald-700 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-slate-950/20 active:scale-95 transition-all flex items-center justify-center gap-3">
              <Download size={20} />
              Download Ticket
           </button>
           <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/taxi/user/airways')}
                className="h-14 rounded-[24px] bg-white border border-slate-100 text-slate-900 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
              >
                 Book Another
              </button>
              <button 
                onClick={() => navigate('/taxi/user')}
                className="h-14 rounded-[24px] bg-white border border-slate-100 text-slate-900 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
              >
                 Dashboard
              </button>
           </div>
        </div>

        {/* Important Info */}
        <section className="mt-12 space-y-6">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                 <Info size={18} />
              </div>
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-widest">Travel Advisory</h3>
           </div>

           <div className="space-y-4">
              <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm flex items-start gap-4">
                 <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                    <Clock3 size={16} />
                 </div>
                 <div>
                    <p className="text-sm font-black text-slate-950">Reporting Time</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 leading-relaxed">Reach the helipad 45 minutes prior. Late arrivals may result in seat forfeiture.</p>
                 </div>
              </div>
              <div className="p-6 rounded-[32px] bg-white border border-slate-100 shadow-sm flex items-start gap-4">
                 <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                 </div>
                 <div>
                    <p className="text-sm font-black text-slate-950">Mandatory ID</p>
                    <p className="text-[11px] font-bold text-slate-400 mt-1 leading-relaxed">Original Government ID is required for verification at the helipad security gate.</p>
                 </div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default AirwaysConfirmation;
