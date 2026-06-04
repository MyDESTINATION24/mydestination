import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Loader2, ArrowLeft, Calendar, MapPin, IndianRupee, Users,
  ChevronRight, Inbox,
} from "lucide-react";
import { weddingVendorService } from "../../../../../services/apiService";
import toast from "react-hot-toast";

const STATUS_FILTERS = [
  { key: "all",       label: "All" },
  { key: "New",       label: "New" },
  { key: "Contacted", label: "Contacted" },
  { key: "Accepted",  label: "Accepted" },
  { key: "Booked",    label: "Booked" },
  { key: "Completed", label: "Completed" },
  { key: "Lost",      label: "Lost" },
];

const STATUS_COLORS = {
  New:       "bg-amber-100 text-amber-700",
  Contacted: "bg-blue-100 text-blue-700",
  Accepted:  "bg-emerald-100 text-emerald-700",
  Booked:    "bg-purple-100 text-purple-700",
  Completed: "bg-teal-100 text-teal-700",
  Lost:      "bg-rose-100 text-rose-700",
};

const VendorLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const data = await weddingVendorService.getLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads =
    filter === "all" ? leads : leads.filter((l) => l.status === filter);

  const getCount = (key) =>
    key === "all" ? leads.length : leads.filter((l) => l.status === key).length;

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBD";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch { return dateStr; }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafb] pb-16">
      {/* Header */}
      <section className="bg-gradient-to-br from-[hsl(353,45%,35%)] to-[hsl(353,45%,25%)] py-8 md:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/wedding/vendor/dashboard"
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl md:text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
            Leads & Enquiries
          </h1>
          <p className="text-white/60 text-sm mt-1">{leads.length} total enquiries from couples</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 -mt-4 space-y-4">
        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                filter === f.key
                  ? "bg-[hsl(353,45%,35%)] text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-primary hover:text-primary"
              }`}
            >
              {f.label} ({getCount(f.key)})
            </button>
          ))}
        </div>

        {/* Leads List */}
        {filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <Link
              key={lead._id}
              to={`/wedding/vendor/leads/${lead._id}`}
              className="block p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="text-sm font-bold text-slate-800">{lead.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[lead.status] || STATUS_COLORS.New}`}>
                      {lead.status || "New"}
                    </span>
                    {lead.paymentStatus === 'Paid' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase">
                        ✓ Paid
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(lead.weddingDate)}
                    </span>
                    {lead.destination && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {lead.destination}
                      </span>
                    )}
                    {lead.budget && (
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" /> {lead.budget}
                      </span>
                    )}
                    {lead.guestCount && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {lead.guestCount} guests
                      </span>
                    )}
                  </div>
                  {lead.message && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-1 italic">"{lead.message}"</p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary shrink-0 mt-1 transition-colors" />
              </div>
            </Link>
          ))
        ) : (
          <div className="p-12 rounded-2xl bg-white border border-dashed border-slate-200 text-center">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">No leads found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorLeads;
