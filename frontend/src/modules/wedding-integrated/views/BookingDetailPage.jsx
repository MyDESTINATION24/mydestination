import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Calendar, MapPin, Users,
  BadgeCheck, Clock, AlertCircle,
  Phone, Loader2
} from "lucide-react";
import { formatPrice } from "../data/weddingData";
import ScrollReveal from "../components/ScrollReveal";
import { api } from "../../../services/apiService";

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80';

const getStatusStyles = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'confirmed':
    case 'booked':
      return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: BadgeCheck, border: 'border-emerald-100' };
    case 'new':
    case 'pending':
    case 'contacted':
      return { bg: 'bg-amber-50', text: 'text-amber-600', icon: Clock, border: 'border-amber-100' };
    case 'lost':
    case 'cancelled':
      return { bg: 'bg-rose-50', text: 'text-rose-600', icon: AlertCircle, border: 'border-rose-100' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-600', icon: Clock, border: 'border-slate-100' };
  }
};

const BookingDetailPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api.get('/wedding/my-enquiries')
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setBooking(list.find((b) => String(b._id) === String(bookingId)) || null);
      })
      .catch(() => { if (active) setBooking(null); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Booking Not Found</h2>
          <button onClick={() => navigate('/wedding/bookings')} className="text-primary font-bold underline">
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const styles = getStatusStyles(booking.status);
  const StatusIcon = styles.icon;

  const target = booking.targetId && typeof booking.targetId === 'object' ? booking.targetId : null;
  const venueName = booking.targetType === 'Venue'
    ? target?.name
    : booking.targetType === 'Vendor'
      ? target?.companyName
      : 'Destination Wedding';
  const contactName = booking.targetType === 'Vendor'
    ? target?.name
    : booking.targetType === 'Venue'
      ? 'Venue Directly'
      : 'Self Planned';
  const image = target?.coverImage || target?.images?.[0] || FALLBACK_IMAGE;
  const amount = Number(booking.actualAmount) > 0 ? formatPrice(Number(booking.actualAmount)) : (booking.budget || 'Not specified');

  return (
    <div className="min-h-screen bg-[#fafafb] pb-24">
      <div className="bg-white border-b border-slate-100 sticky top-0 md:static z-20">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/wedding/bookings')}
            className="p-2.5 rounded-full hover:bg-slate-50 transition-colors border border-slate-100"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg md:text-xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
              Booking Details
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              ID: {String(booking._id).slice(-8).toUpperCase()}
            </p>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6 space-y-6">
        <ScrollReveal>
          <div className={`p-5 rounded-[2rem] border ${styles.bg} ${styles.border} flex items-center gap-4`}>
            <div className={`p-3 rounded-2xl bg-white shadow-sm ${styles.text}`}>
              <StatusIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`font-black text-sm uppercase tracking-wider ${styles.text}`}>
                {booking.status || 'Pending'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Enquiry submitted {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ScrollReveal>
              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-32 h-32 rounded-2xl overflow-hidden ring-4 ring-slate-50 shrink-0">
                    <img src={image} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      {booking.destination && (
                        <div className="flex items-center gap-1.5 text-primary mb-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-widest">{booking.destination}</span>
                        </div>
                      )}
                      <h3 className="text-2xl font-black text-foreground leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {venueName || 'Wedding Enquiry'}
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl pr-4 border border-slate-50">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{booking.weddingDate || 'Date flexible'}</span>
                      </div>
                      {booking.guestCount && (
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl pr-4 border border-slate-50">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-600">{booking.guestCount} Guests</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {booking.message && (
              <ScrollReveal delay={100}>
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                  <h3 className="text-xs font-black mb-4 uppercase tracking-widest text-slate-400">Your Requirements</h3>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{booking.message}</p>
                </div>
              </ScrollReveal>
            )}
          </div>

          <div className="space-y-6">
            <ScrollReveal delay={200}>
              <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-slate-400">Booking Summary</h3>
                <dl className="space-y-4 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400 font-bold">Budget</dt>
                    <dd className="font-black text-foreground text-right">{amount}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400 font-bold">Contact</dt>
                    <dd className="font-black text-foreground text-right">{contactName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400 font-bold">Payment</dt>
                    <dd className="font-black text-foreground text-right">{booking.paymentStatus || 'Pending'}</dd>
                  </div>
                </dl>

                {target?.phone && (
                  <a
                    href={`tel:${String(target.phone).replace(/[^\d+]/g, '')}`}
                    className="mt-6 w-full py-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 text-slate-600 no-underline"
                  >
                    <Phone className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Call</span>
                  </a>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailPage;
