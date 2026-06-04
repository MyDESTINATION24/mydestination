import React, { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Star, MapPin, Heart, Share2, Phone, MessageSquare, Mail,
  ChevronRight, CheckCircle, Image as ImageIcon,
  Calendar, ChevronLeft, X, Award, Play, Loader2, Inbox, Flag, User
} from "lucide-react";
import { 
  weddingEnquiryService, 
  weddingVendorService, 
  weddingVenueService,
  weddingReviewService 
} from "../../../services/apiService";
import { weddingService } from "../../../services/weddingService";
import toast from "react-hot-toast";

/* --- Lightbox --- */
const Lightbox = ({ images, startIdx, onClose }) => {
  const [idx, setIdx] = useState(startIdx);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10" onClick={onClose}>
        <X className="w-5 h-5" />
      </button>
      <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10" onClick={(e) => { e.stopPropagation(); prev(); }}>
        <ChevronLeft className="w-5 h-5" />
      </button>
      <img src={images[idx]} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl" onClick={(e) => e.stopPropagation()} />
      <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10" onClick={(e) => { e.stopPropagation(); next(); }}>
        <ChevronRight className="w-5 h-5" />
      </button>
      <div className="absolute bottom-4 text-white/60 text-sm">{idx + 1} / {images.length}</div>
    </div>
  );
};

/* --- Star Row --- */
const StarRow = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? "fill-[#f04e5e] text-[#f04e5e]" : "text-slate-200"}`} />
    ))}
  </div>
);

/* --- Vendor Detail Page --- */
const VendorDetailPage = () => {
  const { vendorId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState("Projects");
  const [projectsSubTab, setProjectsSubTab] = useState("Portfolio");
  const [isSticky, setIsSticky] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [shortlisted, setShortlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", phone: "", email: "", date: "", message: "", 
    packageType: "Base Package",
    guestCount: "",
    destination: "",
    services: []
  });
  const heroRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        let data = null;
        try {
          data = await weddingVendorService.getPublicVendorDetail(vendorId);
        } catch (err) {
          data = await weddingVenueService.getPublicVenueDetail(vendorId);
        }
        if (data) {
          setVendor(data);
          const revs = await weddingReviewService.getPublicReviews(vendorId);
          setReviews(revs);
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [vendorId]);

  useEffect(() => {
    if (vendor) {
      const type = (vendor.isVenue || vendor.capacity) ? 'venue' : 'vendor';
      weddingService.incrementView(type, vendorId || vendor._id)
        .catch(err => console.error("View increment failed", err));
    }
  }, [vendor]);

  useEffect(() => {
    const onScroll = () => {
      if (heroRef.current) {
        setIsSticky(window.scrollY > heroRef.current.offsetTop + heroRef.current.offsetHeight - 60);
      }
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
      <p className="text-slate-500 font-medium">Loading...</p>
    </div>
  );

  if (!vendor) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Inbox className="w-12 h-12 text-slate-200 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Not Found</h2>
        <Link to="/wedding/vendors" className="text-primary hover:underline">Go Back</Link>
      </div>
    </div>
  );

  const galleryImages = vendor.images?.length > 0 ? vendor.images : [vendor.image || "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200"];
  const portfolioImages = vendor.portfolio?.length > 0 ? vendor.portfolio : galleryImages;

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      let calculatedBudget = "";
      if (formData.packageType === "Premium Package" && vendor.price?.premium) {
        calculatedBudget = `₹${vendor.price.premium.toLocaleString()}`;
      } else if (typeof vendor.price === 'object' && vendor.price.base) {
        calculatedBudget = `₹${vendor.price.base.toLocaleString()}`;
      } else if (vendor.startingPrice) {
        calculatedBudget = `₹${vendor.startingPrice.toLocaleString()}`;
      } else if (typeof vendor.price === 'number' || typeof vendor.price === 'string') {
        calculatedBudget = `₹${vendor.price}`;
      }

      const payload = {
        ...formData,
        eventDate: formData.date,
        message: `[Interested In: ${formData.packageType}]\n\n${formData.message || "Please share more details."}`,
        targetType: vendor.isVenue || vendor.capacity ? "Venue" : "Vendor",
        targetId: vendor._id
      };

      if (calculatedBudget) {
        payload.budget = calculatedBudget;
      }
      if (formData.guestCount)   payload.guestCount   = formData.guestCount;
      if (formData.destination)  payload.destination  = formData.destination;
      if (formData.services?.length) payload.services = formData.services;

      await weddingEnquiryService.createEnquiry(payload);
      toast.success("Enquiry sent!");
      setFormData({ name: "", phone: "", email: "", date: "", message: "", packageType: "Base Package", guestCount: "", destination: "", services: [] });
    } catch (err) {
      toast.error(err.message || "Failed to send");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FFF5F6] min-h-screen">
      {lightbox && <Lightbox images={lightbox.images} startIdx={lightbox.idx} onClose={() => setLightbox(null)} />}

      {/* Hero */}
      <div ref={heroRef} className="relative bg-black h-[300px] md:h-[460px] overflow-hidden flex">
        <div className="flex-[2] relative cursor-zoom-in" onClick={() => setLightbox({ images: galleryImages, idx: 0 })}>
          <img src={galleryImages[0]} alt="" className="w-full h-full object-cover opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-8 left-8 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{vendor.name}</h1>
            <div className="flex items-center gap-4 text-sm opacity-90">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {vendor.location || vendor.destination?.name}</span>
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {vendor.rating || '5.0'} ({reviews.length} reviews)</span>
            </div>
          </div>
        </div>
        {galleryImages.length > 1 && (
          <div className="hidden md:flex flex-col flex-1 gap-1">
            {galleryImages.slice(1, 3).map((img, i) => (
              <div key={i} className="flex-1 relative cursor-zoom-in overflow-hidden" onClick={() => setLightbox({ images: galleryImages, idx: i + 1 })}>
                <img src={img} alt="" className="w-full h-full object-cover" />
                {i === 1 && galleryImages.length > 3 && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold">
                    +{galleryImages.length - 3} Photos
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={`bg-white border-b border-slate-200 z-20 ${isSticky ? "sticky top-0 shadow-md" : ""}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-8">
          {["Projects", "About", "Reviews"].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`py-4 text-xs font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === t ? "border-primary text-primary" : "border-transparent text-slate-500"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
            {activeTab === "Projects" && (
              <div>
                <div className="flex gap-4 border-b border-slate-100 mb-6">
                  {["Portfolio", "Albums", "Videos"].map(s => (
                    <button key={s} onClick={() => setProjectsSubTab(s)} className={`pb-2 text-[11px] font-bold uppercase tracking-widest ${projectsSubTab === s ? "text-primary border-b-2 border-primary" : "text-slate-400"}`}>{s}</button>
                  ))}
                </div>
                {projectsSubTab === "Portfolio" ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {portfolioImages.map((img, i) => (
                      <div key={i} className="aspect-square rounded-xl overflow-hidden cursor-zoom-in bg-slate-50" onClick={() => setLightbox({ images: portfolioImages, idx: i })}>
                        <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                ) : projectsSubTab === "Albums" ? (
                  vendor.albums?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {vendor.albums.map((album, idx) => (
                        <div key={idx} className="group cursor-pointer" onClick={() => setLightbox({ images: album.images, idx: 0 })}>
                          <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-slate-100">
                            <img src={album.cover || album.images?.[0] || 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc'} alt={album.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5" /> View {album.images?.length || 0} Photos
                              </div>
                            </div>
                          </div>
                          <h4 className="font-bold text-slate-800 text-sm truncate">{album.name}</h4>
                          <p className="text-xs text-slate-500 mb-2">{album.images?.length || 0} Photos</p>
                          
                          {album.images?.length > 1 && (
                            <div className="flex gap-1.5 w-full">
                              {album.images.slice(1, 5).map((img, i) => (
                                <div key={i} className="flex-1 aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </div>
                              ))}
                              {album.images.length > 5 && (
                                <div className="flex-1 aspect-[4/3] rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold">
                                  +{album.images.length - 5}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <div className="py-12 text-center text-slate-400 italic">No albums added yet.</div>
                ) : (
                  vendor.videos?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {vendor.videos.map((vid, idx) => {
                        const match = vid.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
                        const videoId = match ? match[1] : null;
                        if (!videoId) return null;
                        return (
                          <div key={idx} className="aspect-video rounded-xl overflow-hidden bg-black shadow-sm">
                            <iframe 
                              src={`https://www.youtube.com/embed/${videoId}`} 
                              title={`Video ${idx}`}
                              className="w-full h-full border-0"
                              allowFullScreen 
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : <div className="py-12 text-center text-slate-400 italic">No videos added yet.</div>
                )}
              </div>
            )}

            {activeTab === "About" && (
              <div className="prose prose-slate max-w-none">
                <h3 className="text-xl font-bold mb-4">About {vendor.name}</h3>
                <p className="text-slate-600 leading-relaxed">{vendor.about || vendor.description || "Leading professional in the wedding industry."}</p>
                
                {typeof vendor.price === 'object' && (vendor.price.baseFeatures || vendor.price.premiumFeatures) && (
                  <div className="mt-10 pt-8 border-t border-slate-100">
                    <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <span className="text-xl">📋</span> Package Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {vendor.price.baseFeatures && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-slate-300"></div>
                          <h5 className="font-bold text-[15px] text-slate-800 mb-3 tracking-wide uppercase">Base Package</h5>
                          <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-wrap">{vendor.price.baseFeatures}</p>
                        </div>
                      )}
                      {vendor.price.premiumFeatures && (
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 rounded-2xl border border-amber-200/60 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-full h-1 bg-amber-400"></div>
                          <h5 className="font-bold text-[15px] text-amber-900 mb-3 tracking-wide uppercase flex items-center gap-2">
                            <span>👑</span> Premium Package
                          </h5>
                          <p className="text-[13px] text-amber-900/80 leading-relaxed whitespace-pre-wrap">{vendor.price.premiumFeatures}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "Reviews" && (
              <ReviewsTab vendor={vendor} reviews={reviews} onUpdate={() => {}} />
            )}
          </div>
        </div>

        <aside className="w-full lg:w-[350px] space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            {typeof vendor.price === 'object' && vendor.price.premium && (
              <div className="flex bg-slate-50 p-1 rounded-xl mb-6">
                <button 
                  onClick={() => setFormData({...formData, packageType: "Base Package"})}
                  className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all ${formData.packageType === "Base Package" ? "bg-white shadow-sm text-primary" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Base
                </button>
                <button 
                  onClick={() => setFormData({...formData, packageType: "Premium Package"})}
                  className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1 ${formData.packageType === "Premium Package" ? "bg-white shadow-sm text-amber-500" : "text-slate-400 hover:text-slate-600"}`}
                >
                  <span className="text-[10px]">👑</span> Premium
                </button>
              </div>
            )}
            
            <div className="mb-6">
              {formData.packageType === "Base Package" || !vendor.price?.premium ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Base Package Price</span>
                  <div className="text-3xl font-black text-primary">
                    {typeof vendor.price === 'object' 
                      ? (vendor.price.base ? `₹${vendor.price.base.toLocaleString()}` : 'Contact')
                      : (vendor.price || (vendor.startingPrice ? `₹${(vendor.startingPrice / 100000).toFixed(1)}L` : 'Contact'))}
                  </div>
                  {typeof vendor.price === 'object' && vendor.price.baseFeatures && (
                    <p className="text-xs text-slate-500 mt-2 italic">{vendor.price.baseFeatures}</p>
                  )}
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="text-amber-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                    👑 Premium Package Price
                  </span>
                  <div className="text-3xl font-black text-slate-800 mt-0.5">
                    ₹{vendor.price.premium.toLocaleString()}
                  </div>
                  {vendor.price.premiumFeatures && (
                    <p className="text-xs text-slate-500 mt-2 italic">{vendor.price.premiumFeatures}</p>
                  )}
                </div>
              )}
            </div>
            
            <form onSubmit={handleEnquirySubmit} className="space-y-4">
              <input type="text" placeholder="Your Name" required className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-1 focus:ring-primary" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input type="email" placeholder="Email Address" required className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-1 focus:ring-primary" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input type="text" placeholder="Phone Number" required className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-1 focus:ring-primary" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <div className="relative">
                <input 
                  type="date" 
                  required 
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-1 focus:ring-primary text-slate-600" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})} 
                />
                {!formData.date && (
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 text-sm text-slate-400 pointer-events-none bg-slate-50 right-10">
                    Event Date
                  </div>
                )}
              </div>

              {/* Guest Count */}
              <input 
                type="number" 
                placeholder="Number of Guests (e.g. 200)" 
                min="1"
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-1 focus:ring-primary" 
                value={formData.guestCount} 
                onChange={e => setFormData({...formData, guestCount: e.target.value})} 
              />

              {/* Destination */}
              <input 
                type="text" 
                placeholder="Preferred Destination (e.g. Goa, Jaipur)" 
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-1 focus:ring-primary" 
                value={formData.destination} 
                onChange={e => setFormData({...formData, destination: e.target.value})} 
              />

              {/* Services Description */}
              <textarea
                placeholder="Describe the services you need (e.g. Photography, Catering, Decoration, DJ...)"
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 rounded-xl text-sm border-none focus:ring-1 focus:ring-primary resize-none placeholder:text-slate-400"
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
              />

              <button type="submit" disabled={submitting} className="w-full py-4 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50">
                {submitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
};

/* --- Reviews Tab Component --- */
const ReviewsTab = ({ vendor, reviews }) => {
  const [starRating, setStarRating] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);

  const handleNameChange = (e) => {
    const val = e.target.value;
    setReviewName(val);
    // Name must be at least 3 characters and only contain letters, spaces, etc.
    setNameError(val.length > 0 && !/^[A-Za-z\s.'-]{3,}$/.test(val));
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setReviewEmail(val);
    // Standard robust email regex
    setEmailError(val.length > 0 && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(val));
  };

  const handleReviewSubmit = async () => {
    if (starRating === 0 || !comment.trim() || !reviewName.trim() || !reviewEmail.trim()) {
      return toast.error("Rating, Name, Email, and Comment are required");
    }
    if (nameError || emailError) {
      return toast.error("Please provide valid Name and Email format");
    }
    try {
      setSubmitting(true);
      await weddingReviewService.createReview({
        targetId: vendor._id,
        targetType: vendor.capacity ? "Venue" : "Vendor",
        rating: starRating,
        comment,
        name: reviewName,
        email: reviewEmail
      });
      toast.success("Review submitted!");
      setStarRating(0); setComment(""); setReviewName(""); setReviewEmail("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-50 rounded-2xl p-6">
        <div className="text-center">
          <div className="text-5xl font-black text-slate-800">{vendor.rating || '5.0'}</div>
          <StarRow rating={vendor.rating || 5} />
          <div className="text-xs text-slate-400 mt-2">{reviews.length} reviews</div>
        </div>
        <div className="flex-1 w-full space-y-2">
          {[5, 4, 3, 2, 1].map(s => {
            const count = reviews.filter(r => r.rating === s).length;
            const pct = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <div key={s} className="flex items-center gap-3 text-xs">
                <span className="w-4 font-bold">{s}</span>
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-12 text-slate-400 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        {reviews.slice(0, visibleCount).map(r => (
          <div key={r._id} className="border-b border-slate-100 py-5 first:pt-0 last:border-0">
            <div className="flex items-start gap-3 md:gap-4 mb-3">
              <div className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                <User className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[13px] md:text-sm font-bold text-slate-800">{r.name || r.userName || "Customer"}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-600 text-[10px] md:text-xs px-2 py-0.5 rounded-md font-bold shadow-sm">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {r.rating}
                  </div>
                </div>
                <p className="text-[13px] md:text-sm text-slate-600 mt-2 leading-relaxed">"{r.comment}"</p>
                
                {r.reply && (
                  <div className="mt-3 md:mt-4 bg-slate-50 rounded-r-xl rounded-l-sm border-l-[3px] border-primary p-3 md:p-4">
                    <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <MessageSquare className="w-3 h-3" /> Reply from Vendor
                    </div>
                    <p className="text-[12px] md:text-[13px] text-slate-600 leading-relaxed">{r.reply}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-slate-400 italic">No reviews yet. Be the first to review!</p>}
        {reviews.length > visibleCount && (
          <div className="pt-2 text-center">
            <button 
              onClick={() => setVisibleCount(reviews.length)} 
              className="text-primary font-bold text-[13px] uppercase tracking-wider px-6 py-2.5 border-2 border-primary/20 rounded-xl hover:bg-primary/5 transition-colors"
            >
              Read more reviews
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <h4 className="font-bold mb-4">Write a Review</h4>
        <div className="flex gap-2 mb-4">
          {[1,2,3,4,5].map(s => (
            <button key={s} onMouseEnter={() => setHoverStar(s)} onMouseLeave={() => setHoverStar(0)} onClick={() => setStarRating(s)}>
              <Star className={`w-6 h-6 ${(hoverStar || starRating) >= s ? "fill-primary text-primary" : "text-slate-300"}`} />
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Your Name" 
            value={reviewName} 
            onChange={handleNameChange} 
            className="w-full p-3 bg-white rounded-xl text-sm outline-none transition-colors border-2 focus:ring-2 focus:ring-primary"
            style={nameError ? { borderColor: '#ef4444', outlineColor: '#ef4444', color: '#ef4444', boxShadow: '0 0 0 2px #ef4444' } : { borderColor: 'transparent' }}
          />
          <input 
            type="email" 
            placeholder="Your Email" 
            value={reviewEmail} 
            onChange={handleEmailChange} 
            className="w-full p-3 bg-white rounded-xl text-sm outline-none transition-colors border-2 focus:ring-2 focus:ring-primary"
            style={emailError ? { borderColor: '#ef4444', outlineColor: '#ef4444', color: '#ef4444', boxShadow: '0 0 0 2px #ef4444' } : { borderColor: 'transparent' }}
          />
        </div>
        <textarea placeholder="Your experience..." className="w-full p-4 bg-white rounded-xl text-sm border-none focus:ring-1 focus:ring-primary min-h-[100px] mb-4" value={comment} onChange={e => setComment(e.target.value)} />
        <button onClick={handleReviewSubmit} disabled={submitting} className="px-8 py-3 bg-primary text-white font-bold rounded-xl text-sm shadow-md disabled:opacity-50">
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
};

export default VendorDetailPage;
