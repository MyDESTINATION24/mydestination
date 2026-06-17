import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, DollarSign, Info, Navigation, CheckCircle, Car, Activity, Hotel, Umbrella, HandCoins, Briefcase, ChevronLeft, ChevronRight, Play, User, Calendar, Moon, Wifi, Coffee, Shield, ChevronDown, Camera, Glasses } from 'lucide-react';
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
import bagImg from '../assets/landing/bag.png';
import { Facebook, Twitter, Instagram, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/apiService';

const LandingPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
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
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hotel Search State
  const [searchParams, setSearchParams] = useState({
    destination: '',
    checkIn: '',
    checkOut: ''
  });

  // Slider State
  const [currentSlide, setCurrentSlide] = useState(0);
  const defaultSlides = [heroBg, destAmsterdam, destLisbon, destDublin, destExuma];

  const activeSlides = cmsData?.hero?.backgroundImages?.length > 0
    ? cmsData.hero.backgroundImages
    : defaultSlides;

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
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

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
      // Taxi (Tours) routes need taxiUserToken â€” taxi has its own login
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
      if (profileImageFile) {
        submitData.append('profileImage', profileImageFile);
      }
      if (resumeFile) {
        submitData.append('resume', resumeFile);
      }

      const res = await api.post('/cms/career/apply', submitData);

      if (res.data.success) {
        toast.success('Application submitted successfully!');
        setIsJoinModalOpen(false);
        setFormData({ firstName: '', lastName: '', email: '', role: 'Travel Specialist' });
        setProfileImageFile(null);
        setResumeFile(null);
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
        {activeSlides.map((slide, index) => {
          const safeCurrentSlide = currentSlide >= activeSlides.length ? 0 : currentSlide;
          return (
            <div
              key={index}
              className={`absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out ${safeCurrentSlide === index ? 'opacity-100' : 'opacity-0'}`}
            >
              <img src={slide} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
          )
        })}



        {/* Dot Indicators */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {activeSlides.map((_, idx) => {
            const safeCurrentSlide = currentSlide >= activeSlides.length ? 0 : currentSlide;
            return (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${safeCurrentSlide === idx ? 'bg-[#065f46] scale-125' : 'bg-white/60 hover:bg-white'}`}
              />
            )
          })}
        </div>

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 mt-16 pointer-events-none">
          {(cmsData?.hero?.textBlocks && cmsData.hero.textBlocks.length > 0) ? (
            cmsData.hero.textBlocks.map((block, idx) => {
              if (block.tag === 'h1') {
                return <h1 key={idx} className="text-white text-4xl md:text-6xl font-black mt-10 mb-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-widest uppercase">{block.text}</h1>;
              } else if (block.tag === 'h2') {
                return <h2 key={idx} className="text-white text-3xl md:text-5xl font-medium tracking-wide leading-tight mt-2 mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{block.text}</h2>;
              } else if (block.tag === 'h3') {
                return <h3 key={idx} className="text-white text-2xl md:text-4xl mt-6 mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif">{block.text}</h3>;
              } else if (block.tag === 'p') {
                return <p key={idx} className="text-white/90 text-xs md:text-sm max-w-xl mx-auto tracking-widest leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium mt-6"><span dangerouslySetInnerHTML={{ __html: block.text.replace(/\n/g, '<br />') }} /></p>;
              }
              return null;
            })
          ) : (
            <>
              <h2 className="text-white text-3xl md:text-5xl font-medium tracking-wide leading-tight mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                We give you <br /> strong desire to travel & <br /> explore the world
              </h2>
              <h1 className="text-white text-4xl md:text-6xl mt-12 mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif uppercase tracking-widest">Tourism</h1>
              <p className="text-white/90 text-[10px] md:text-[13px] max-w-xl mx-auto tracking-widest leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium mt-6">
                Embark on an unforgettable journey to the world's most breathtaking destinations. <br className="hidden md:block" /> Discover new cultures, create lasting memories, and let your adventure begin.
              </p>
            </>
          )}
        </div>

        {/* Flat Transparent Navbar */}
        <div className={`fixed top-0 left-0 w-full z-[100] px-4 md:px-12 transition-all duration-500 flex items-center ${isScrolled ? 'bg-white py-3 shadow-xl' : 'bg-transparent pt-6 md:pt-8'}`}>
          <nav className="flex items-center justify-between w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 md:h-12 md:w-12 overflow-hidden flex-shrink-0">
                <img src={logo} alt="Logo Icon" className="h-full w-full object-cover" />
              </div>
              {/* Removed Tourism text here as per request */}
            </div>

            {/* Desktop Menu */}
            <div className={`hidden lg:flex items-center gap-10 text-[13px] font-medium tracking-widest uppercase transition-colors duration-300 ${isScrolled ? 'text-slate-700' : 'text-white'}`}>
              <a href="#" onClick={(e) => handleScrollTo(e, 'home')} className={`transition-colors ${isScrolled ? 'hover:text-black' : 'hover:text-gray-300'}`}>HOME</a>
              <a href="#feature" onClick={(e) => handleScrollTo(e, 'feature')} className={`transition-colors ${isScrolled ? 'hover:text-black' : 'hover:text-gray-300'}`}>SERVICES</a>
              <a href="#about" onClick={(e) => handleScrollTo(e, 'about')} className={`transition-colors ${isScrolled ? 'hover:text-black' : 'hover:text-gray-300'}`}>ABOUT US</a>
              <a href="#staff" onClick={(e) => handleScrollTo(e, 'staff')} className={`transition-colors ${isScrolled ? 'hover:text-black' : 'hover:text-gray-300'}`}>OUR STAFF</a>

              {/* Auth Buttons */}
              <div className="flex items-center gap-6 ml-4 border-l pl-8 border-white/20">
                <Link to="/login" className={`transition-colors font-bold ${isScrolled ? 'hover:text-black' : 'hover:text-gray-300'}`}>LOGIN</Link>
                <Link to="/signup" className={`transition-colors px-6 py-2.5 font-bold tracking-widest shadow-lg ${isScrolled ? 'bg-[#065f46] text-white hover:bg-[#04402f]' : 'bg-white text-[#065f46] hover:bg-gray-100'}`}>
                  REGISTER
                </Link>
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className={`lg:hidden p-2 transition-colors duration-300 ${isScrolled ? 'text-slate-900' : 'text-white'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </nav>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="fixed top-[80px] left-4 right-4 bg-white rounded-xl shadow-2xl z-[100] lg:hidden overflow-hidden border border-gray-100">
            <div className="flex flex-col text-gray-800 font-medium uppercase tracking-widest text-[13px]">
              <a href="#" onClick={(e) => { setIsMobileMenuOpen(false); handleScrollTo(e, 'home'); }} className="p-4 border-b border-gray-50 hover:bg-gray-50">HOME</a>
              <a href="#feature" onClick={(e) => { setIsMobileMenuOpen(false); handleScrollTo(e, 'feature'); }} className="p-4 border-b border-gray-50 hover:bg-gray-50">SERVICES</a>
              <a href="#about" onClick={(e) => { setIsMobileMenuOpen(false); handleScrollTo(e, 'about'); }} className="p-4 border-b border-gray-50 hover:bg-gray-50">ABOUT US</a>
              <a href="#staff" onClick={(e) => { setIsMobileMenuOpen(false); handleScrollTo(e, 'staff'); }} className="p-4 border-b border-gray-50 hover:bg-gray-50">OUR STAFF</a>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="p-4 border-b border-gray-50 hover:bg-gray-50 font-bold text-[#065f46]">LOGIN</Link>
              <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="p-4 bg-[#065f46] text-white hover:bg-[#04402f] font-bold text-center">REGISTER</Link>
            </div>
          </div>
        )}

        {/* Promo Strip Removed (Interfered with Search Bar) */}

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
                    <label className="text-xs font-bold text-[#065f46] uppercase tracking-widest">Full Name</label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#065f46] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#065f46] uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      placeholder="example@mail.com"
                      className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#065f46] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#065f46] uppercase tracking-widest">Message</label>
                    <textarea
                      rows="4"
                      placeholder="How can we help you?"
                      className="w-full bg-white/5 border border-white/10 p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#065f46] transition resize-none"
                    ></textarea>
                  </div>

                  <button className="w-full bg-[#065f46] text-white py-4 font-black tracking-widest uppercase hover:bg-green-600 transition shadow-xl">
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
                    <label className="text-xs font-bold text-[#065f46] uppercase tracking-widest">First Name *</label>
                    <input
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#065f46] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#065f46] uppercase tracking-widest">Last Name *</label>
                    <input
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#065f46] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#065f46] uppercase tracking-widest">Email Address *</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#065f46] transition"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#065f46] uppercase tracking-widest">Role of Interest</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 md:p-4 text-white focus:outline-none focus:border-[#065f46] transition appearance-none cursor-pointer"
                    >
                      <option className="bg-[#0f172a]">Travel Specialist</option>
                      <option className="bg-[#0f172a]">Customer Care</option>
                      <option className="bg-[#0f172a]">Tour Guide</option>
                      <option className="bg-[#0f172a]">Marketing</option>
                    </select>
                  </div>

                  {/* Profile Image */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#065f46] uppercase tracking-widest">Profile Photo</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id="profileImageInput"
                        onChange={(e) => setProfileImageFile(e.target.files[0])}
                        className="w-full bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#065f46] transition file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#065f46] file:text-white hover:file:bg-green-600 cursor-pointer"
                      />
                      {profileImageFile && (
                        <p className="text-xs text-emerald-400 mt-1 truncate">✓ {profileImageFile.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Resume */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#065f46] uppercase tracking-widest">Resume / CV <span className="text-white/40 normal-case">(PDF)</span></label>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        id="resumeInput"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                        className="w-full bg-white/5 border border-white/10 py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#065f46] transition file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#065f46] file:text-white hover:file:bg-green-600 cursor-pointer"
                      />
                      {resumeFile && (
                        <p className="text-xs text-emerald-400 mt-1 truncate">✓ {resumeFile.name}</p>
                      )}
                    </div>
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
      <section className="relative z-40 -mt-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white border border-gray-100 shadow-[0_20px_40px_rgba(0,0,0,0.08)] p-6 md:p-8">
          <form onSubmit={handleHotelSearch} className="flex flex-col md:flex-row gap-4 items-center">

            {/* Location */}
            <div className="flex-1 w-full relative border border-gray-300 bg-white">
              <input
                type="text"
                placeholder="Where are you going?"
                value={searchParams.destination}
                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                className="w-full text-gray-600 px-4 py-3 pr-12 text-sm focus:outline-none bg-transparent relative z-10"
              />
              <div className="absolute right-0 top-0 bottom-0 w-10 border-l border-gray-300 bg-gray-50 flex items-center justify-center z-0">
                <MapPin className="text-gray-400" size={16} />
              </div>
            </div>

            {/* Check In */}
            <div className="flex-1 w-full relative border border-gray-300 bg-white">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-widest pointer-events-none z-20">In</div>
              <input
                type="date"
                value={searchParams.checkIn}
                onChange={(e) => setSearchParams({ ...searchParams, checkIn: e.target.value })}
                className="w-full text-gray-600 pl-10 pr-12 py-3 text-sm focus:outline-none bg-transparent relative z-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <div className="absolute right-0 top-0 bottom-0 w-10 border-l border-gray-300 bg-gray-50 flex items-center justify-center z-0 pointer-events-none">
                <Calendar className="text-gray-400" size={16} />
              </div>
            </div>

            {/* Check Out */}
            <div className="flex-1 w-full relative border border-gray-300 bg-white">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 uppercase tracking-widest pointer-events-none z-20">Out</div>
              <input
                type="date"
                value={searchParams.checkOut}
                onChange={(e) => setSearchParams({ ...searchParams, checkOut: e.target.value })}
                className="w-full text-gray-600 pl-10 pr-12 py-3 text-sm focus:outline-none bg-transparent relative z-10 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
              <div className="absolute right-0 top-0 bottom-0 w-10 border-l border-gray-300 bg-gray-50 flex items-center justify-center z-0 pointer-events-none">
                <Calendar className="text-gray-400" size={16} />
              </div>
            </div>

            <button
              type="submit"
              className="w-full md:w-[150px] bg-[#0f172a] text-white px-8 py-3 text-sm font-medium hover:bg-black transition shadow-md"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Features Icons Strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-center">
          {[
            { title: "Travel without hassel", icon: <Umbrella size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} /> },
            { title: "Millions of view", icon: <Star size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} /> },
            { title: "Perfect for your budget", icon: <HandCoins size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} /> },
            { title: "Best travel tips", icon: <Briefcase size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} /> },
            { title: "Char Dham Yatra", icon: <Navigation size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} /> }
          ].map((feature, i) => (
            <motion.div variants={fadeUp} key={i} className="flex flex-col items-center justify-start hover:-translate-y-1 transition-transform">
              {feature.icon}
              <h4 className="text-sm font-bold text-gray-800">{feature.title}</h4>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 3. Top Destinations */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h4 className="text-[15px] text-[#065f46]/80 font-serif mb-3">
              {cmsData?.destinations?.sectionTitle || "Select your perfect trips"}
            </h4>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-12 bg-gray-400"></div>
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-wider uppercase">
                {cmsData?.destinations?.sectionHeading || "TOP DESTINATION"}
              </h2>
            </div>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {(cmsData?.destinations?.items?.length > 0 ? cmsData.destinations.items : [
              { image: destAmsterdam, title: 'Amsterdam, Natherland', description: 'Eu turpis egestas pretium aenean pharetra. Nibh venenatis cras sed felis eget velit aliquet neque egestas congue.', link: '' },
              { image: destLisbon, title: 'Lisbon, Portugal', description: 'Eu turpis egestas pretium aenean pharetra. Nibh venenatis cras sed felis eget velit aliquet neque egestas congue.', link: '' },
              { image: destDublin, title: 'Doolin, Ireland', description: 'Eu turpis egestas pretium aenean pharetra. Nibh venenatis cras sed felis eget velit aliquet neque egestas congue.', link: '' },
              { image: destExuma, title: 'Exuma, Bahamas', description: 'Eu turpis egestas pretium aenean pharetra. Nibh venenatis cras sed felis eget velit aliquet neque egestas congue.', link: '' }
            ]).map((dest, i) => (
              <motion.div variants={fadeUp} key={i} className="group relative flex flex-col text-center">
                <div className="w-full aspect-square overflow-hidden mb-5">
                  <img src={dest.img || dest.image} alt={dest.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-in-out" />
                </div>
                <h3 className="text-[15px] font-black text-gray-900 mb-3">{dest.title}</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed max-w-[90%] mx-auto">
                  {dest.description || 'Eu turpis egestas pretium aenean pharetra. Nibh venenatis cras sed felis eget velit aliquet neque egestas congue.'}
                </p>
                {dest.link && (
                  <Link to={dest.link} className="mt-4 text-[11px] font-bold text-[#065f46] hover:underline uppercase tracking-widest">
                    Explore
                  </Link>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Latest Tour */}
      <section id="news" className="relative py-24 md:py-32 bg-[#0f172a] text-center text-white my-10 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={cmsData?.latestTour?.backgroundImage || latestTourBg} alt="City Night" className="w-full h-full object-cover opacity-60" />
        </div>

        {/* Floating Images (Polaroid Style) */}
        <div className="absolute left-[5%] md:left-[10%] top-[10%] md:top-1/2 md:-translate-y-1/2 block z-10 opacity-70 md:opacity-100">
          <div className="bg-white p-2 md:p-3 pb-8 md:pb-12 transform -rotate-12 shadow-2xl w-28 h-36 md:w-60 md:h-72">
            <img src={cmsData?.latestTour?.leftImage || destAmsterdam} alt="Tour Left" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="absolute right-[5%] md:right-[10%] bottom-[10%] md:bottom-auto md:top-1/2 md:-translate-y-1/2 block z-10 opacity-70 md:opacity-100">
          <div className="bg-white p-2 md:p-3 pb-8 md:pb-12 transform rotate-12 shadow-2xl w-28 h-36 md:w-60 md:h-72">
            <img src={cmsData?.latestTour?.rightImage || destLisbon} alt="Tour Right" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="relative z-20 max-w-lg mx-auto px-4 py-8 md:py-0">
          <p className="text-[15px] md:text-lg mb-3 font-serif italic text-white/90">{cmsData?.latestTour?.subtitle || "Last minute trip"}</p>
          <h2 className="text-4xl md:text-6xl font-black tracking-widest mb-6 md:mb-10 text-white uppercase">{cmsData?.latestTour?.title || "OUR LATEST TOUR"}</h2>
          <p className="text-sm md:text-base mb-2 opacity-90 font-medium tracking-wider">{cmsData?.latestTour?.dateText || "Fri 15 March to Sun 17 March"}</p>
          <p className="text-lg md:text-2xl font-black mb-10 md:mb-12">{cmsData?.latestTour?.priceText || "$125 per person"}</p>
          <Link to={cmsData?.latestTour?.buttonLink || "/welcome"} className="inline-block bg-white text-[#0f172a] px-10 md:px-14 py-3 md:py-4 text-xs md:text-sm font-bold tracking-widest hover:bg-gray-100 transition shadow-2xl uppercase">
            {cmsData?.latestTour?.buttonText || "BOOK NOW"}
          </Link>
        </div>
      </section>

      {/* 5. Travel Tips / Flight Search */}
      <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          {/* Left Side - Round Image */}
          <motion.div variants={fadeUp} className="w-full lg:w-1/2 flex justify-center">
            <div className="w-[300px] h-[300px] md:w-[450px] md:h-[450px] rounded-full overflow-hidden shadow-2xl border-[12px] border-white">
              <img src={cmsData?.travelTips?.image || airplane} alt="Travel Section" className="w-full h-full object-cover hover:scale-110 transition duration-1000" />
            </div>
          </motion.div>

          {/* Right Side - Premium Packages Info */}
          <motion.div variants={fadeUp} className="w-full lg:w-1/2 md:pl-8">
            <div className="mb-6">
              <h4 className="text-[13px] md:text-sm font-bold text-[#065f46] tracking-widest uppercase mb-2">{cmsData?.travelTips?.sectionSubtitle || 'PLAN YOUR JOURNEY'}</h4>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 font-serif tracking-tight mb-6">{cmsData?.travelTips?.sectionTitle || 'Premium Travel & Tours'}</h2>
              <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
                {cmsData?.travelTips?.description || <>Experience the spiritual awakening of our exclusive <strong>Char Dham Yatra</strong> packages, or customize your dream destination getaway. We provide end-to-end luxury travel solutions, from comfortable taxi fleets to premium hotel stays.</>}
              </p>
              <ul className="space-y-3 mb-10 text-gray-600 text-sm md:text-base font-medium">
                {(cmsData?.travelTips?.bulletPoints?.length > 0 ? cmsData.travelTips.bulletPoints : ['Custom Tour Packages', 'Luxury Taxi & Fleet Services', 'Handpicked Premium Hotels']).map((point, idx) => (
                  <li key={idx} className="flex items-center gap-3"><CheckCircle size={18} className="text-[#065f46]" /> {point}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2">
              {isLoggedIn ? (
                <Link to="/taxi" className="inline-flex items-center justify-center bg-[#065f46] text-white px-10 py-3 md:py-4 text-xs md:text-sm font-bold tracking-widest uppercase shadow-xl hover:bg-[#064e3b] transition w-fit group">
                  {cmsData?.travelTips?.buttonText || 'BOOK CAB NOW'} <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link to="/login" state={{ from: { pathname: '/taxi' } }} className="inline-flex items-center justify-center bg-[#065f46] text-white px-10 py-3 md:py-4 text-xs md:text-sm font-bold tracking-widest uppercase shadow-xl hover:bg-[#064e3b] transition w-fit group">
                  LOGIN TO BOOK <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* 6. Categories */}
      <section className="pt-10 pb-16 md:pb-24 max-w-7xl mx-auto px-4 overflow-hidden">
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-50px" }} 
          variants={staggerContainer} 
          className="flex gap-8 md:gap-12 overflow-x-auto pb-6 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {(cmsData?.categories?.items?.length > 0
            ? cmsData.categories.items.map(cat => {
                let fallbackImg = 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=600';
                if (cat.type === 'hotel') fallbackImg = hotelImg;
                if (cat.type === 'activity') fallbackImg = tourImg;
                return {
                  title: cat.title,
                  img: cat.image || fallbackImg,
                  type: cat.type
                };
              })
            : [
                { title: 'Hotels', img: hotelImg, type: 'hotel' },
                { title: 'Cars', img: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=600', type: 'car' },
                { title: 'Activities', img: tourImg, type: 'activity' }
              ]
          ).map((cat, i) => (
            <motion.div 
              variants={fadeUp} 
              key={i} 
              className="group flex flex-col items-center flex-shrink-0 w-[280px] sm:w-[320px] md:w-[380px] snap-start"
            >
              <div className="w-full h-56 md:h-72 mb-6 overflow-hidden shadow-lg border border-gray-100">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-6 font-serif tracking-wide">{cat.title}</h3>
              <Link to={`/welcome?type=${cat.type}`} className="bg-black text-white px-10 md:px-12 py-3 text-[11px] md:text-xs font-bold tracking-widest hover:bg-gray-800 transition uppercase shadow-lg">
                Search
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 7. Services Section */}
      <section id="feature" className="pt-4 pb-6 md:pb-12 max-w-6xl mx-auto px-4 text-center">
        <p className="text-[#065f46] text-xs md:text-sm mb-1 md:mb-2 font-bold tracking-widest uppercase">{cmsData?.services?.sectionSubtitle || "We fulfill your needs"}</p>
        <div className="relative inline-block mb-10 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-black tracking-widest text-gray-900 font-serif">{cmsData?.services?.sectionTitle || "SERVICES"}</h2>
          <div className="absolute -left-16 top-1/2 w-12 h-[2px] bg-gray-200 hidden md:block"></div>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
          {[
            { title: 'Small transport', description: 'Reliable and comfortable transportation services for your local tours and transfers.', icon: Car },
            { title: 'Events', description: 'Plan and execute unforgettable events and gatherings with our expert coordination.', icon: Calendar },
            { title: 'Vacation package', description: 'Tailor-made vacation packages designed to give you the ultimate travel experience.', icon: Briefcase },
            { title: 'Resorts stay', description: 'Handpicked luxury resorts and stays for your perfect relaxation and comfort.', icon: Hotel }
          ].map((svc, i) => (
            <motion.div variants={fadeUp} key={i} className="flex flex-col items-center hover:-translate-y-2 transition-transform duration-500">
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-4 md:mb-6 rounded-full bg-emerald-50 text-[#065f46]">
                <svc.icon size={32} strokeWidth={1.5} />
              </div>
              <h4 className="text-lg md:text-xl font-black text-gray-900 mb-2 font-serif">{svc.title}</h4>
              <p className="text-xs md:text-sm text-gray-500 leading-relaxed px-2 md:px-0 font-medium">
                {svc.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 7.5 Essential Accessories */}
      <section className="py-10 md:py-16 bg-[#F8F9F5] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-6">
          {/* Left Side: Map with floating items */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="w-full md:w-1/2 relative h-[300px] md:h-[500px]">
            {/* Map Background */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-90 rounded-full blur-[1px]"
              style={{ backgroundImage: `url(${cmsData?.essentialAccessories?.backgroundImage || 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200'})` }}
            ></div>

            {/* Floating Elements */}
            <motion.div variants={fadeUp} className="absolute top-[20%] left-[20%] bg-white p-4 rounded-full shadow-2xl rotate-12 flex items-center justify-center border-4 border-white hover:scale-110 transition-transform cursor-pointer">
              <Camera size={36} className="text-[#065f46]" />
            </motion.div>
            <motion.div variants={fadeUp} className="absolute bottom-[30%] left-[10%] bg-white p-4 rounded-full shadow-2xl -rotate-12 flex items-center justify-center border-4 border-white hover:scale-110 transition-transform cursor-pointer">
              <Glasses size={36} className="text-[#065f46]" />
            </motion.div>
            <motion.div variants={fadeUp} className="absolute top-[40%] right-[15%] bg-white p-4 rounded-full shadow-2xl rotate-6 flex items-center justify-center border-4 border-white hover:scale-110 transition-transform cursor-pointer">
              <Briefcase size={36} className="text-[#065f46]" />
            </motion.div>
            <motion.div variants={fadeUp} className="absolute bottom-[10%] right-[30%] bg-white p-4 rounded-full shadow-2xl -rotate-6 flex items-center justify-center border-4 border-white hover:scale-110 transition-transform cursor-pointer">
              <MapPin size={36} className="text-[#065f46]" />
            </motion.div>
          </motion.div>

          {/* Right Side: Text */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="w-full md:w-1/2 text-center md:text-left md:pl-8">
            <h4 className="text-sm font-bold text-[#065f46] tracking-widest uppercase mb-4">
              {cmsData?.essentialAccessories?.sectionSubtitle || 'PREPARE FOR YOUR TRIP'}
            </h4>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 font-serif tracking-tight mb-6">
              {cmsData?.essentialAccessories?.sectionTitle || 'Essential Accessories'}
            </h2>
            <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-8">
              {cmsData?.essentialAccessories?.description || "Don't forget to pack the essentials! From capturing beautiful moments with your camera, protecting your eyes with sunglasses, to carrying your belongings safely. We ensure you're fully prepared for the journey ahead."}
            </p>
          </motion.div>
        </div>
      </section>


      {/* 8. About Us Section (Redesigned to match provided image exactly) */}
      <section id="about" className="py-16 md:py-24 bg-white relative">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Section */}
          <div className="text-center mb-16 relative">
            <h4 className="text-[14px] text-[#7a4b4b] font-serif mb-2">{cmsData?.aboutUs?.sectionSubtitle || 'our featured story'}</h4>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-16 bg-[#7a4b4b]"></div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-wider uppercase">{cmsData?.aboutUs?.sectionTitle || 'ABOUT US'}</h2>
            </div>
          </div>

          {/* Content Container - Use Grid instead of Flex for strict proportions */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1.8fr_1fr] items-center w-full gap-0 bg-white">

            {/* Left Column: Beach Image */}
            <div className="w-full relative hidden lg:block h-[500px]">
              <img
                src={cmsData?.aboutUs?.mainImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800"}
                alt="Beautiful Beach"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Mobile Beach Image */}
            <div className="w-full h-[300px] relative lg:hidden mb-8">
              <img
                src={cmsData?.aboutUs?.mainImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800"}
                alt="Beautiful Beach"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Middle Column: Features List */}
            <div className="w-full flex flex-col justify-center bg-white relative py-4 lg:py-0 h-full">
              <div className="space-y-6 lg:space-y-8 my-auto">
                {(cmsData?.aboutUs?.milestones?.length > 0
                  ? cmsData.aboutUs.milestones
                  : [
                      { title: "Our never ending footsteps", description: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Nullam eget dolor sit amet sed diam nonummy nibh. Nibh venenatis cras sed felis eget velit aliquet sagittis." },
                      { title: "Our total trips till now", description: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Nullam eget dolor sit amet sed diam nonummy nibh. Nibh venenatis cras sed felis eget velit aliquet sagittis." },
                      { title: "Our most incredible moments to share", description: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Nullam eget dolor sit amet sed diam nonummy nibh. Nibh venenatis cras sed felis eget velit aliquet sagittis." },
                      { title: "Our travel book released on 1991 year", description: "Lorem ipsum dolor sit amet consectetur adipiscing elit. Nullam eget dolor sit amet sed diam nonummy nibh. Nibh venenatis cras sed felis eget velit aliquet sagittis." }
                    ]
                ).map((item, idx) => (
                  <div key={idx} className="relative flex items-start lg:pl-6">

                    {/* Desktop map pin box - overlapping image boundary exactly */}
                    <div className="absolute left-0 top-0 w-10 h-10 border-[1.5px] border-[#7a4b4b] bg-white flex items-center justify-center lg:-ml-5 shadow-sm z-10 hidden lg:flex">
                      <MapPin size={20} className="text-[#7a4b4b] fill-[#7a4b4b]" />
                    </div>

                    {/* Mobile map pin box */}
                    <div className="w-10 h-10 border-[1.5px] border-[#7a4b4b] bg-white flex items-center justify-center flex-shrink-0 lg:hidden shadow-sm z-10 mt-1 mr-4">
                      <MapPin size={20} className="text-[#7a4b4b] fill-[#7a4b4b]" />
                    </div>

                    <div className="w-full pl-0 lg:pl-8 lg:pr-2">
                      <h3 className="text-[15px] md:text-[16px] font-semibold text-gray-800 mb-1.5 text-left">{item.title}</h3>
                      <div className="h-[1px] w-full bg-gray-300 mb-2"></div>
                      <p className="text-[11px] md:text-[12px] text-gray-500 leading-relaxed text-left font-medium opacity-90">
                        {item.description || item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Backpack Image */}
            <div className="w-full flex items-center justify-center py-10 lg:py-0 px-2 mt-8 lg:mt-0 relative h-[300px] lg:h-[450px]">
              <div className="relative w-full h-full flex items-center justify-center max-w-[320px] lg:max-w-[400px]">
                <img
                  src={cmsData?.aboutUs?.sideImage || bagImg}
                  alt="Travel Backpack"
                  className="max-h-[100%] w-auto object-contain drop-shadow-2xl"
                />
                {/* Compass Graphic */}
                <div className="absolute top-[5%] right-[-5%] lg:top-[15%] lg:right-[-10%] w-[90px] h-[90px] z-20 shadow-[0_10px_20px_rgba(0,0,0,0.3)] rounded-full bg-[#f4ebd8] flex items-center justify-center border-[3px] border-[#8b5a2b] overflow-hidden" style={{ backgroundImage: 'radial-gradient(#fbf8f1, #e8cda1)' }}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="w-full h-[1px] bg-black absolute"></div>
                    <div className="h-full w-[1px] bg-black absolute"></div>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="#6b3a1b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-compass relative z-10"><circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#8b5a2b" /></svg>
                  <span className="absolute top-1 text-[9px] font-bold text-[#6b3a1b]">N</span>
                  <span className="absolute bottom-1 text-[9px] font-bold text-[#6b3a1b]">S</span>
                  <span className="absolute right-1 text-[9px] font-bold text-[#6b3a1b]">E</span>
                  <span className="absolute left-1 text-[9px] font-bold text-[#6b3a1b]">W</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. Our Staff Section */}
      <section id="staff" className="relative mt-0 md:mt-10">
        {/* Staff Banner */}
        <div className="relative h-[400px] md:h-[500px] flex flex-col items-center justify-center text-center text-white px-4">
          <div className="absolute inset-0 z-0">
            <img src={cmsData?.staff?.backgroundImage || tourImg} alt="Staff Background" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-black/60"></div>
          </div>

          <div className="relative z-10 max-w-3xl space-y-4 md:space-y-6 pt-10 pb-20">
            <h4 className="text-sm md:text-base font-medium tracking-widest text-white/90">
              {cmsData?.staff?.sectionSubtitle || "Tourism members"}
            </h4>
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-white/50"></div>
              <h2 className="text-4xl md:text-6xl font-black font-serif tracking-wide">{cmsData?.staff?.sectionTitle || "OUR STAFF"}</h2>
            </div>
            <p className="text-xs md:text-sm opacity-80 leading-relaxed max-w-2xl mx-auto font-medium">
              {cmsData?.staff?.description || "Lorem ipsum dolor sit amet consectetur adipiscing elit. Nullam eget dolor sit amet sed diam nonummy nibh. Nibh venenatis cras sed felis eget velit aliquet sagittis."}
            </p>
            <button onClick={() => setIsJoinModalOpen(true)} className="bg-white text-slate-900 px-8 py-3 rounded-sm text-xs font-bold tracking-widest uppercase hover:bg-gray-100 transition shadow-lg mt-4">
              {cmsData?.staff?.buttonText || "JOIN NOW"}
            </button>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="max-w-5xl mx-auto px-4 -mt-16 md:-mt-24 relative z-20 pb-10 md:pb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {(cmsData?.staff?.items?.length > 0 ? cmsData.staff.items : [
              { name: "Elly Spitch", role: "CUSTOMER CARE", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400", description: "Expert in providing personalized travel solutions and ensuring customer satisfaction." },
              { name: "Hannah Zafron", role: "SPECIALIST", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400", description: "Specialized in customized itineraries tailored to your unique travel preferences." },
              { name: "Janne Dcosta", role: "FOUNDER", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400", description: "Visionary leader dedicated to making premium travel accessible worldwide." },
              { name: "Adam Johnson", role: "PRESIDENT", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400", description: "Driving the company's mission to provide unparalleled hospitality experiences." }
            ]).map((staff, i) => (
              <div key={i} className="bg-white p-2 shadow-xl text-center group flex flex-col h-full">
                <div className="aspect-[4/3] overflow-hidden mb-2 md:mb-3">
                  <img src={staff.image || staff.img} alt={staff.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                </div>
                <h4 className="text-sm md:text-base font-bold text-gray-900 font-serif mb-0.5">{staff.name}</h4>
                <p className="text-[10px] text-[#065f46] font-bold tracking-widest mb-2 uppercase">{staff.role}</p>
                <p className="text-[10px] md:text-xs text-gray-500 mb-3 px-1 md:px-4 leading-snug flex-grow">
                  {staff.description}
                </p>
                <a 
                  href={staff.email ? `mailto:${staff.email}` : '#'}
                  className="block text-center border border-gray-200 px-4 md:px-6 py-1.5 md:py-2 rounded-sm text-[9px] font-bold text-gray-500 hover:bg-[#065f46] hover:border-[#065f46] hover:text-white transition-all uppercase mb-1 md:mb-2 mx-auto w-fit tracking-widest"
                >
                  Contact Me
                </a>
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
              <span className="font-bold text-xl tracking-widest">
                {cmsData?.footer?.companyName || "My DESTINATION"}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {cmsData?.footer?.companyDescription || "My DESTINATION - Wed in India | Event Planners"}
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Quick links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="#about" onClick={(e) => handleScrollTo(e, 'about')}>About us</a></li>
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
            <h4 className="font-bold mb-4 font-serif text-lg tracking-wide">Pay safely with us</h4>
            <p className="text-xs text-gray-400 leading-relaxed">{cmsData?.footer?.paymentNote || "The payment is encrypted and transmitted securely with an SSL protocol."}</p>
          </div>
        </div>
        {/* Copyright + Payment Bar — same color as footer */}
        <div style={{
          background: '#022c22',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          margin: '0 -32px -32px -32px',
        }}>
          {/* Left: Copyright */}
          <p style={{ margin: 0, fontSize: '13px', color: '#6b8c75' }}>
            {cmsData?.footer?.copyrightText
              ? cmsData.footer.copyrightText
              : <>Copyright © {new Date().getFullYear()} <strong style={{ color: '#d4edda' }}>My DESTINATION<sup style={{ fontSize: '9px' }}>®</sup></strong> | All Rights Reserved.</>
            }
          </p>

          {/* Right: Payment Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {/* PayPal */}
            {(cmsData?.footer?.paymentMethods?.paypal !== false) && (
              <div style={{ background: '#003087', borderRadius: '5px', padding: '4px 7px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '26px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" style={{ height: '13px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
            )}
            {/* Mastercard */}
            {(cmsData?.footer?.paymentMethods?.mastercard !== false) && (
              <div style={{ background: '#fff', borderRadius: '5px', padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '26px', border: '1px solid #dde1e7' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" alt="Mastercard" style={{ height: '18px', objectFit: 'contain' }} />
              </div>
            )}
            {/* Visa */}
            {(cmsData?.footer?.paymentMethods?.visa !== false) && (
              <div style={{ background: '#1a1f71', borderRadius: '5px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '26px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" style={{ height: '11px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
            )}
            {/* Stripe */}
            {(cmsData?.footer?.paymentMethods?.stripe !== false) && (
              <div style={{ background: '#635bff', borderRadius: '5px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '26px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" style={{ height: '13px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
            )}
            {/* Apple Pay */}
            {(cmsData?.footer?.paymentMethods?.applepay !== false) && (
              <div style={{ background: '#000', borderRadius: '5px', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '26px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" alt="Apple Pay" style={{ height: '13px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
            )}
            {/* Google Pay */}
            {(cmsData?.footer?.paymentMethods?.googlepay !== false) && (
              <div style={{ background: '#fff', borderRadius: '5px', padding: '2px 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '26px', border: '1px solid #dde1e7' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" style={{ height: '15px', objectFit: 'contain' }} />
              </div>
            )}
          </div>
        </div>

      </footer>
    </div>
  );
};

export default LandingPage;
