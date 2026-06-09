import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, DollarSign, Info, Navigation, CheckCircle, Car, Activity, Hotel, Umbrella, HandCoins, Briefcase } from 'lucide-react';
import logo from '../assets/rokologin-removebg-preview.png';
import heroBg from '../assets/landing/hero_travel1.png';
import coupleImg from '../assets/landing/landingPageImage.png';
import destAmsterdam from '../assets/landing/dest_amsterdam.png';
import destLisbon from '../assets/landing/dest_lisbon.png';
import destDublin from '../assets/landing/dest_dublin.png';
import destExuma from '../assets/landing/dest_exuma.png';
import latestTourBg from '../assets/landing/latest_tour_bg.png';
import airplane from '../assets/landing/airplane.jpg';
import hotelImg from '../assets/landing/hotel.webp';
import weddingImg from '../assets/landing/wedding.jpg';
import tourImg from '../assets/landing/tour.jpg';
import { Facebook, Twitter, Instagram, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/apiService';

const LandingPage = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [cmsData, setCmsData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Travel Specialist'
  });
  const [imageFile, setImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hotel Search State
  const [searchParams, setSearchParams] = useState({
    destination: '',
    checkIn: '',
    checkOut: ''
  });

  const handleHotelSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchParams.destination) query.append('search', searchParams.destination);
    if (searchParams.checkIn) query.append('startDate', searchParams.checkIn);
    if (searchParams.checkOut) query.append('endDate', searchParams.checkOut);
    
    const targetPath = `/search?${query.toString()}`;
    navigate(targetPath);
  };

  useEffect(() => {
    import('../services/apiService').then(({ api }) => {
      api.get('/cms/landing-page').then(res => {
        if (res.data?.success) {
          setCmsData(res.data.data);
        }
      }).catch(err => console.error("Failed to load CMS data:", err));
    }).catch(err => console.error("Failed to import api:", err));
  }, []);

  // Check login before navigating to protected pages
  const handleNavigation = (targetPath) => {
    const mainToken = localStorage.getItem('token');
    const taxiToken = localStorage.getItem('taxiUserToken');

    if (targetPath === '/taxi/user') {
      // Taxi (Tours) routes need taxiUserToken — taxi has its own login
      if (!taxiToken) {
        navigate('/taxi/user/login');
      } else {
        navigate(targetPath);
      }
    } else if (targetPath === '/wedding') {
      // Wedding/Destination uses dedicated wedding login page
      if (!mainToken) {
        navigate('/wedding/login', { state: { from: { pathname: '/wedding' } } });
      } else {
        navigate('/wedding');
      }
    } else if (targetPath === '/home') {
      // Hotel route needs main app token
      if (!mainToken) {
        navigate('/login', { state: { from: { pathname: targetPath } } });
      } else {
        navigate(targetPath);
      }
    } else {
      // Generic fallback
      if (!mainToken) {
        navigate('/login', { state: { from: { pathname: targetPath } } });
      } else {
        navigate(targetPath);
      }
    }
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    if (isContactModalOpen || isJoinModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [isContactModalOpen, isJoinModalOpen]);

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('firstName', formData.firstName);
      submitData.append('lastName', formData.lastName);
      submitData.append('email', formData.email);
      submitData.append('role', formData.role);
      if (imageFile) {
        submitData.append('image', imageFile);
      }

      const res = await api.post('/cms/career/apply', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success('Application submitted successfully!');
        setIsJoinModalOpen(false);
        setFormData({ firstName: '', lastName: '', email: '', role: 'Travel Specialist' });
        setImageFile(null);
      } else {
        toast.error(res.data.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submit Application Error:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-['Inter',sans-serif]">
      {/* 1. Hero Section */}
      <section className="relative min-h-screen w-full flex flex-col bg-[#0a0a0a] overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0">
          <img src={heroBg} alt="Travel Hero" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
        </div>
        
        {/* Navbar */}
        <nav className="relative z-50 flex items-center justify-between px-2 sm:px-4 md:px-20 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="MyDESTINATION" className="h-12 w-auto object-contain" />
            <span className="text-white font-bold text-2xl tracking-tight">MyDESTINATION</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex gap-10 text-white/90 text-sm font-bold tracking-wide">
            <a href="#" className="text-emerald-400 transition">Home</a>
            <button onClick={() => handleNavigation('/taxi/user')} className="hover:text-emerald-400 transition font-bold">Tours</button>
            <button onClick={() => handleNavigation('/wedding')} className="hover:text-emerald-400 transition font-bold">Destination</button>
            <button onClick={() => handleNavigation('/home')} className="hover:text-emerald-400 transition font-bold">Hotel</button>
            <a href="#about" className="hover:text-emerald-400 transition">About us</a>
            <button 
              onClick={() => setIsContactModalOpen(true)} 
              className="hover:text-emerald-400 transition font-bold"
            >
              Contact
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden text-white hover:text-emerald-400 transition z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-[80px] left-0 w-full bg-black/40 backdrop-blur-2xl z-40 lg:hidden border-b border-white/20 shadow-2xl">
            <div className="flex flex-col px-8 py-6 gap-6 text-white/90 text-base font-bold tracking-wide">
              <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="text-emerald-400 transition border-b border-white/10 pb-2">Home</a>
              <button onClick={() => handleNavigation('/taxi/user')} className="text-left hover:text-emerald-400 transition border-b border-white/10 pb-2 font-bold">Tours</button>
              <button onClick={() => handleNavigation('/wedding')} className="text-left hover:text-emerald-400 transition border-b border-white/10 pb-2 font-bold">Destination</button>
              <button onClick={() => handleNavigation('/home')} className="text-left hover:text-emerald-400 transition border-b border-white/10 pb-2 font-bold">Hotel</button>
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-emerald-400 transition border-b border-white/10 pb-2">About us</a>
              <button 
                onClick={() => {
                  setIsContactModalOpen(true);
                  setIsMobileMenuOpen(false);
                }} 
                className="text-left hover:text-emerald-400 transition border-b border-white/10 pb-2 font-bold"
              >
                Contact
              </button>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsContactModalOpen(false)}
            ></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-6 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black text-white tracking-widest uppercase">Contact Us</h2>
                  <button 
                    onClick={() => setIsContactModalOpen(false)}
                    className="text-white/60 hover:text-white transition"
                  >
                    <X size={32} />
                  </button>
                </div>
                
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="example@mail.com" 
                      className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Message</label>
                    <textarea 
                      rows="4" 
                      placeholder="How can we help you?" 
                      className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition resize-none"
                    ></textarea>
                  </div>
                  
                  <button className="w-full bg-emerald-600 text-white py-4 font-black tracking-widest uppercase hover:bg-emerald-700 transition shadow-xl">
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Join Now Modal */}
        {isJoinModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsJoinModalOpen(false)}
            ></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-lg rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="p-6 md:p-10">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-black text-white tracking-widest uppercase">Join Our Team</h2>
                  <button 
                    onClick={() => setIsJoinModalOpen(false)}
                    className="text-white/60 hover:text-white transition"
                  >
                    <X size={32} />
                  </button>
                </div>
                
                <p className="text-white/80 text-sm mb-8 leading-relaxed">
                  Become a part of our global travel community. Tell us a bit about yourself and your passion for travel.
                </p>

                <form className="space-y-6" onSubmit={handleJoinSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">First Name *</label>
                      <input 
                        type="text" 
                        placeholder="John" 
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Last Name *</label>
                      <input 
                        type="text" 
                        placeholder="Doe" 
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Email Address *</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Role of Interest</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-4 text-white focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer"
                    >
                      <option className="bg-emerald-950">Travel Specialist</option>
                      <option className="bg-emerald-950">Customer Care</option>
                      <option className="bg-emerald-950">Tour Guide</option>
                      <option className="bg-emerald-950">Marketing</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Profile Image / Resume</label>
                    <input 
                      type="file" 
                      accept="image/*,.pdf"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="w-full bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-500 file:text-white hover:file:bg-emerald-600 cursor-pointer"
                    />
                  </div>
                  
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full bg-white text-emerald-950 py-4 font-black tracking-widest uppercase hover:bg-emerald-50 transition shadow-xl disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}



          {/* Hero Content */}
          <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-between px-8 md:px-20 pt-10 pb-12 md:pb-32">
            {/* Main Title Left */}
            <div className="flex-1 flex flex-col items-start gap-4 z-10 mt-20 md:mt-0">
              <div className="relative w-full">
                <h1 className="text-[10vw] sm:text-[9vw] md:text-[8vw] lg:text-[7vw] font-black text-white leading-[0.8] uppercase tracking-tighter opacity-10 absolute -left-2 -top-2 select-none">
                  {cmsData?.hero?.titleLines?.[0] || "Experience"}
                </h1>
                <h1 className="text-[10vw] sm:text-[9vw] md:text-[8vw] lg:text-[7vw] font-black text-white leading-[0.8] uppercase tracking-tighter">
                  {cmsData?.hero?.titleLines?.[1] || "Unforgettable"}
                </h1>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4 mt-2">
                   <span className="text-4xl md:text-5xl lg:text-7xl font-['Dancing_Script',cursive] text-emerald-400 -rotate-6 ml-2 md:ml-0">
                      {cmsData?.hero?.titleLines?.[2] || "travel"}
                   </span>
                   <h1 className="text-[10vw] sm:text-[9vw] md:text-[8vw] lg:text-[7vw] font-black text-white leading-[0.8] uppercase tracking-tighter mt-1 md:mt-0">
                      {cmsData?.hero?.titleLines?.[3] || "Experiences"}
                   </h1>
                </div>
              </div>
            </div>
  
            {/* Couple Image Center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <div className="w-full h-full max-w-5xl flex items-end justify-center">
                  <img 
                      src={coupleImg} 
                      alt="Couple Trekking" 
                      className="w-auto h-[80%] md:h-[95%] object-contain object-bottom drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" 
                  />
              </div>
            </div>
  
            {/* Info & Button Right */}
            <div className="flex-1 flex flex-col items-center md:items-end text-center md:text-right gap-6 md:gap-8 z-30 mt-auto md:mt-0 w-full pb-0">
              <div className="max-w-xs space-y-4 flex flex-col items-center md:items-end">
                  <p className="text-white text-base md:text-xl font-medium leading-relaxed drop-shadow-md">
                      {cmsData?.hero?.subText || "Find amazing things to do. Anytime, anywhere."}
                  </p>
                  <Link to={cmsData?.hero?.buttonLink || "/welcome"} className="block w-full md:w-auto">
                    <button className="bg-emerald-600 text-white px-8 md:px-10 py-3 md:py-4 rounded-sm text-xs md:text-sm font-black uppercase tracking-widest hover:bg-emerald-700 transition-all transform hover:scale-105 shadow-xl flex items-center gap-3 md:ml-auto group pointer-events-auto w-full md:w-auto">
                        {cmsData?.hero?.buttonText || "Explore Our Tours"}
                        <span className="group-hover:translate-x-2 transition-transform">→</span>
                    </button>
                  </Link>
              </div>
            </div>
          </div>
      </section>

      {/* 2. Hotel Search Bar */}
      <section className="relative z-40 -mt-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white rounded-sm shadow-2xl p-4 md:p-6">
          <form onSubmit={handleHotelSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Destination / Hotel</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Where are you going?" 
                  value={searchParams.destination}
                  onChange={(e) => setSearchParams({...searchParams, destination: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Check In</label>
              <input 
                type="date" 
                value={searchParams.checkIn}
                onChange={(e) => setSearchParams({...searchParams, checkIn: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Check Out</label>
              <input 
                type="date" 
                value={searchParams.checkOut}
                onChange={(e) => setSearchParams({...searchParams, checkOut: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button 
              type="submit" 
              className="w-full md:w-auto bg-emerald-950 text-white px-8 py-3 text-sm font-black uppercase tracking-widest hover:bg-emerald-800 transition shadow-lg h-[46px]"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 3. Top Destinations */}
      <section className="pt-4 md:pt-8 pb-10 md:pb-20 max-w-6xl mx-auto px-4 text-center">
        <p className="text-emerald-700 text-sm mb-1 md:mb-2">{cmsData?.destinations?.sectionTitle || "Select your perfect trips"}</p>
        <h2 className="text-2xl md:text-3xl font-bold tracking-wider text-gray-900 mb-6 md:mb-12">{cmsData?.destinations?.sectionHeading || "TOP DESTINATION"}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {(cmsData?.destinations?.items?.length > 0 ? cmsData.destinations.items : [
            { img: destAmsterdam, title: 'Amsterdam, Netherland', description: 'Discover the charm of historic canals and vibrant culture in the heart of the Netherlands.' },
            { img: destLisbon, title: 'Lisbon, Portugal', description: 'Discover the charm of historic canals and vibrant culture in the heart of the Netherlands.' },
            { img: destDublin, title: 'Dublin, Ireland', description: 'Discover the charm of historic canals and vibrant culture in the heart of the Netherlands.' },
            { img: destExuma, title: 'Exuma, Bahamas', description: 'Discover the charm of historic canals and vibrant culture in the heart of the Netherlands.' }
          ]).map((dest, i) => (
            <Link to={dest.link || "/welcome"} key={i} className="text-center group cursor-pointer block">
              <div className="overflow-hidden mb-2 md:mb-4 aspect-square rounded-sm bg-gray-50 flex items-center justify-center">
                <img src={dest.image || dest.img} alt={dest.title} className="w-full h-full object-contain object-center group-hover:scale-110 transition duration-500" />
              </div>
              <h3 className="font-bold text-xs md:text-sm text-gray-900 mb-1 md:mb-3">{dest.title}</h3>
              <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed px-1 md:px-2 line-clamp-3">
                {dest.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Latest Tour */}
      <section className="relative py-32 bg-emerald-900 text-center text-white my-10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={cmsData?.latestTour?.backgroundImage || latestTourBg} alt="City Night" className="w-full h-full object-cover opacity-80" />
        </div>
        
        {/* Floating Images (Polaroid Style) */}
        <div className="absolute left-[2%] md:left-[5%] top-[5%] md:top-1/2 md:-translate-y-1/2 block z-10 opacity-70 md:opacity-100">
          <div className="bg-white p-1 pb-2 transform -rotate-12 border-2 border-white shadow-lg w-24 h-32 md:w-64 md:h-80">
            <img src={cmsData?.latestTour?.leftImage || destAmsterdam} alt="Tour Left" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="absolute right-[2%] md:right-[5%] bottom-[5%] md:bottom-auto md:top-1/2 md:-translate-y-1/2 block z-10 opacity-70 md:opacity-100">
          <div className="bg-white p-1 pb-2 transform rotate-12 border-2 border-white shadow-lg w-24 h-32 md:w-64 md:h-80">
            <img src={cmsData?.latestTour?.rightImage || destLisbon} alt="Tour Right" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="relative z-20 max-w-lg mx-auto px-4 py-8 md:py-0">
          <p className="text-xs md:text-sm mb-2 font-medium tracking-wide">{cmsData?.latestTour?.subtitle || "Last minute trip"}</p>
          <h2 className="text-3xl md:text-5xl font-black tracking-widest mb-6 md:mb-8">{cmsData?.latestTour?.title || "OUR LATEST TOUR"}</h2>
          <p className="text-xs md:text-sm mb-2 opacity-80">{cmsData?.latestTour?.dateText || "Fri 15 March to Sun 17 March"}</p>
          <p className="text-lg md:text-xl font-bold mb-8 md:mb-10">{cmsData?.latestTour?.priceText || "$125 per person"}</p>
          <Link to={cmsData?.latestTour?.buttonLink || "/welcome"} className="inline-block bg-white text-emerald-950 px-8 md:px-12 py-3 md:py-4 text-xs md:text-sm font-black tracking-widest hover:bg-emerald-50 transition shadow-xl uppercase">
            {cmsData?.latestTour?.buttonText || "BOOK NOW"}
          </Link>
        </div>
      </section>

      {/* 5. Travel Tips / Flight Search (Removed as requested) */}

      {/* 6. Categories */}
      <section className="pt-4 pb-10 md:pb-20 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { title: 'Hotels', icon: <Hotel />, img: hotelImg, type: 'hotel' },
            { title: 'Destination Wedding', icon: <Umbrella />, img: weddingImg, type: 'wedding' },
            { title: 'Tour', icon: <Briefcase />, img: tourImg, type: 'tour' }
          ].map((cat, i) => (
            <div key={i} className="text-center flex flex-col items-center">
              <div className="w-full h-32 md:h-48 mb-3 md:mb-6 overflow-hidden">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-4">{cat.title}</h3>
              <Link to={`/welcome?type=${cat.type}`} className="bg-emerald-600 text-white px-6 md:px-8 py-1.5 md:py-2 text-xs md:text-sm hover:bg-emerald-700 transition">
                Search
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Services Section */}
      <section className="pt-4 pb-10 md:pb-20 max-w-6xl mx-auto px-4 text-center">
        <p className="text-emerald-700 text-xs md:text-sm mb-1 md:mb-2 font-medium">{cmsData?.services?.sectionSubtitle || "We fulfill your needs"}</p>
        <div className="relative inline-block mb-8 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-black tracking-widest text-gray-900">{cmsData?.services?.sectionTitle || "SERVICES"}</h2>
          <div className="absolute -left-12 top-1/2 w-10 h-[2px] bg-gray-200 hidden md:block"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12">
          {(cmsData?.services?.items?.length > 0 ? cmsData.services.items : [
            { title: 'Small transport', description: 'Reliable and comfortable transportation services for your local tours and transfers.', iconUrl: 'https://cdn-icons-gif.flaticon.com/15576/15576191.gif' },
            { title: 'Events', description: 'Plan and execute unforgettable events and gatherings with our expert coordination.', iconUrl: 'https://cdn-icons-gif.flaticon.com/8701/8701055.gif' },
            { title: 'Vacation package', description: 'Tailor-made vacation packages designed to give you the ultimate travel experience.', iconUrl: 'https://cdn-icons-gif.flaticon.com/19034/19034819.gif' },
            { title: 'Resorts stay', description: 'Handpicked luxury resorts and stays for your perfect relaxation and comfort.', iconUrl: 'https://cdn-icons-gif.flaticon.com/19008/19008727.gif' }
          ]).map((svc, i) => (
            <div key={i} className="flex flex-col items-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mb-2 md:mb-6">
                <img src={svc.iconUrl} alt={svc.title} className="w-10 h-10 md:w-16 md:h-16 object-contain" />
              </div>
              <h4 className="text-sm md:text-lg font-bold text-gray-800 mb-1 md:mb-4">{svc.title}</h4>
              <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed px-1 md:px-0">
                {svc.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 8. About Us Section */}
      <section id="about" className="py-10 md:py-20 max-w-6xl mx-auto px-4">
        <div className="text-center mb-8 md:mb-16">
          <p className="text-emerald-700 text-xs md:text-sm mb-1 md:mb-2 font-medium">Our featured story</p>
          <div className="relative inline-block">
            <h2 className="text-2xl md:text-4xl font-black tracking-widest text-gray-900">ABOUT US</h2>
            <div className="absolute -left-12 top-1/2 w-10 h-[2px] bg-gray-200 hidden md:block"></div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 md:gap-16 items-center">
          {/* Left Image */}
          <div className="lg:w-1/2 relative w-full">
            <img src={destExuma} alt="About Us" className="w-full h-[250px] md:h-[500px] object-cover shadow-xl md:shadow-2xl rounded-sm" />
            <div className="absolute -right-8 bottom-8 hidden lg:block">
               <div className="bg-emerald-600 p-6 rounded-sm shadow-xl text-white">
                  <Navigation size={48} />
               </div>
            </div>
          </div>

          {/* Right Content - Milestones */}
          <div className="lg:w-1/2 w-full space-y-6 md:space-y-10">
            {[
              { title: "Our never ending footsteps", desc: "Since our inception, we have been dedicated to exploring the uncharted and bringing the best stories to you." },
              { title: "Our total trips till now", desc: "Over 500+ successful group tours and thousands of happy individual travelers across the globe." },
              { title: "Our most incredible moments to share", desc: "Every journey is a story. We cherish the smiles and memories we've created with our community." },
              { title: "Our travel book released on 1991 year", desc: "A legacy of travel excellence that started decades ago, now evolved into a modern travel partner." }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 md:gap-6 items-start group">
                <div className="bg-white border-2 border-emerald-100 p-2 md:p-3 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="space-y-1 md:space-y-2 border-b border-gray-100 pb-4 md:pb-6 w-full">
                  <h4 className="text-sm md:text-lg font-bold text-gray-800">{item.title}</h4>
                  <p className="text-xs md:text-sm text-gray-500 leading-relaxed max-w-md">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Our Staff Section */}
      <section className="relative mt-0 md:mt-20">
        {/* Staff Banner */}
        <div className="relative h-[250px] md:h-[400px] flex flex-col items-center justify-center text-center text-white px-4">
          <div className="absolute inset-0 z-0">
            <img src={heroBg} alt="Staff Banner" className="w-full h-full object-cover brightness-[0.4]" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-4 md:space-y-6">
            <h2 className="text-2xl md:text-4xl font-black tracking-widest">{cmsData?.staff?.sectionTitle || "OUR STAFF"}</h2>
            <p className="text-xs md:text-sm opacity-80 leading-relaxed">
              {cmsData?.staff?.description || "Our team of dedicated travel experts is here to ensure your journey is smooth, safe, and unforgettable. Meet the people who make MyDESTINATION the best in the business."}
            </p>
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className="bg-white text-emerald-950 px-6 md:px-10 py-2 md:py-3 rounded-sm text-[10px] md:text-xs font-black tracking-widest hover:bg-emerald-50 transition uppercase"
            >
              JOIN NOW
            </button>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="max-w-7xl mx-auto px-4 -mt-10 md:-mt-20 relative z-20 pb-10 md:pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {(cmsData?.staff?.items?.length > 0 ? cmsData.staff.items : [
              { name: "Elly Spitch", role: "CUSTOMER CARE", img: destAmsterdam, description: "Expert in providing personalized travel solutions and ensuring customer satisfaction." },
              { name: "Hannah Zafron", role: "SPECIALIST", img: destLisbon, description: "Expert in providing personalized travel solutions and ensuring customer satisfaction." },
              { name: "Janne Dcosta", role: "FOUNDER", img: destDublin, description: "Expert in providing personalized travel solutions and ensuring customer satisfaction." },
              { name: "Adam Johnson", role: "PRESIDENT", img: destExuma, description: "Expert in providing personalized travel solutions and ensuring customer satisfaction." }
            ]).map((staff, i) => (
              <div key={i} className="bg-white p-2 shadow-xl text-center group">
                <div className="aspect-square overflow-hidden mb-3 md:mb-6">
                  <img src={staff.image || staff.img} alt={staff.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                </div>
                <h4 className="text-sm md:text-lg font-bold text-gray-900">{staff.name}</h4>
                <p className="text-[10px] md:text-xs text-emerald-600 font-bold tracking-widest mb-2 md:mb-4 uppercase">{staff.role}</p>
                <p className="text-[10px] md:text-xs text-gray-500 mb-3 md:mb-6 px-1 md:px-4">
                  {staff.description}
                </p>
                <button className="border md:border-2 border-gray-200 px-3 md:px-6 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] font-bold text-gray-400 hover:bg-emerald-600 hover:border-emerald-600 hover:text-white transition-all uppercase mb-2 md:mb-4">
                  Contact Me
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. Footer (Minimal) */}
      <footer className="bg-emerald-950 text-white pt-16 pb-8 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src={logo} alt="MyDESTINATION" className="h-10 w-auto brightness-0 invert" />
              <span className="font-bold text-xl">{cmsData?.footer?.companyName || "MyDESTINATION"}</span>
            </div>
            <p className="text-xs text-gray-400">
              {cmsData?.footer?.companyDescription || "Your ultimate companion for unforgettable journeys. We provide premium travel services, personalized itineraries, and the best deals for your next adventure."}
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Quick links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#about">About us</a></li>
              <li><Link to="/home">Services</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Contact Info</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-start gap-2"><MapPin size={16} className="mt-1 flex-shrink-0" /> {cmsData?.footer?.address || "1 My Address, My Street, New York City, NY, USA"}</li>
              {cmsData?.footer?.phone && (
                <li className="flex items-start gap-2">📞 {cmsData.footer.phone}</li>
              )}
              {cmsData?.footer?.email && (
                <li className="flex items-start gap-2">✉️ {cmsData.footer.email}</li>
              )}
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Pay safely with us</h4>
            <p className="text-xs text-gray-400">{cmsData?.footer?.paymentNote || "The payment is encrypted and transmitted securely with an SSL protocol."}</p>
          </div>
        </div>
        <div className="text-center border-t border-gray-800 pt-8 text-xs text-gray-500">
          {cmsData?.footer?.copyrightText || `© ${new Date().getFullYear()} MyDESTINATION. All rights reserved.`}
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
