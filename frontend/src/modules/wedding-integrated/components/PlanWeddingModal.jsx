import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronDown } from "lucide-react";
import { weddingEnquiryService } from "../../../services/apiService";
import toast from "react-hot-toast";

const PlanWeddingModal = ({ isOpen, onClose, initialLocation = "", targetId, targetType = "General" }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    eventMonth: "",
    eventLocation: initialLocation,
    venueDecided: "no",
    whatsappUpdates: true,
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const locations = ["Goa", "Udaipur", "Jaipur", "Kerala", "Jim Corbett", "Rishikesh"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        name: formData.fullName,
        email: formData.email || undefined,
        phone: formData.phone,
        weddingDate: formData.eventMonth ? new Date(2026, months.indexOf(formData.eventMonth), 1) : null,
        message: formData.description,
        targetType,
        targetId,
        budget: "Flexible"
      };

      await weddingEnquiryService.createEnquiry(payload);
      toast.success("Enquiry sent successfully!");
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to send enquiry");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-500 overflow-hidden">
      <div className="relative w-full max-w-lg md:max-w-2xl bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden max-h-[95vh] animate-in slide-in-from-bottom duration-700 ease-out flex flex-col border border-white/20">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:top-8 md:right-8 p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-900 z-50"
        >
          <X className="w-4 h-4 md:w-5 h-5" />
        </button>

        <div className="flex-1 p-6 md:p-8 pt-8 md:pt-10 relative z-40">
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              Plan your wedding
            </h2>
            <p className="text-sm text-muted-foreground md:text-base">
              Fill in your details and we'll be in touch.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name & Phone Grid for Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] md:text-xs font-black mb-1.5 text-slate-400 uppercase tracking-widest">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter Name"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#ff7676]/20 focus:border-[#ff7676] transition-all text-sm placeholder:text-slate-400"
                  value={formData.fullName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z\s]*$/.test(val)) {
                      setFormData({...formData, fullName: val});
                    }
                  }}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] md:text-xs font-black mb-1.5 text-slate-400 uppercase tracking-widest">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="Enter Email"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#ff7676]/20 focus:border-[#ff7676] transition-all text-sm placeholder:text-slate-400"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-[10px] md:text-xs font-black mb-1.5 text-slate-400 uppercase tracking-widest">Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="Enter Phone"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#ff7676]/20 focus:border-[#ff7676] transition-all text-sm placeholder:text-slate-400"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            {/* Event Month & Location */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-[10px] md:text-xs font-black mb-1.5 text-slate-400 uppercase tracking-widest">Event Month</label>
                <div className="relative">
                  <select
                    required
                    className="w-full appearance-none px-4 pr-10 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#ff7676]/20 focus:border-[#ff7676] transition-all text-sm"
                    value={formData.eventMonth}
                    onChange={(e) => setFormData({...formData, eventMonth: e.target.value})}
                  >
                    <option value="" disabled>Select a Month</option>
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-black mb-1.5 text-slate-400 uppercase tracking-widest">Event Location</label>
                <div className="relative">
                  <select
                    required
                    className="w-full appearance-none px-4 pr-10 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#ff7676]/20 focus:border-[#ff7676] transition-all text-sm"
                    value={formData.eventLocation}
                    onChange={(e) => setFormData({...formData, eventLocation: e.target.value})}
                  >
                    <option value="" disabled>Select a Location</option>
                    {locations.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] md:text-xs font-black mb-1.5 text-slate-400 uppercase tracking-widest">Description</label>
              <textarea
                placeholder="Enter Description"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-100 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-[#ff7676]/20 focus:border-[#ff7676] transition-all text-sm placeholder:text-slate-400 min-h-[60px] resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            {/* Venue Decided */}
            <div>
              <p className="text-sm font-bold mb-3 text-slate-700">Have you already decided the venue?</p>
              <div className="flex gap-6">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.venueDecided === 'yes' ? 'border-[#ff7676] bg-[#ff7676]' : 'border-slate-200 group-hover:border-[#ff7676]'}`}>
                    {formData.venueDecided === 'yes' && <div className="w-2 h-2 rounded-full bg-white transition-all transform scale-100" />}
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    name="venue"
                    value="yes"
                    checked={formData.venueDecided === 'yes'}
                    onChange={() => setFormData({...formData, venueDecided: 'yes'})}
                  />
                  <span className="text-sm font-bold text-slate-600">Yes, I have</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${formData.venueDecided === 'no' ? 'border-[#ff7676] bg-[#ff7676]' : 'border-slate-200 group-hover:border-[#ff7676]'}`}>
                    {formData.venueDecided === 'no' && <div className="w-2 h-2 rounded-full bg-white transition-all transform scale-100" />}
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    name="venue"
                    value="no"
                    checked={formData.venueDecided === 'no'}
                    onChange={() => setFormData({...formData, venueDecided: 'no'})}
                  />
                  <span className="text-sm font-bold text-slate-600">Not yet</span>
                </label>
              </div>
            </div>

            {/* Submit Button Section */}
            <div className="pt-3 border-t border-slate-50 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${formData.whatsappUpdates ? 'bg-[#ff7676] border-[#ff7676]' : 'border-slate-200 group-hover:border-[#ff7676]'}`}
                  onClick={() => setFormData({...formData, whatsappUpdates: !formData.whatsappUpdates})}
                >
                  {formData.whatsappUpdates && <X className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-sm font-medium text-slate-500">Send me updates on WhatsApp</span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-2xl bg-[#ff7676] text-white font-black text-sm md:text-base uppercase tracking-widest shadow-xl shadow-red-200 transition-all transform ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#ef6666] hover:-translate-y-0.5 active:scale-95'}`}
              >
                {loading ? "Sending..." : "Get a consultation"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PlanWeddingModal;
