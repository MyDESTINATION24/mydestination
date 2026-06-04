import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Loader2, ArrowLeft, Calendar, MapPin, IndianRupee,
  Users, Mail, Phone, MessageSquare, CheckCircle2, XCircle,
  Handshake, PartyPopper, Ban
} from "lucide-react";
import { weddingEnquiryService } from "../../../../../services/apiService";
import toast from "react-hot-toast";

// Status badge styles
const STATUS_STYLES = {
  New:       "bg-amber-50 text-amber-700 border-amber-200",
  Contacted: "bg-blue-50 text-blue-700 border-blue-200",
  Accepted:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  Booked:    "bg-purple-50 text-purple-700 border-purple-200",
  Completed: "bg-teal-50 text-teal-700 border-teal-200",
  Lost:      "bg-rose-50 text-rose-700 border-rose-200",
};

// Flow steps for progress indicator
const FLOW_STEPS = ["New", "Contacted", "Accepted", "Booked", "Completed"];

const LeadDetails = () => {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchLead();
  }, [id]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const data = await weddingEnquiryService.getLeadById(id);
      setLead(data);
    } catch (err) {
      toast.error("Failed to load lead details");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await weddingEnquiryService.updateLeadStatus(id, newStatus);
      setLead(prev => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Not specified";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    } catch { return dateStr; }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (!lead) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Lead not found</h2>
        <Link to="/wedding/vendor/leads" className="text-primary hover:underline font-medium">
          Back to Leads
        </Link>
      </div>
    </div>
  );

  const currentStepIdx = FLOW_STEPS.indexOf(lead.status);

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value || "Not specified"}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fafafb] pb-16">
      {/* Header */}
      <section className="bg-gradient-to-br from-[hsl(353,45%,35%)] to-[hsl(353,45%,25%)] py-8 md:py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/wedding/vendor/leads"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Leads
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              {lead.name}
            </h1>
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${STATUS_STYLES[lead.status] || STATUS_STYLES.New}`}>
              {lead.status}
            </span>
          </div>
          <p className="text-white/60 text-sm mt-1">Enquiry received on {formatDate(lead.createdAt)}</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 -mt-4 space-y-4">

        {/* Flow Progress Bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Booking Progress</p>
          <div className="flex items-center gap-0">
            {FLOW_STEPS.map((step, idx) => {
              const isCompleted = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isLost = lead.status === "Lost";
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                      ${isLost ? "border-rose-200 bg-rose-50 text-rose-400"
                        : isCompleted ? "border-primary bg-primary text-white"
                        : isCurrent ? "border-primary bg-white text-primary"
                        : "border-slate-200 bg-slate-50 text-slate-400"}`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <p className={`text-[9px] font-bold mt-1 text-center
                      ${isCurrent ? "text-primary" : isCompleted ? "text-primary/60" : "text-slate-400"}`}>
                      {step}
                    </p>
                  </div>
                  {idx < FLOW_STEPS.length - 1 && (
                    <div className={`h-0.5 flex-1 mb-4 ${isCompleted ? "bg-primary" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Enquiry Details</h2>
          <InfoRow icon={Calendar} label="Event Date" value={formatDate(lead.weddingDate)} />
          <InfoRow icon={MapPin} label="Destination" value={lead.destination} />
          <InfoRow icon={IndianRupee} label="Budget" value={lead.budget} />
          <InfoRow icon={Users} label="Guest Count" value={lead.guestCount} />
        </div>

        {/* Contact Card */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Contact Information</h2>
          <InfoRow icon={Mail} label="Email" value={lead.email} />
          <InfoRow icon={Phone} label="Phone" value={lead.phone} />
        </div>

        {/* Message Card */}
        {lead.message && (
          <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-base font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Client Message</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pl-11 italic">"{lead.message}"</p>
          </div>
        )}

        {/* ✅ ACTION BUTTONS — Proper Flow */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h2 className="text-base font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Actions</h2>
          <p className="text-xs text-slate-400 mb-4">Update the lead status as the conversation progresses.</p>

          <div className="flex flex-wrap gap-3">

            {/* NEW → Mark as Contacted */}
            {lead.status === "New" && (
              <button onClick={() => handleStatusUpdate("Contacted")} disabled={updating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all disabled:opacity-50">
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
                Mark as Contacted
              </button>
            )}

            {/* CONTACTED → Accept Deal OR Mark Lost */}
            {lead.status === "Contacted" && (
              <>
                <button onClick={() => handleStatusUpdate("Accepted")} disabled={updating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all disabled:opacity-50">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                  Accept Deal (Notify User to Pay)
                </button>
                <button onClick={() => handleStatusUpdate("Lost")} disabled={updating}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50">
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Mark as Lost
                </button>
              </>
            )}

            {/* ACCEPTED — waiting for user payment */}
            {lead.status === "Accepted" && (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
                Deal Accepted — Waiting for User Payment
              </div>
            )}

            {/* BOOKED → Mark Completed after event */}
            {lead.status === "Booked" && (
              <button onClick={() => handleStatusUpdate("Completed")} disabled={updating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-all disabled:opacity-50">
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <PartyPopper className="w-4 h-4" />}
                Mark Event Completed
              </button>
            )}

            {/* COMPLETED */}
            {lead.status === "Completed" && (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <PartyPopper className="w-4 h-4" />
                Event Successfully Completed 🎉
              </div>
            )}

            {/* LOST */}
            {lead.status === "Lost" && (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-rose-50 text-rose-600 border border-rose-200">
                <XCircle className="w-4 h-4" />
                This lead is marked as Lost
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LeadDetails;
