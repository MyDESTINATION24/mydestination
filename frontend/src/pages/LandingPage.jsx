import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, DollarSign, Info, Navigation, CheckCircle, Car, CarTaxiFront, Activity, Hotel, Umbrella, HandCoins, Briefcase, ChevronLeft, ChevronRight, Play, User, Calendar, Moon, Wifi, Coffee, Shield, ChevronDown, Camera, Glasses, Helicopter, Helicopter as HelicopterIcon, Heart, ArrowRight, Clock } from 'lucide-react';
import logo from '../assets/rokologin-removebg-preview.png';
import WebsiteHeader from '../components/ui/WebsiteHeader';
import ModernDatePicker from '../components/ui/ModernDatePicker';
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
import { Facebook, Twitter, Instagram, Menu, X, Phone, Mail, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../services/apiService';
import SafeHTML from '../components/common/SafeHTML';

const DestinationCard = ({ dest, fadeUp }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const descriptionText = dest.description || 'Eu turpis egestas pretium aenean pharetra. Nibh venenatis cras sed felis eget velit aliquet neque egestas congue.';
  const isLong = descriptionText.length > 120;
  const displayText = isLong ? descriptionText.slice(0, 120) + '...' : descriptionText;

  const isExternal = dest.link && (dest.link.startsWith('http://') || dest.link.startsWith('https://'));

  const ImageWrapper = ({ children }) => {
    if (!dest.link) {
      return (
        <div className="w-full aspect-square overflow-hidden mb-5">
          {children}
        </div>
      );
    }
    if (isExternal) {
      return (
        <a 
          href={dest.link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="cursor-pointer block w-full aspect-square overflow-hidden mb-5"
        >
          {children}
        </a>
      );
    }
    return (
      <Link 
        to={dest.link} 
        className="cursor-pointer block w-full aspect-square overflow-hidden mb-5"
      >
        {children}
      </Link>
    );
  };

  return (
    <>
      <motion.div variants={fadeUp} className="group relative flex flex-col h-full text-center">
        <ImageWrapper>
          <img src={dest.img || dest.image} alt={dest.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-in-out" />
        </ImageWrapper>
        <SafeHTML html={dest.title} as="h3" className="text-[15px] font-black text-gray-900 mb-3" />

        <div className="flex flex-col items-center justify-start">
          <SafeHTML html={displayText} as="p" className="text-[11px] text-gray-500 leading-relaxed max-w-[90%] mx-auto h-[54px] overflow-hidden mb-1" />
          {isLong && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-[#065f46] hover:underline font-black text-[9px] uppercase tracking-widest focus:outline-none mb-3 cursor-pointer"
            >
              Read More
            </button>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200"
            >
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 bg-white/80 hover:bg-white text-gray-700 p-2 rounded-full shadow-md z-20 transition focus:outline-none cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Image */}
              <div className="w-full h-48 sm:h-56 md:h-64 overflow-hidden flex-shrink-0">
                <img
                  src={dest.img || dest.image}
                  alt={dest.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="p-6 text-left flex flex-col flex-grow overflow-y-auto">
                <SafeHTML html={dest.title} as="h3" className="text-xl font-black text-gray-900 mb-3" />
                <div className="text-sm text-gray-600 leading-relaxed flex-grow overflow-y-auto pr-1">
                  <SafeHTML html={descriptionText} />
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center flex-shrink-0">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
                  >
                    Close
                  </button>
                  {dest.link && (
                    <Link
                      to={dest.link}
                      className="bg-[#065f46] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#064e3b] transition shadow-md"
                    >
                      Explore
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

const LandingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const id = location.state.scrollTo;
      setTimeout(() => {
        if (id === 'home') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const element = document.getElementById(id);
          if (element) {
            const yOffset = -50;
            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }
      }, 200);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(id);
      if (element) {
        const yOffset = -50;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
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

  // Category Slider State
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  const handleCategoryScroll = (e) => {
    const container = e.target;
    const scrollLeft = container.scrollLeft;
    const firstChild = container.firstChild;
    if (firstChild) {
      const cardWidth = firstChild.offsetWidth;
      const gap = 24; // gap-6 is 24px
      const index = Math.round(scrollLeft / (cardWidth + gap));
      setActiveCategoryIndex(index);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
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

  const [blogs, setBlogs] = useState([
    {
      _id: 'default-1',
      title: 'Escape the City: 7 Hidden Hill Stations Near You',
      category: 'Travel Guides',
      readTime: '6 min read',
      badge: 'TRENDING',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
      excerpt: 'Weekend escapes that are closer than you think — curated hill stations, handpicked stays, and routes that actually work.',
      date: 'March 2026'
    },
    {
      _id: 'default-2',
      title: 'Couple-Friendly Stays: What To Check Before You Book',
      category: 'Stay Tips',
      readTime: '4 min read',
      badge: "EDITOR'S PICK",
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=80',
      excerpt: 'From ID policies to neighbourhood vibes — a simple checklist to make sure your next couple stay is calm, safe and drama-free.',
      date: 'March 2026'
    },
    {
      _id: 'default-3',
      title: 'How To Get Real Discounts (Beyond Flash Sales)',
      category: 'Smart Booking',
      readTime: '5 min read',
      badge: 'SAVE MORE',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
      excerpt: 'Learn how wallet credits, off-peak dates and flexible policies can actually beat random promo codes.',
      date: 'February 2026'
    }
  ]);

  useEffect(() => {
    import('axios').then(axiosModule => {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      axiosModule.default.get(`${API_BASE_URL}/blogs`).then(res => {
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setBlogs(res.data.data);
        }
      }).catch(() => {});
    });
  }, []);

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

    if (targetPath.startsWith('/taxi/user')) {
      // All taxi user routes need taxiUserToken — taxi has its own login
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
      // Generic fallback — uses main token
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
      <section className="relative h-[650px] sm:h-auto sm:min-h-screen w-full flex flex-col bg-gray-100 overflow-hidden pb-20">

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



        {/* Dot Indicators Removed */}

        {/* Hero Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 mt-16 pb-28 pointer-events-none">
          {(cmsData?.hero?.textBlocks && cmsData.hero.textBlocks.length > 0) ? (
            cmsData.hero.textBlocks.map((block, idx) => {
              const tagClassMap = {
                h1: 'text-2xl sm:text-4xl md:text-6xl font-black mt-2 mb-2 tracking-widest text-center w-full',
                h2: 'text-xl sm:text-3xl md:text-5xl font-medium tracking-wide leading-tight mt-1 mb-1 text-center w-full',
                h3: 'text-lg sm:text-2xl md:text-4xl mt-2 mb-2 font-serif text-center w-full',
                p: 'text-xs md:text-sm max-w-xl mx-auto tracking-widest leading-relaxed font-medium mt-2 text-center w-full'
              };
              const tagClass = tagClassMap[block.tag] || 'text-sm';
              return (
                <div key={idx} className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] pointer-events-auto my-1">
                  <SafeHTML html={block.text} as={block.tag || 'div'} className={`inline-block text-white ${tagClass}`} />
                </div>
              );
            })
          ) : (
            <>
              <h2 className="text-white text-xl sm:text-3xl md:text-5xl font-medium tracking-wide leading-tight mb-4 md:mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                We give you <br /> strong desire to travel & <br /> explore the world
              </h2>
              <h1 className="text-white text-2xl sm:text-4xl md:text-6xl mt-6 md:mt-12 mb-2 md:mb-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-serif uppercase tracking-widest">Tourism</h1>
              <p className="text-white/90 text-[10px] md:text-[13px] max-w-xl mx-auto tracking-widest leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium mt-4 md:mt-6">
                Embark on an unforgettable journey to the world's most breathtaking destinations. <br className="hidden md:block" /> Discover new cultures, create lasting memories, and let your adventure begin.
              </p>
            </>
          )}
        </div>

        {/* Flat Transparent Navbar */}
        <WebsiteHeader />

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
      <section className="relative z-40 -mt-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-16">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-5 md:p-6">
          <form onSubmit={handleHotelSearch} className="flex flex-col md:flex-row gap-4 items-center w-full">

            {/* Location */}
            <div className="flex-1 w-full relative flex items-center px-4 py-3 bg-white rounded-xl border border-gray-300 focus-within:border-green-600 transition-colors duration-200">
              <div className="absolute left-4 text-green-700 pointer-events-none flex items-center justify-center">
                <MapPin size={18} strokeWidth={2} />
              </div>
              <input
                type="text"
                placeholder="Where are you going?"
                value={searchParams.destination}
                onChange={(e) => setSearchParams({ ...searchParams, destination: e.target.value })}
                onFocus={(e) => e.target.scrollIntoView({ block: 'nearest', behavior: 'auto' })}
                className="w-full text-gray-800 placeholder-gray-400 pl-9 pr-2 py-0.5 text-sm font-semibold focus:outline-none bg-transparent"
              />
            </div>

            {/* Check In */}
            <div className="flex-1 w-full">
              <ModernDatePicker
                date={searchParams.checkIn}
                onChange={(newDate) => setSearchParams({ ...searchParams, checkIn: newDate })}
                minDate={new Date().toISOString().split('T')[0]}
                customTrigger={(isOpen) => (
                  <div className={`w-full relative flex items-center px-4 py-2 bg-white rounded-xl border border-gray-300 transition-colors duration-200 ${isOpen ? 'border-green-600 ring-2 ring-green-600/10' : 'hover:border-gray-400'}`}>
                    <div className="absolute left-4 text-green-700 pointer-events-none flex items-center justify-center">
                      <Calendar size={18} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col w-full pl-9 pr-2 text-left">
                      <span className="text-[9px] font-black text-green-800 uppercase tracking-widest leading-none mb-0.5">Check In</span>
                      <span className={`text-sm ${searchParams.checkIn ? 'text-gray-800 font-semibold' : 'text-gray-400 font-medium'}`}>
                        {searchParams.checkIn ? (() => {
                          const [y, m, d] = searchParams.checkIn.split('-');
                          return `${d}-${m}-${y}`;
                        })() : 'dd-mm-yyyy'}
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>

            {/* Check Out */}
            <div className="flex-1 w-full">
              <ModernDatePicker
                date={searchParams.checkOut}
                onChange={(newDate) => setSearchParams({ ...searchParams, checkOut: newDate })}
                minDate={searchParams.checkIn ? new Date(new Date(searchParams.checkIn).getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                align="right"
                customTrigger={(isOpen) => (
                  <div className={`w-full relative flex items-center px-4 py-2 bg-white rounded-xl border border-gray-300 transition-colors duration-200 ${isOpen ? 'border-green-600 ring-2 ring-green-600/10' : 'hover:border-gray-400'}`}>
                    <div className="absolute left-4 text-green-700 pointer-events-none flex items-center justify-center">
                      <Calendar size={18} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col w-full pl-9 pr-2 text-left">
                      <span className="text-[9px] font-black text-green-800 uppercase tracking-widest leading-none mb-0.5">Check Out</span>
                      <span className={`text-sm ${searchParams.checkOut ? 'text-gray-800 font-semibold' : 'text-gray-400 font-medium'}`}>
                        {searchParams.checkOut ? (() => {
                          const [y, m, d] = searchParams.checkOut.split('-');
                          return `${d}-${m}-${y}`;
                        })() : 'dd-mm-yyyy'}
                      </span>
                    </div>
                  </div>
                )}
              />
            </div>

            <button
              type="submit"
              className="w-full md:w-auto md:px-10 py-3 md:py-4 bg-[#065f46] hover:bg-[#044e39] text-white text-sm font-bold tracking-wider uppercase rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-[1px] active:translate-y-0 transition duration-150 ease-in-out cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-2 overflow-visible">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="flex flex-nowrap justify-start md:justify-center overflow-x-auto pt-6 pb-4 md:pb-6 gap-x-6 sm:gap-x-8 md:gap-x-10 lg:gap-x-12 text-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {[
            { title: "Travel without hassel", icon: <Umbrella size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} />, route: '/hotels' },
            { title: "Taxi Service", icon: <CarTaxiFront size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} />, route: '/taxi/user' },
            { title: "Char Dham Yatra", icon: <Navigation size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} />, route: '/taxi/user/tours' },
            { title: "Helicopter Booking", icon: <Helicopter size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} />, route: '/taxi/user/airways' },
            { title: "Wedding Planner", icon: <Heart size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} />, route: '/wedding' },
            { title: "Hotel for Char Dham Yatra", icon: <Hotel size={40} className="text-green-800 mx-auto mb-4" strokeWidth={1.5} />, route: '/hotels' }
          ].map((feature, i) => (
            <motion.div
              variants={fadeUp}
              key={i}
              onClick={() => handleNavigation(feature.route)}
              className="flex flex-col items-center justify-start hover:-translate-y-1 transition-transform w-[120px] sm:w-[130px] md:w-[140px] lg:w-[150px] shrink-0 cursor-pointer group"
              title={feature.title}
            >
              <div className="group-hover:scale-110 transition-transform duration-200">
                {feature.icon}
              </div>
              <h4 className="text-xs md:text-sm font-bold text-gray-800 group-hover:text-green-700 transition-colors leading-tight">{feature.title}</h4>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 3. Top Destinations */}
      <section className="pt-2 pb-8 md:pt-6 md:pb-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10 md:mb-16">
            <SafeHTML html={cmsData?.destinations?.sectionSubtitle || "Select your perfect trips"} as="p" className="text-[15px] font-serif italic text-gray-500 mb-2" />
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1px] w-12 bg-gray-400"></div>
              <SafeHTML html={cmsData?.destinations?.sectionHeading || "TOP DESTINATION"} as="h2" className="text-2xl md:text-3xl font-black text-gray-900 tracking-wider uppercase" />
            </div>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {(cmsData?.destinations?.items?.length > 0 ? cmsData.destinations.items : [
              { image: destAmsterdam, title: 'Amsterdam, Natherland', description: 'Eu turpis egestas pretium aenean pharetra. Nibh venenatis cras sed felis eget velit aliquet neque egestas congue.', link: '' },
              { image: destLisbon, title: 'Lisbon, Portugal', description: 'Eu turpis egestas pretium aenean pharetra. Nibh venenatis cras sed felis eget velit aliquet neque egestas congue.', link: '' },
              { image: destDublin, title: 'Doolin, Ireland', description: 'Eu turpis egestas pretium aenean pharetra. Nibh venenatis cras sed felis eget velit aliquet neque egestas congue.', link: '' },
              { image: destExuma, title: 'Exuma, Bahamas', description: 'Eu turpis egestas pretium aenean pharetra. Nibh venenatis cras sed felis eget velit aliquet neque egestas congue.', link: '' }
            ]).map((dest, i) => (
              <DestinationCard dest={dest} fadeUp={fadeUp} key={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. Latest Tour */}
      <section id="news" className="relative py-12 md:py-32 bg-[#0f172a] text-center text-white my-6 md:my-10 overflow-hidden">
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
          <SafeHTML html={cmsData?.latestTour?.subtitle || "Last minute trip"} as="p" className="text-[15px] md:text-lg mb-3 font-serif italic text-white/90" />
          <SafeHTML html={cmsData?.latestTour?.title || "OUR LATEST TOUR"} as="h2" className="text-4xl md:text-6xl font-black tracking-widest mb-6 md:mb-10 text-white uppercase" />
          <SafeHTML html={cmsData?.latestTour?.dateText || "Fri 15 March to Sun 17 March"} as="p" className="text-sm md:text-base mb-2 opacity-90 font-medium tracking-wider" />
          <SafeHTML html={cmsData?.latestTour?.priceText || "$125 per person"} as="p" className="text-lg md:text-2xl font-black mb-10 md:mb-12" />
          <Link to={cmsData?.latestTour?.buttonLink || "/welcome"} className="inline-block bg-white text-[#0f172a] px-10 md:px-14 py-3 md:py-4 text-xs md:text-sm font-bold tracking-widest hover:bg-[#065f46] hover:text-white transition-all duration-300 shadow-2xl uppercase">
            {cmsData?.latestTour?.buttonText || "BOOK NOW"}
          </Link>
        </div>
      </section>

      {/* 5. Travel Tips / Flight Search */}
      <section className="pt-8 pb-8 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
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
              <SafeHTML html={cmsData?.travelTips?.sectionSubtitle || 'PLAN YOUR JOURNEY'} as="h4" className="text-[13px] md:text-sm font-bold text-[#065f46] tracking-widest uppercase mb-2" />
              <SafeHTML html={cmsData?.travelTips?.sectionTitle || 'Premium Travel & Tours'} as="h2" className="text-3xl md:text-5xl font-black text-gray-900 font-serif tracking-tight mb-6" />
              <div className="text-gray-600 text-sm md:text-base leading-relaxed mb-4">
                <SafeHTML html={typeof cmsData?.travelTips?.description === 'string' ? cmsData.travelTips.description : ''} fallback={<>Experience the spiritual awakening of our exclusive <strong>Char Dham Yatra</strong> packages, or customize your dream destination getaway. We provide end-to-end luxury travel solutions, from comfortable taxi fleets to premium hotel stays.</>} />
              </div>
              <ul className="space-y-3 mb-10 text-gray-600 text-sm md:text-base font-medium">
                {(cmsData?.travelTips?.bulletPoints?.length > 0 ? cmsData.travelTips.bulletPoints : ['Custom Tour Packages', 'Luxury Taxi & Fleet Services', 'Handpicked Premium Hotels']).map((point, idx) => (
                  <li key={idx} className="flex items-center gap-3"><CheckCircle size={18} className="text-[#065f46]" /> <SafeHTML html={point} as="span" /></li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex justify-center lg:justify-start">
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
      <section className="pt-4 pb-8 md:pb-24 max-w-7xl mx-auto px-4 overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          onScroll={handleCategoryScroll}
          className="flex gap-4 md:gap-12 overflow-x-auto pb-6 -mx-4 md:mx-0 px-6 md:px-0 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
              className="group flex flex-col items-center flex-shrink-0 w-[calc(100vw-48px)] sm:w-[320px] md:w-[380px] snap-center sm:snap-start"
            >
              <div className="w-full h-56 md:h-72 mb-6 overflow-hidden shadow-lg border border-gray-100">
                <img src={cat.img} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <SafeHTML html={cat.title} as="h3" className="text-xl md:text-2xl font-black text-gray-900 mb-6 font-serif tracking-wide" />
              <button
                onClick={() => handleNavigation('/home')}
                className="bg-black text-white px-10 md:px-12 py-3 text-[11px] md:text-xs font-bold tracking-widest hover:bg-gray-800 transition uppercase shadow-lg cursor-pointer"
              >
                Search
              </button>
            </motion.div>
          ))}
        </motion.div>

        {/* Category Indicators (Dots) */}
        <div className="flex md:hidden justify-center gap-2 mt-4">
          {(cmsData?.categories?.items?.length > 0
            ? cmsData.categories.items
            : [1, 2, 3]
          ).map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${activeCategoryIndex === idx ? 'bg-[#065f46] w-4' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </section>

      {/* 7. Services Section */}
      <section id="feature" className="pt-2 pb-4 md:pb-12 max-w-6xl mx-auto px-4 text-center">
        <SafeHTML html={cmsData?.services?.sectionSubtitle || "We fulfill your needs"} as="p" className="text-[#065f46] text-xs md:text-sm mb-1 md:mb-2 font-bold tracking-widest uppercase" />
        <div className="relative inline-block mb-6 md:mb-20">
          <SafeHTML html={cmsData?.services?.sectionTitle || "SERVICES"} as="h2" className="text-3xl md:text-5xl font-black tracking-widest text-gray-900 font-serif" />
          <div className="absolute -left-16 top-1/2 w-12 h-[2px] bg-gray-200 hidden md:block"></div>
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12">
          {[
            { title: 'Small transport', description: 'Reliable and comfortable transportation services for your local tours and transfers.', icon: Car, route: '/taxi/user' },
            { title: 'Events', description: 'Plan and execute unforgettable events and gatherings with our expert coordination.', icon: Calendar, route: '/wedding' },
            { title: 'Vacation package', description: 'Tailor-made vacation packages designed to give you the ultimate travel experience.', icon: Briefcase, route: '/hotels' },
            { title: 'Resorts stay', description: 'Handpicked luxury resorts and stays for your perfect relaxation and comfort.', icon: Hotel, route: '/hotels' }
          ].map((svc, i) => (
            <motion.div 
              variants={fadeUp} 
              key={i} 
              onClick={() => handleNavigation(svc.route)}
              className="flex flex-col items-center hover:-translate-y-2 transition-transform duration-500 cursor-pointer group"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center mb-4 md:mb-6 rounded-full bg-emerald-50 text-[#065f46] group-hover:bg-emerald-100 transition-colors duration-300">
                <svc.icon size={32} strokeWidth={1.5} />
              </div>
              <SafeHTML html={svc.title} as="h4" className="text-lg md:text-xl font-black text-gray-900 mb-2 font-serif group-hover:text-green-700 transition-colors" />
              <SafeHTML html={svc.description} as="p" className="text-xs md:text-sm text-gray-500 leading-relaxed px-2 md:px-0 font-medium" />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 7.5 Essential Accessories */}
      <section className="py-6 md:py-16 bg-[#F8F9F5] relative overflow-hidden">
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
            <SafeHTML html={cmsData?.essentialAccessories?.sectionSubtitle || 'PREPARE FOR YOUR TRIP'} as="h4" className="text-sm font-bold text-[#065f46] tracking-widest uppercase mb-4" />
            <SafeHTML html={cmsData?.essentialAccessories?.sectionTitle || 'Essential Accessories'} as="h2" className="text-3xl md:text-5xl font-black text-gray-900 font-serif tracking-tight mb-6" />
            <SafeHTML html={cmsData?.essentialAccessories?.description || "Don't forget to pack the essentials! From capturing beautiful moments with your camera, protecting your eyes with sunglasses, to carrying your belongings safely. We ensure you're fully prepared for the journey ahead."} as="p" className="text-gray-600 text-sm md:text-base leading-relaxed mb-8" />
          </motion.div>
        </div>
      </section>


      {/* 8. About Us Section (Redesigned to match provided image exactly) */}
      <section id="about" className="pt-2 md:pt-4 pb-8 md:pb-16 bg-white relative">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Section */}
          <div className="text-center mb-8 relative">
            <SafeHTML html={cmsData?.aboutUs?.sectionSubtitle || 'our featured story'} as="h4" className="text-[14px] text-[#7a4b4b] font-serif mb-2" />
            <div className="flex items-center justify-center gap-4">
              <SafeHTML html={cmsData?.aboutUs?.sectionTitle || 'ABOUT US'} as="h2" className="text-3xl md:text-4xl font-black text-gray-900 tracking-wider uppercase" />
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
                    <div className="absolute left-0 top-0 w-10 h-10 border-[1.5px] border-[#065f46] bg-white flex items-center justify-center lg:-ml-5 shadow-sm z-10 hidden lg:flex transition-all duration-300 hover:bg-[#065f46] group/pin">
                      <MapPin size={20} className="text-[#065f46] fill-[#065f46] group-hover/pin:text-white group-hover/pin:fill-white transition-colors duration-300" />
                    </div>

                    {/* Mobile map pin box */}
                    <div className="w-10 h-10 border-[1.5px] border-[#065f46] bg-white flex items-center justify-center flex-shrink-0 lg:hidden shadow-sm z-10 mt-1 mr-4 transition-all duration-300 hover:bg-[#065f46] group/pin2">
                      <MapPin size={20} className="text-[#065f46] fill-[#065f46] group-hover/pin2:text-white group-hover/pin2:fill-white transition-colors duration-300" />
                    </div>

                    <div className="w-full pl-0 lg:pl-8 lg:pr-2">
                      <SafeHTML html={item.title} as="h3" className="text-[15px] md:text-[16px] font-semibold text-gray-800 mb-1.5 text-left" />
                      <div className="h-[1px] w-full bg-gray-300 mb-2"></div>
                      <SafeHTML html={item.description || item.desc} as="p" className="text-[11px] md:text-[12px] text-gray-500 leading-relaxed text-left font-medium opacity-90" />
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
            <SafeHTML html={cmsData?.staff?.sectionSubtitle || "Tourism members"} as="h4" className="text-sm md:text-base font-medium tracking-widest text-white/90" />
            <div className="flex items-center justify-center gap-4">
              <div className="h-[1px] w-12 bg-white/50"></div>
              <SafeHTML html={cmsData?.staff?.sectionTitle || "OUR STAFF"} as="h2" className="text-4xl md:text-6xl font-black font-serif tracking-wide" />
            </div>
            <SafeHTML html={cmsData?.staff?.description || "Lorem ipsum dolor sit amet consectetur adipiscing elit. Nullam eget dolor sit amet sed diam nonummy nibh. Nibh venenatis cras sed felis eget velit aliquet sagittis."} as="p" className="text-xs md:text-sm opacity-80 leading-relaxed max-w-2xl mx-auto font-medium" />
            <button onClick={() => setIsJoinModalOpen(true)} className="bg-white text-slate-900 px-8 py-3 rounded-sm text-xs font-bold tracking-widest uppercase hover:bg-gray-100 transition shadow-lg mt-4">
              {cmsData?.staff?.buttonText || "JOIN NOW"}
            </button>
          </div>
        </div>

        {/* Staff Grid */}
        <div className="max-w-5xl mx-auto px-4 -mt-16 md:-mt-24 relative z-20 pb-10 md:pb-20">
          <div className="flex flex-nowrap md:grid md:grid-cols-4 gap-4 md:gap-6 overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-4 md:mx-0 px-6 md:px-0">
            {(cmsData?.staff?.items?.length > 0 ? cmsData.staff.items : [
              { name: "Elly Spitch", role: "CUSTOMER CARE", img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400", description: "Expert in providing personalized travel solutions and ensuring customer satisfaction." },
              { name: "Hannah Zafron", role: "SPECIALIST", img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400", description: "Specialized in customized itineraries tailored to your unique travel preferences." },
              { name: "Janne Dcosta", role: "FOUNDER", img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400", description: "Visionary leader dedicated to making premium travel accessible worldwide." },
              { name: "Adam Johnson", role: "PRESIDENT", img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400", description: "Driving the company's mission to provide unparalleled hospitality experiences." }
            ]).map((staff, i) => (
              <div key={i} className="bg-white p-2 shadow-xl text-center group flex flex-col h-full flex-shrink-0 w-[250px] md:w-auto snap-center md:snap-align-none">
                <div className="aspect-[4/3] overflow-hidden mb-2 md:mb-3">
                  <img src={staff.image || staff.img} alt={staff.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                </div>
                <SafeHTML html={staff.name} as="h4" className="text-sm md:text-base font-bold text-gray-900 font-serif mb-0.5" />
                <SafeHTML html={staff.role} as="p" className="text-[10px] text-[#065f46] font-bold tracking-widest mb-2 uppercase" />
                <SafeHTML html={staff.description} as="p" className="text-[10px] md:text-xs text-gray-500 mb-3 px-1 md:px-4 leading-snug flex-grow" />
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

      {/* 9.5. Blogs & Stories Section */}
      <section id="blogs" className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#065f46] mb-2">
              Stories &amp; Insights
            </p>
            <h2 className="text-3xl md:text-5xl font-black font-serif text-slate-900 tracking-tight uppercase">
              Latest Blogs &amp; Travel Hacks
            </h2>
            <p className="text-sm text-slate-600 mt-3">
              Handpicked travel guides, stay tips, and smart booking hacks from our team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {blogs.slice(0, 3).map((blog) => (
              <div 
                key={blog._id} 
                onClick={() => navigate(`/blogs/${blog._id}`)}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer flex flex-col h-full"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img 
                    src={blog.image} 
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  {blog.badge && (
                    <span className="absolute top-3 left-3 bg-[#065f46] text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                      {blog.badge}
                    </span>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-semibold text-[#065f46] uppercase tracking-wider">{blog.category}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {blog.readTime || '5 min read'}</span>
                  </div>
                  <SafeHTML html={blog.title} as="h3" className="text-base md:text-lg font-bold text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-[#065f46] transition-colors" />
                  <SafeHTML html={blog.excerpt} as="p" className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 flex-grow" />
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#065f46] group-hover:translate-x-1 transition-transform">
                    <span>Read Article</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link 
              to="/blogs" 
              className="inline-flex items-center gap-2 bg-[#065f46] text-white px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase hover:bg-green-700 transition shadow-md"
            >
              <span>Explore All Blogs</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Footer (Restructured) */}
      <footer className="bg-emerald-950 text-white pt-8 pb-8 px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Contact Details */}
          <div>
            <h4 className="font-bold text-lg mb-6 tracking-wide">Contact Details</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-emerald-400 mt-1 flex-shrink-0" />
                <span 
                  className="leading-relaxed [&_*]:!text-gray-300"
                  dangerouslySetInnerHTML={{ __html: cmsData?.footer?.address || "1 My Address, My Street, New York City, NY, USA" }}
                />
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-emerald-400 flex-shrink-0" />
                <a href={`tel:${cmsData?.footer?.phone || "+1 234 567 890"}`} className="hover:text-emerald-400 transition-colors font-medium">{cmsData?.footer?.phone || "+1 234 567 890"}</a>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle size={18} className="text-emerald-400 flex-shrink-0" />
                <a href={`https://wa.me/${(cmsData?.footer?.whatsapp || cmsData?.footer?.phone || "+1234567890").replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors font-medium">{cmsData?.footer?.whatsapp || cmsData?.footer?.phone || "+1 234 567 890"}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-emerald-400 flex-shrink-0" />
                <a href={`mailto:${cmsData?.footer?.email || "info@mydestination.com"}`} className="hover:text-emerald-400 transition-colors font-medium">{cmsData?.footer?.email || "info@mydestination.com"}</a>
              </li>
            </ul>
          </div>

          {/* Column 2: Useful Links */}
          <div>
            <h4 className="font-bold text-lg mb-6 tracking-wide">Useful links</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <a href="#home" onClick={(e) => handleScrollTo(e, 'home')} className="hover:text-emerald-400 transition-colors block">Home</a>
              </li>
              <li>
                <a href="#about" onClick={(e) => handleScrollTo(e, 'about')} className="hover:text-emerald-400 transition-colors block">About Us</a>
              </li>
              <li>
                <a href="#staff" onClick={(e) => handleScrollTo(e, 'staff')} className="hover:text-emerald-400 transition-colors block">Our Team</a>
              </li>

              <li>
                <Link to="/help" className="hover:text-emerald-400 transition-colors block">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Important Links */}
          <div>
            <h4 className="font-bold text-lg mb-6 tracking-wide">Important Links</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li>
                <Link to="/terms" className="hover:text-emerald-400 transition-colors block">Terms & Conditions</Link>
              </li>

              <li>
                <Link to="/refund-policy" className="hover:text-emerald-400 transition-colors block">Return & Refund Policy</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors block">Privacy Policy</Link>
              </li>

            </ul>
          </div>

          {/* Column 4: About Company */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'min-content' }}>
              {(() => {
                const rawName = cmsData?.footer?.companyName || 'My DESTINATION';
                const cleanName = typeof rawName === 'string' ? rawName.replace(/<[^>]*>/g, '').trim() || 'My DESTINATION' : 'My DESTINATION';
                return (
                  <h4 style={{ whiteSpace: 'nowrap' }} className="font-bold text-lg mb-2 tracking-wide">
                    {cleanName.toLowerCase().startsWith('about') ? cleanName : `About ${cleanName}`}
                  </h4>
                );
              })()}
              <div 
                className="text-xs text-gray-300 leading-relaxed mb-6 [&_*]:!text-gray-300"
                dangerouslySetInnerHTML={{ __html: cmsData?.footer?.companyDescription || "My DESTINATION - Wed in India | Event Planners. We make your special moments unforgettable with customized details and premium services." }}
              />
            </div>
            <div>
              <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-400 mb-3">Connect with Us</h5>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all text-gray-300" aria-label="Facebook">
                  <Facebook size={16} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all text-gray-300" aria-label="Twitter">
                  <Twitter size={16} />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all text-gray-300" aria-label="Instagram">
                  <Instagram size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white border-t border-gray-200 py-2 -mx-6 -mb-8 md:-mx-8 md:-mb-8 px-6 md:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-4 items-center gap-2 md:gap-8 w-full">
            {/* Left: Copyright */}
            <p className="m-0 text-[8px] text-[#065f46] font-medium text-center md:text-left md:col-span-3">
              Copyright © {new Date().getFullYear()}{' '}
              <strong className="text-[#065f46] font-bold text-[9px] tracking-wide">My DESTINATION<sup className="text-[6px]">®</sup></strong>
              {' '}<span className="font-medium">| All Rights Reserved.</span>
            </p>

            {/* Right: Payment Icons */}
            <div className="flex items-center justify-center md:justify-start flex-nowrap gap-1 md:col-span-1">
              {/* Google Pay */}
              {(cmsData?.footer?.paymentMethods?.googlepay !== false) && (
                <div style={{ background: '#f8f9fa', borderRadius: '3px', padding: '1px 3px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '24px', border: '1px solid #e5e7eb' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" style={{ height: '7px', objectFit: 'contain' }} />
                </div>
              )}
              {/* PayPal */}
              {(cmsData?.footer?.paymentMethods?.paypal !== false) && (
                <div style={{ background: '#172b85', borderRadius: '3px', padding: '1px 3px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '22px' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" style={{ height: '6px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                </div>
              )}
              {/* Mastercard */}
              {(cmsData?.footer?.paymentMethods?.mastercard !== false) && (
                <div style={{ background: '#1a1a1a', borderRadius: '3px', padding: '1px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '24px' }}>
                  <div style={{ position: 'relative', width: '15px', height: '9px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eb001b', position: 'absolute', left: '0' }}></div>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f79e1b', position: 'absolute', left: '4px', opacity: 0.9 }}></div>
                  </div>
                </div>
              )}
              {/* Visa */}
              {(cmsData?.footer?.paymentMethods?.visa !== false) && (
                <div style={{ background: '#1a56db', borderRadius: '3px', padding: '1px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '24px' }}>
                  <span style={{ color: '#ffffff', fontWeight: 800, fontStyle: 'italic', fontSize: '7px', fontFamily: 'Arial, sans-serif', letterSpacing: '0.3px' }}>VISA</span>
                </div>
              )}
              {/* Stripe */}
              {(cmsData?.footer?.paymentMethods?.stripe !== false) && (
                <div style={{ background: '#635bff', borderRadius: '3px', padding: '1px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '24px' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" style={{ height: '5px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                </div>
              )}
              {/* Apple Pay */}
              {(cmsData?.footer?.paymentMethods?.applepay !== false) && (
                <div style={{ background: '#000000', borderRadius: '3px', padding: '1px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '28px' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" alt="Apple Pay" style={{ height: '6px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                </div>
              )}
            </div>
          </div>
        </div>

      </footer>
    </div>
  );
};

export default LandingPage;
