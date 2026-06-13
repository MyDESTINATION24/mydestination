import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, DollarSign, Info, Navigation, CheckCircle, Car, Activity, Hotel, Umbrella, HandCoins, Briefcase, ChevronLeft, ChevronRight, Play, User, Calendar, Moon, Wifi, Coffee, Shield } from 'lucide-react';
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

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

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

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [heroBg, destAmsterdam, destLisbon, destDublin, destExuma];

  // Scroll State for Navbar
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

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
      {/* 1. Hero Section (Redesigned Phase 1) */}
      <section className="relative min-h-screen w-full flex flex-col bg-gray-100 overflow-hidden pb-20">
        
        {/* Background Image Slider */}
        {slides.map((slide, index) => (
          <div 
            key={index} 
            className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${currentSlide === index ? 'opacity-100' : 'opacity-0'}`}
          >
            <img src={slide} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20"></div>
          </div>
        ))}

        {/* Left/Right Slider Controls */}
        <button 
           onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
           className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#22c55e] text-[#22c55e] flex items-center justify-center hover:bg-[#22c55e] hover:text-white transition-all bg-transparent group"
        >
           <ChevronLeft size={20} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <button 
           onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
           className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-[#22c55e] text-[#22c55e] flex items-center justify-center hover:bg-[#22c55e] hover:text-white transition-all bg-transparent group"
        >
           <ChevronRight size={20} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex gap-3">
           {slides.map((_, idx) => (
              <button 
                 key={idx}
                 onClick={() => setCurrentSlide(idx)}
                 className={`w-3 h-3 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-[#22c55e] scale-125' : 'bg-white/60 hover:bg-white'}`}
              />
           ))}
        </div>
        
        {/* Floating White Navbar (Now Fixed with Dark Background on Scroll) */}
        <div className={`fixed top-0 left-0 w-full z-[100] px-4 md:px-12 transition-all duration-500 flex items-center ${isScrolled ? 'bg-[#0f172a]/80 backdrop-blur-md py-3 shadow-xl' : 'bg-transparent pt-6 md:pt-8'}`}>
          <nav className="bg-white rounded-2xl flex items-center justify-between px-6 py-1 w-full max-w-6xl mx-auto shadow-2xl border border-gray-100/50">
            <div className="flex items-center gap-2">
              <div className="h-8 md:h-9 w-8 md:w-9 overflow-hidden flex-shrink-0">
                <img src={logo} alt="Logo Icon" className="h-full w-auto max-w-none object-left object-cover" />
              </div>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-10 text-slate-600 text-[15px] font-medium tracking-wide">
              <div className="flex items-center gap-8">
                <a href="#" className="hover:text-slate-900 transition">Home</a>
                <a href="#about" className="hover:text-slate-900 transition">About</a>
                <a href="#room" className="hover:text-slate-900 transition">Room</a>
                <a href="#feature" className="hover:text-slate-900 transition">Feature</a>
                <a href="#news" className="hover:text-slate-900 transition">News</a>
              </div>
              <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
                <button onClick={() => navigate('/login')} className="text-slate-700 font-bold hover:text-[#22c55e] transition">Log In</button>
                <button onClick={() => navigate('/signup')} className="bg-[#22c55e] text-white px-5 py-2 rounded-full font-bold hover:bg-green-600 transition shadow-md">Sign Up</button>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="lg:hidden text-slate-800 p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </nav>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="fixed top-[80px] left-4 right-4 bg-white rounded-xl shadow-2xl z-[100] lg:hidden overflow-hidden border border-gray-100">
            <div className="flex flex-col text-gray-800 text-[15px] font-medium">
              <a href="#" onClick={() => setIsMobileMenuOpen(false)} className="p-4 border-b border-gray-50 hover:bg-gray-50">Home</a>
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="p-4 border-b border-gray-50 hover:bg-gray-50">About</a>
              <a href="#room" onClick={() => setIsMobileMenuOpen(false)} className="p-4 border-b border-gray-50 hover:bg-gray-50">Room</a>
              <a href="#feature" onClick={() => setIsMobileMenuOpen(false)} className="p-4 border-b border-gray-50 hover:bg-gray-50">Feature</a>
              <a href="#news" onClick={() => setIsMobileMenuOpen(false)} className="p-4 border-b border-gray-50 hover:bg-gray-50">News</a>
              <div className="p-4 flex gap-3">
                <button onClick={() => { setIsMobileMenuOpen(false); navigate('/login'); }} className="flex-1 border border-gray-200 text-slate-700 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition">Log In</button>
                <button onClick={() => { setIsMobileMenuOpen(false); navigate('/signup'); }} className="flex-1 bg-[#22c55e] text-white py-2.5 rounded-lg font-bold hover:bg-green-600 transition shadow-md">Sign Up</button>
              </div>
            </div>
          </div>
        )}

        {/* Promo Strip at the Bottom */}
        <div className="absolute bottom-0 left-0 w-full bg-white py-3 z-20 flex flex-col md:flex-row items-center justify-center gap-4 px-4 border-t-4 border-gray-100/50 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
           <p className="text-gray-800 font-medium text-[15px] text-center">
              Website is for Adv. Purpose for booking — install our app from the Play Store
           </p>
           <button className="bg-black text-white px-5 py-2 rounded-lg flex items-center gap-3 hover:bg-gray-800 transition transform hover:scale-105 shadow-md">
              <Play size={20} className="text-[#22c55e] fill-current" />
              <div className="text-left flex flex-col leading-none">
                 <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-300">GET IT ON</span>
                 <span className="text-sm font-bold tracking-wide">Google Play</span>
              </div>
           </button>
        </div>

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
                    <label className="text-xs font-bold text-[#22c55e] uppercase tracking-widest">Full Name</label>
                    <input 
                      type="text" 
                      placeholder="Your Name" 
                      className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#22c55e] uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="example@mail.com" 
                      className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#22c55e] uppercase tracking-widest">Message</label>
                    <textarea 
                      rows="4" 
                      placeholder="How can we help you?" 
                      className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e] transition resize-none"
                    ></textarea>
                  </div>
                  
                  <button className="w-full bg-[#22c55e] text-white py-4 font-black tracking-widest uppercase hover:bg-green-600 transition shadow-xl">
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
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 w-full max-w-3xl rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
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

                <form className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6" onSubmit={handleJoinSubmit}>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#22c55e] uppercase tracking-widest">First Name *</label>
                    <input 
                      type="text" 
                      placeholder="John" 
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#22c55e] uppercase tracking-widest">Last Name *</label>
                    <input 
                      type="text" 
                      placeholder="Doe" 
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#22c55e] uppercase tracking-widest">Email Address *</label>
                    <input 
                      type="email" 
                      placeholder="john@example.com" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#22c55e] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#22c55e] uppercase tracking-widest">Role of Interest</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-white focus:outline-none focus:border-[#22c55e] transition appearance-none cursor-pointer"
                    >
                      <option className="bg-[#0f172a]">Travel Specialist</option>
                      <option className="bg-[#0f172a]">Customer Care</option>
                      <option className="bg-[#0f172a]">Tour Guide</option>
                      <option className="bg-[#0f172a]">Marketing</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-[#22c55e] uppercase tracking-widest">Profile Image / Resume</label>
                    <input 
                      type="file" 
                      accept="image/*,.pdf"
                      onChange={(e) => setImageFile(e.target.files[0])}
                      className="w-full bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#22c55e] transition file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#22c55e] file:text-white hover:file:bg-green-600 cursor-pointer"
                    />
                  </div>
                  
                  <button 
                    disabled={isSubmitting}
                    type="submit"
                    className="w-full col-span-1 md:col-span-2 bg-white text-[#0f172a] py-3 md:py-4 font-black tracking-widest uppercase hover:bg-gray-100 transition shadow-xl disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
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
                  className="w-full bg-gray-50 border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#22c55e] transition"
                />
              </div>
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Check In</label>
              <input 
                type="date" 
                value={searchParams.checkIn}
                onChange={(e) => setSearchParams({...searchParams, checkIn: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e] transition"
              />
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Check Out</label>
              <input 
                type="date" 
                value={searchParams.checkOut}
                onChange={(e) => setSearchParams({...searchParams, checkOut: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-[#22c55e] transition"
              />
            </div>

            <button 
              type="submit" 
              className="w-full md:w-auto bg-[#0f172a] text-white px-8 py-3 text-sm font-black uppercase tracking-widest hover:bg-[#0f172a]/90 transition shadow-lg h-[46px]"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 3. Rooms Grid Section (Redesigned Phase 3) */}
      <section id="room" className="py-16 md:py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-20">
            <h4 className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-3">ROOMS</h4>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 font-serif tracking-tight">Hand Picked Rooms</h2>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {[
              { img: destAmsterdam, title: 'Deluxe Suite', description: 'Well-appointed rooms designed for guests who prefer extra comfort.', price: '₹2500/night' },
              { img: destLisbon, title: 'Family Suite', description: 'Consist of multiple rooms and a common living area, perfect for families.', price: '₹5000/night' },
              { img: destDublin, title: 'Luxury Penthouse', description: 'Top-tier accommodations usually on the highest floors of a hotel with panoramic views.', price: '₹12500/night' }
            ].map((room, i) => (
              <motion.div variants={fadeUp} key={i} className="group relative flex flex-col items-center">
                {/* Room Image */}
                <div className="w-full h-[250px] md:h-[350px] overflow-hidden shadow-xl rounded-sm z-0">
                  <img src={room.img} alt={room.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-in-out" />
                </div>
                
                {/* Floating Info Box */}
                <div className="bg-white p-6 md:p-8 w-[90%] -mt-16 md:-mt-20 z-10 shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-sm border border-gray-100 flex flex-col group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 font-serif leading-tight">{room.title}</h3>
                    <div className="text-right">
                       <span className="text-base md:text-lg font-black text-[#22c55e]">{room.price}</span>
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">
                    {room.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Phase 4: Intro Video & Facilities */}
      <section className="py-16 md:py-24 bg-white relative">
        {/* Dark Banner (Intro Video) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 md:mb-32">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="relative w-full h-auto md:h-[400px] flex flex-col md:flex-row overflow-hidden shadow-2xl rounded-sm bg-[#0f172a]">
            {/* Background Split for Desktop */}
            <div className="absolute inset-0 hidden md:flex">
              <div className="w-[75%] bg-[#0f172a] h-full"></div>
              <div className="w-[25%] bg-[#4ade80] h-full"></div>
            </div>
            
            {/* Content Container */}
            <div className="relative z-10 w-full flex flex-col md:flex-row items-center h-full p-8 md:p-0">
              
              {/* Text Side */}
              <motion.div variants={fadeUp} className="w-full md:w-[60%] md:pl-16 md:pr-8 flex flex-col justify-center text-left py-8 md:py-0">
                <p className="text-[#4ade80] font-bold text-xs md:text-sm tracking-widest mb-2 uppercase">INTRO VIDEO</p>
                <h2 className="text-3xl md:text-4xl font-black text-white font-serif tracking-wide leading-tight mb-4">
                  {cmsData?.introVideoAndFacilities?.bannerText || "Destination events success"}
                </h2>
                <p className="text-white/90 text-sm md:text-[15px] leading-relaxed max-w-lg mb-8 font-medium">
                  Good Accommodation,enjoying accessibility, activities & attraction etc<br className="hidden md:block" />
                  Creating thriving communities where tourism benefits everyone<br className="hidden md:block" />
                  Including local residents and the environment. Dreaming of going<br className="hidden md:block" />
                  somewhere or doing something special ?? We're here to help you
                </p>
                
                <button className="bg-black text-white px-4 py-2 rounded-md flex items-center gap-3 border border-gray-700 hover:bg-gray-800 transition shadow-md w-fit">
                  <Play size={24} className="text-[#4ade80] fill-current" />
                  <div className="text-left flex flex-col leading-none">
                     <span className="text-[9px] uppercase tracking-wider font-semibold text-gray-300 mb-0.5">GET IT ON</span>
                     <span className="text-[15px] font-bold tracking-wide">Google Play</span>
                  </div>
                </button>
              </motion.div>

              {/* Video Side */}
              <motion.div variants={fadeUp} className="w-full md:w-[40%] h-[250px] md:h-[80%] md:pr-12 relative mt-8 md:mt-0 flex items-center justify-center md:justify-end">
                <div className="w-full h-full shadow-2xl bg-slate-200">
                  {cmsData?.introVideoAndFacilities?.videoLink ? (
                    <video 
                      src={cmsData.introVideoAndFacilities.videoLink} 
                      autoPlay 
                      loop 
                      muted 
                      playsInline 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <>
                      <img src={cmsData?.introVideoAndFacilities?.thumbnailImage || hotelImg} alt="Hotel Room Video Thumbnail" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center cursor-pointer group hover:bg-black/40 transition-all duration-500">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <Play size={32} className="text-white fill-white ml-1 opacity-80 group-hover:opacity-100" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>

        {/* Core Features (Facilities) */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="mb-16 md:mb-20">
            <h4 className="text-sm font-bold text-[#22c55e] tracking-widest uppercase mb-3">{cmsData?.introVideoAndFacilities?.facilitiesSubtitle || "FACILITIES"}</h4>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 font-serif tracking-tight">{cmsData?.introVideoAndFacilities?.facilitiesTitle || "Core Features"}</h2>
            <div className="w-20 h-1 bg-[#22c55e] mx-auto mt-6 rounded-full opacity-50"></div>
          </div>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            {(cmsData?.introVideoAndFacilities?.features?.length > 0 ? cmsData.introVideoAndFacilities.features : [
                { title: 'High Rating', description: 'Consistently praised by our guests for exceptional hospitality, comfort, and premium service.', iconType: 'Star' },
                { title: 'Quiet Hours', description: 'Enjoy peaceful and uninterrupted nights with our strictly maintained quiet hours policy.', iconType: 'Moon' },
                { title: 'Best Location', description: 'Perfectly situated in the heart of the city, just steps away from all major tourist attractions.', iconType: 'MapPin' }
            ]).map((feature, idx) => (
                <motion.div variants={fadeUp} key={idx} className="flex flex-col items-center group hover:-translate-y-2 transition-transform duration-500">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 md:border-[3px] border-[#22c55e] bg-white flex items-center justify-center mb-4 md:mb-6 group-hover:bg-[#22c55e] transition-colors duration-500 shadow-xl relative">
                    <div className="absolute inset-[-6px] md:inset-[-8px] border border-[#22c55e]/30 rounded-full scale-90 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                    {(() => {
                        const Icon = {
                            Star: Star,
                            Moon: Moon,
                            MapPin: MapPin,
                            Wifi: Wifi,
                            Coffee: Coffee,
                            Shield: Shield
                        }[feature.iconType] || Star;
                        return <Icon size={32} className="text-[#22c55e] group-hover:text-white transition-colors duration-500" />;
                    })()}
                  </div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 font-serif mb-3">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-xs">
                    {feature.description}
                  </p>
                </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Latest Tour */}
      <section id="news" className="relative py-32 bg-[#0f172a] text-center text-white my-10 overflow-hidden">
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
          <Link to={cmsData?.latestTour?.buttonLink || "/welcome"} className="inline-block bg-white text-[#0f172a] px-8 md:px-12 py-3 md:py-4 text-xs md:text-sm font-black tracking-widest hover:bg-gray-100 transition shadow-xl uppercase">
            {cmsData?.latestTour?.buttonText || "BOOK NOW"}
          </Link>
        </div>
      </section>

      {/* 5. Travel Tips / Flight Search (Removed as requested) */}

      {/* 6. Categories */}
      <section className="pt-4 pb-10 md:pb-20 max-w-6xl mx-auto px-4">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {[
            { title: 'Hotels', icon: <Hotel />, img: hotelImg, type: 'hotel' },
            { title: 'Destination Wedding', icon: <Umbrella />, img: weddingImg, type: 'wedding' },
            { title: 'Tour', icon: <Briefcase />, img: tourImg, type: 'tour' }
          ].map((cat, i) => (
            <motion.div variants={fadeUp} key={i} className="text-center flex flex-col items-center">
              <div className="w-full h-32 md:h-48 mb-3 md:mb-6 overflow-hidden">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-lg md:text-xl font-medium mb-2 md:mb-4">{cat.title}</h3>
              <Link to={`/welcome?type=${cat.type}`} className="bg-[#22c55e] text-white px-6 md:px-8 py-1.5 md:py-2 text-xs md:text-sm hover:bg-[#22c55e]/90 transition">
                Search
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 7. Services Section */}
      <section id="feature" className="pt-4 pb-10 md:pb-20 max-w-6xl mx-auto px-4 text-center">
        <p className="text-[#22c55e] text-xs md:text-sm mb-1 md:mb-2 font-medium">{cmsData?.services?.sectionSubtitle || "We fulfill your needs"}</p>
        <div className="relative inline-block mb-8 md:mb-16">
          <h2 className="text-2xl md:text-4xl font-black tracking-widest text-gray-900">{cmsData?.services?.sectionTitle || "SERVICES"}</h2>
          <div className="absolute -left-12 top-1/2 w-10 h-[2px] bg-gray-200 hidden md:block"></div>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-12">
          {(cmsData?.services?.items?.length > 0 ? cmsData.services.items : [
            { title: 'Small transport', description: 'Reliable and comfortable transportation services for your local tours and transfers.', iconUrl: 'https://cdn-icons-gif.flaticon.com/15576/15576191.gif' },
            { title: 'Events', description: 'Plan and execute unforgettable events and gatherings with our expert coordination.', iconUrl: 'https://cdn-icons-gif.flaticon.com/8701/8701055.gif' },
            { title: 'Vacation package', description: 'Tailor-made vacation packages designed to give you the ultimate travel experience.', iconUrl: 'https://cdn-icons-gif.flaticon.com/19034/19034819.gif' },
            { title: 'Resorts stay', description: 'Handpicked luxury resorts and stays for your perfect relaxation and comfort.', iconUrl: 'https://cdn-icons-gif.flaticon.com/19008/19008727.gif' }
          ]).map((svc, i) => (
            <motion.div variants={fadeUp} key={i} className="flex flex-col items-center hover:scale-105 transition-transform">
              <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center mb-2 md:mb-6">
                <img src={svc.iconUrl} alt={svc.title} className="w-10 h-10 md:w-16 md:h-16 object-contain" />
              </div>
              <h4 className="text-sm md:text-lg font-bold text-gray-800 mb-1 md:mb-4">{svc.title}</h4>
              <p className="text-[10px] md:text-xs text-gray-500 leading-relaxed px-1 md:px-0">
                {svc.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 8. About Us Section (Redesigned Phase 2) */}
      <section id="about" className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          
          {/* Left Side - Masonry Grid */}
          <motion.div variants={fadeUp} className="w-full lg:w-1/2 grid grid-cols-2 gap-4 md:gap-6">
            {/* Top Left - Strong Team Box */}
            <div className="bg-white flex flex-col items-center justify-center p-6 text-center shadow-lg rounded-sm border border-gray-50 h-[200px] md:h-[280px]">
              <User size={48} className="text-[#22c55e] mb-4" />
              <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-3 font-serif">Strong Team</h3>
              <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-medium">
                Unlocking Hospitality Excellence And Ensures Your Perfect Stay
              </p>
            </div>

            {/* Top Right - Image */}
            <div className="h-[200px] md:h-[280px] w-full overflow-hidden rounded-sm shadow-md">
              <img src={destLisbon} alt="Relaxing Pool" className="w-full h-full object-cover hover:scale-110 transition duration-700" />
            </div>

            {/* Bottom Left - Image */}
            <div className="h-[200px] md:h-[280px] w-full overflow-hidden rounded-sm shadow-md">
              <img src={hotelImg} alt="City View" className="w-full h-full object-cover hover:scale-110 transition duration-700" />
            </div>

            {/* Bottom Right - Luxury Room Box */}
            <div className="bg-slate-900 flex flex-col items-center justify-center p-6 text-center shadow-lg rounded-sm h-[200px] md:h-[280px]">
              <Calendar size={48} className="text-[#22c55e] mb-4" />
              <h3 className="text-xl md:text-2xl font-black text-white mb-3 font-serif">Luxury Room</h3>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                Experience Unrivaled Comfort & Elegance
              </p>
            </div>
          </motion.div>

          {/* Right Side - Content */}
          <motion.div variants={fadeUp} className="w-full lg:w-1/2 space-y-6 md:space-y-8">
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-slate-500 tracking-widest uppercase">ABOUT US</h4>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 font-serif tracking-tight">My DESTINATION</h2>
            </div>
            
            <p className="text-slate-600 text-[15px] md:text-base leading-relaxed md:leading-loose">
              A wedding in India is a culturally rich, multi-day celebration involving elaborate ceremonies, vibrant decorations, and various traditions that differ by region, community, and religion & An event planner is a professional who organizes and manages all aspects of an event, from initial concept to final execution, ensuring it runs smoothly and meets the client's goals. They handle tasks such as budget management, vendor coordination (like caterers and decorators), venue selection, logistics, and creating event themes and schedules.
            </p>

            <button className="bg-black text-white px-6 py-2.5 rounded-lg flex items-center gap-3 hover:bg-gray-800 transition transform hover:scale-105 shadow-md w-fit mt-8">
              <Play size={24} className="text-[#22c55e] fill-current" />
              <div className="text-left flex flex-col leading-none">
                 <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-300">GET IT ON</span>
                 <span className="text-base font-bold tracking-wide">Google Play</span>
              </div>
            </button>
          </motion.div>
          
        </motion.div>
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
              <div className="h-10 w-10 overflow-hidden flex-shrink-0">
                <img src={logo} alt="Logo Icon" className="h-full w-auto max-w-none object-left object-cover brightness-0 invert" />
              </div>
              <span className="font-bold text-xl tracking-widest">My DESTINATION</span>
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
