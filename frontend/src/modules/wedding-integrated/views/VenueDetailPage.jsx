import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { 
  IndianRupee, 
  Users, 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  Heart, 
  Share2, 
  CheckCircle2,
  Clock,
  Waves,
  History,
  Trees
} from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";
import toast from 'react-hot-toast';
import { formatPrice } from "../data/weddingData";
import PlanWeddingModal from "../components/PlanWeddingModal";
import { weddingService } from "../../../services/weddingService";

const VenueDetailPage = () => {
  const { destId, venueId } = useParams();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [dest, setDest] = useState(null);
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchVenueDetails = async () => {
      try {
        setLoading(true);
        const [venueData, dests] = await Promise.all([
          weddingService.getVenues().then(venues => venues.find(v => (v.id === venueId || v._id === venueId))),
          weddingService.getDestinations()
        ]);
        
        if (venueData) {
          setVenue(venueData);
          const foundDest = dests.find(d => (d.id === destId || d._id === destId));
          setDest(foundDest);
        }
      } catch (error) {
        console.error("Failed to fetch venue details", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVenueDetails();
  }, [destId, venueId]);

  useEffect(() => {
    if (venueId) {
      weddingService.incrementView('venue', venueId).catch(err => console.error("View increment failed", err));
    }
  }, [venueId]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: venue?.name || "Wedding Venue",
        text: `Check out this amazing venue: ${venue?.name} in ${dest?.name}`,
        url: window.location.href,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };


  if (loading) return <div className="min-h-screen flex items-center justify-center p-4"><div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;

  if (!dest || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Venue not found</h2>
          <button onClick={() => navigate(-1)} className="text-primary hover:underline font-medium">Go Back</button>
        </div>
      </div>
    );
  }

  // Determine an icon based on venue type
  const getVenueTypeIcon = (type) => {
    const t = type.toLowerCase();
    if (t.includes('beach') || t.includes('resort')) return <Waves className="w-5 h-5" />;
    if (t.includes('palace') || t.includes('heritage')) return <History className="w-5 h-5" />;
    return <Trees className="w-5 h-5" />;
  };

  const amenities = venue.amenities && venue.amenities.length > 0 ? venue.amenities : [
    "Bridal Suite",
    "On-site Catering",
    "Decor & Design",
    "Audio Visual Equipment",
    "Guest Accommodation",
    "Complimentary Parking",
    "Valet Service",
    "Power Backup"
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-16">
      {/* Hero Gallery Section */}
      <section className="relative h-[50vh] md:h-[65vh] overflow-hidden">
        <img 
          src={venue.image || dest.image} 
          alt={venue.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        
        {/* Top Controls */}
        <div className="absolute top-6 left-0 right-0 px-4 md:px-8 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link 
              to={`/wedding/destinations/${destId}`}
              className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/40 transition-all group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsFav(!isFav)}
                className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/40 transition-all"
              >
                <Heart className={`w-5 h-5 ${isFav ? 'fill-destructive text-destructive' : ''}`} />
              </button>
              <button 
                onClick={handleShare}
                className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/40 transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Hero Title */}
        <div className="absolute bottom-10 left-0 right-0 px-4 md:px-8 z-20">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-primary/30 mb-4">
                {getVenueTypeIcon(venue.type)}
                {venue.type}
              </div>
              <h1 
                className="text-4xl md:text-6xl font-bold text-white mb-2"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {venue.name}
              </h1>
              <div className="flex items-center gap-2 text-white/80 text-sm md:text-base font-medium">
                <MapPin className="w-4 h-4 text-primary" />
                {dest.location}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative -mt-8 px-4 md:px-8 z-30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-10">
            {/* Quick Stats */}
            <div className="p-6 md:p-8 rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 border border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Capacity</p>
                  <p className="text-sm md:text-base font-black text-slate-700">{venue.capacity} Guests</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                  <IndianRupee className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Starting Price</p>
                  <p className="text-sm md:text-base font-black text-slate-700">{formatPrice(venue.pricePerDay)}/day</p>
                </div>
              </div>
              <div className="flex items-center gap-4 col-span-2 md:col-span-1">
                <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ideal Booking</p>
                  <p className="text-sm md:text-base font-black text-slate-700">8-12 Months ahead</p>
                </div>
              </div>
            </div>

            {/* About the Venue */}
            <ScrollReveal>
              <div className="space-y-4">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                  About the Venue
                </h3>
                {venue.description ? (
                  <p className="text-slate-600 leading-relaxed md:text-lg whitespace-pre-wrap">
                    {venue.description}
                  </p>
                ) : (
                  <>
                    <p className="text-slate-600 leading-relaxed md:text-lg">
                      Experience true luxury at {venue.name}, one of the most prestigious venues in {dest.name}. 
                      Located in the heart of {dest.location}, this {venue.type.toLowerCase()} offers a perfect blend of 
                      traditional elegance and modern sophistication for your dream destination wedding.
                    </p>
                    <p className="text-slate-600 leading-relaxed md:text-lg">
                      Whether you're planning an intimate gathering or a grand celebration of up to {venue.capacity} guests, 
                      our dedicated team ensures every detail of your special day is executed with perfection.
                    </p>
                  </>
                )}
              </div>
            </ScrollReveal>

            {/* Amenities Grid */}
            <ScrollReveal>
              <div className="space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Key Amenities
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenities.map(amenity => (
                    <div key={amenity} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-medium text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                      {amenity}
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            {/* Location Policy */}
            <ScrollReveal>
              <div className="p-6 md:p-10 rounded-[3rem] bg-white border border-pink-100 shadow-xl shadow-pink-100/20 space-y-8 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-[0.25em] text-[10px] md:text-xs">
                  <Calendar className="w-4 h-4" />
                  Availability & Policy
                </div>
                <h4 className="text-2xl md:text-3xl font-bold text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>Booking Guidelines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 text-sm md:text-base">
                  <div className="space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-slate-500 font-medium">Venue rental time</span>
                      <span className="text-slate-900 font-black tracking-tight">{venue.rentalHours || '12 PM – 12 AM'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-slate-500 font-medium">Cancellation policy</span>
                      <span className="text-primary font-black tracking-tight">{venue.cancellationPolicy || 'Flexible (4 weeks)'}</span>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-slate-500 font-medium">Outside catering</span>
                      <span className="text-slate-900 font-black tracking-tight">{venue.outsideCatering || 'Permitted'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <span className="text-slate-500 font-medium">Alcohol policy</span>
                      <span className="text-slate-900 font-black tracking-tight">{venue.alcoholPolicy || 'Allowed'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right Column: Sticky Contact Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <ScrollReveal>
                <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.08)] space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 wedding-gradient" />
                  <div className="text-center">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.25em] mb-2 text-primary/60">Starting from</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-2xl font-bold text-slate-900">₹</span>
                      <span className="text-5xl font-black text-slate-900 tracking-tighter">{venue.pricePerDay.toString().replace('00000', 'L')}</span>
                      <span className="text-lg font-bold text-slate-400 italic">/day</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-semibold mt-3">*Exclusive of Taxes & Staff Charges</p>
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={() => setModalOpen(true)}
                      className="w-full py-3 rounded-2xl wedding-gradient text-white font-black text-xs uppercase tracking-[0.15em] shadow-lg shadow-red-200/50 hover:shadow-xl hover:shadow-red-300/60 transition-all transform hover:scale-[1.03] active:scale-95"
                    >
                      Check Availability
                    </button>
                    <Link 
                      to="/wedding/enquiry"
                      className="w-full py-3 inline-block text-center rounded-2xl bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-[0.1em] border border-slate-100 hover:bg-slate-100 transition-all"
                    >
                      Enquire with Planner
                    </Link>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                      Quick Response
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Tips Card */}
              <div className="p-6 rounded-[2rem] bg-pink-50/50 border border-pink-100 space-y-3">
                <p className="text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Planner Tip
                </p>
                <p className="text-sm text-slate-700 italic leading-relaxed">
                  "This venue is highly sought after during peak {dest.bestSeason} season. We recommend securing your dates 10-12 months in advance for the best experience."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PlanWeddingModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        initialLocation={dest.name}
        targetId={venue.id || venue._id}
        targetType="Venue"
      />
    </div>
  );
};

export default VenueDetailPage;
