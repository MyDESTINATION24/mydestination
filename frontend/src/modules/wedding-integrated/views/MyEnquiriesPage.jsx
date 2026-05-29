import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, ArrowLeft, Calendar, Mail, Phone, MapPin, Loader2, Sparkles, X, CheckCircle2 } from "lucide-react";
import { weddingEnquiryService, platformSettingsService } from "../../../services/apiService";
import ScrollReveal from "../components/ScrollReveal";
import toast from 'react-hot-toast';
import { format } from "date-fns";

const MyEnquiriesPage = () => {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [platformSettings, setPlatformSettings] = useState(null);
  const [bookingAmount, setBookingAmount] = useState('');

  useEffect(() => {
    fetchEnquiries();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await platformSettingsService.getSettings();
      setPlatformSettings(data);
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      const data = await weddingEnquiryService.getMyEnquiries();
      setEnquiries(data || []);
    } catch (error) {
      console.error("Failed to fetch enquiries", error);
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setShowPaymentModal(true);
    setTermsAccepted(false);
    setBookingAmount('');
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedEnquiry(null);
    setTermsAccepted(false);
    setProcessing(false);
  };

  const getCalculatedPlatformFee = () => {
    if (!platformSettings) return selectedEnquiry?.platformFee || 499;
    if (platformSettings.platformFeeType === 'percentage') {
      return Math.round((Number(bookingAmount) || 0) * (platformSettings.platformFee / 100));
    }
    return platformSettings.platformFee;
  };

  const processPayment = async () => {
    if (!termsAccepted || !selectedEnquiry) return;
    
    if (platformSettings?.platformFeeType === 'percentage' && (!bookingAmount || Number(bookingAmount) <= 0)) {
      toast.error("Please enter a valid total booking amount.");
      return;
    }
    
    setProcessing(true);
    const toastId = toast.loading("Initiating Payment...", { duration: 10000 });
    
    try {
      // First optionally save the bookingAmount using existing API if needed
      if (platformSettings?.platformFeeType === 'percentage') {
         await weddingEnquiryService.confirmBooking(selectedEnquiry._id, { bookingAmount: Number(bookingAmount) });
      }

      // Initiate PhonePe Payment
      const res = await weddingEnquiryService.payAndBookEnquiry(selectedEnquiry._id);
      
      if (res.success && res.url) {
        window.location.href = res.url; // Redirect to PhonePe
      } else {
        throw new Error("Invalid payment URL received.");
      }
    } catch (error) {
      toast.error(error.message || "Failed to initiate payment.", { id: toastId });
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "dd MMM yyyy");
    } catch (e) {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Booked":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "Contacted":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "Lost":
        return "bg-rose-50 text-rose-600 border-rose-100";
      case "New":
      default:
        return "bg-amber-50 text-amber-600 border-amber-100";
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafb] pb-20 pt-8 md:pt-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-6 md:mb-10">
          <button 
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4 md:mb-6 group"
          >
            <div className="p-2 rounded-full border border-slate-200 group-hover:border-primary transition-colors bg-white shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back
          </button>

          <ScrollReveal>
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl md:text-5xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                My Enquiries
              </h1>
              <p className="text-muted-foreground font-medium">
                Keep track of your conversations with destination planners.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* List of Enquiries */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-slate-500 font-medium">Fetching your enquiries...</p>
          </div>
        ) : enquiries.length > 0 ? (
          <div className="space-y-6">
            {enquiries.map((enq, index) => (
              <ScrollReveal key={enq._id} delay={index * 100}>
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 overflow-hidden relative group hover:shadow-xl transition-shadow duration-500">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-primary mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                          {enq.destination || "Multiple"} Destination
                        </span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Enquiry for {formatDate(enq.weddingDate) || "TBD"}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        Submitted on {new Date(enq.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className={`self-start md:self-auto px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-wider ${getStatusBadge(enq.status)}`}>
                      {enq.status || "New"}
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg"><Calendar className="w-4 h-4"/></div>
                        <span>Date: <span className="text-slate-900 font-semibold">{formatDate(enq.weddingDate) || "Not Specified"}</span></span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg"><Mail className="w-4 h-4"/></div>
                        <span>{enq.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                        <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg"><Phone className="w-4 h-4"/></div>
                        <span>{enq.phone}</span>
                      </div>
                      {enq.services && enq.services.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {enq.services.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-bold rounded-md border border-primary/10">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 h-full">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-2">
                        <MessageSquare className="w-4 h-4" /> Message
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-primary/20 pl-3">
                        "{enq.message || "No additional notes provided."}"
                      </p>
                    </div>
                    
                    {enq.status !== 'Booked' && enq.paymentStatus !== 'Paid' && (
                      <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-slate-100 flex justify-end">
                        <button 
                          onClick={() => openPaymentModal(enq)}
                          className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm"
                        >
                           Confirm & Pay Platform Fee
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-inner">
             <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xl text-foreground font-black mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              No enquiries sent yet
            </p>
            <p className="text-muted-foreground font-medium mb-6">
              Start planning your dream wedding today!
            </p>
            <Link 
              to="/wedding/enquiry"
              className="inline-block px-8 py-3 rounded-full bg-primary text-white font-bold text-sm shadow-xl shadow-primary/20 hover:scale-105 transition-all"
            >
              Send Your First Enquiry
            </Link>
          </div>
        )}
      </div>

      {/* Checkout / Payment Modal */}
      {showPaymentModal && selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-lg text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                Complete Booking
              </h3>
              <button 
                onClick={closePaymentModal}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                disabled={processing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Booking Summary</p>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-600">Vendor/Venue</span>
                  <span className="text-sm font-bold text-slate-900">{selectedEnquiry.targetId?.name || 'Selected Vendor'}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-slate-600">Event Date</span>
                  <span className="text-sm font-bold text-slate-900">{formatDate(selectedEnquiry.weddingDate) || 'TBD'}</span>
                </div>
                <div className="h-px w-full bg-slate-200 my-3" />
                {platformSettings?.platformFeeType === 'percentage' && (
                  <div className="mb-4">
                    <label className="text-sm font-bold text-slate-700 mb-1 block">Total Booking Deal Amount (₹)</label>
                    <input 
                      type="number" 
                      value={bookingAmount}
                      onChange={(e) => setBookingAmount(e.target.value)}
                      placeholder="Enter final agreed amount"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-base font-black text-slate-800">
                    Platform Fee {platformSettings?.platformFeeType === 'percentage' && `(${platformSettings.platformFee}%)`}
                  </span>
                  <span className="text-lg font-black text-primary">₹{getCalculatedPlatformFee()}</span>
                </div>
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center pt-0.5">
                  <input 
                    type="checkbox" 
                    className="peer sr-only"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    disabled={processing}
                  />
                  <div className="w-5 h-5 rounded border-2 border-slate-300 peer-checked:border-primary peer-checked:bg-primary transition-all flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100" />
                  </div>
                </div>
                <span className="text-xs text-slate-500 font-medium leading-relaxed group-hover:text-slate-700 transition-colors">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms & Conditions</a>. I understand that this platform fee is non-refundable and will finalize my booking with the vendor.
                </span>
              </label>
            </div>

            {/* Footer */}
            <div className="px-6 py-5 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                onClick={closePaymentModal}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200 transition-colors"
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                onClick={processPayment}
                disabled={!termsAccepted || processing}
                className={`flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                  termsAccepted && !processing ? 'bg-primary hover:bg-primary/90 hover:scale-[1.02]' : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Proceed to Pay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyEnquiriesPage;
