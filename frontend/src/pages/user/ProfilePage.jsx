import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Wallet, Tag, ShoppingCart, ShoppingBag, MapPin, Bell, Palette, Heart,
  Wrench, Gift, Star, Share2, Headphones, Info, Shield, FileText, LogIn, LogOut,
  ChevronRight, Check, CheckCircle2, X, XCircle, RotateCcw, Copy, Plus, Trash2,
  ExternalLink, Moon, Sun, Laptop, ArrowRight
} from 'lucide-react';
import { authService, bookingService } from '../../services/apiService';
import toast from 'react-hot-toast';
import { clearAllAuth } from '@/shared/auth/clearAllAuth';
import { formatUserId } from '../../utils/publicIds';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [couponsCount, setCouponsCount] = useState(3);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [orderStats, setOrderStats] = useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    refunds: 0
  });

  // Settings states
  const [vegMode, setVegMode] = useState(() => {
    return localStorage.getItem('user_veg_mode') === 'true';
  });
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem('user_app_theme') || 'Red';
  });
  const [appearanceMode, setAppearanceMode] = useState(() => {
    return localStorage.getItem('user_appearance_mode') || 'Light mode';
  });

  // Modal States
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAppearanceModal, setShowAppearanceModal] = useState(false);
  const [rating, setRating] = useState(5);

  // New Address Form State
  const [newAddress, setNewAddress] = useState({ title: 'Home', address: '', landmark: '' });
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSavedAddresses();
  }, []);

  const loadUserData = async () => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    if (token && userRaw && !token.startsWith('bypass-token')) {
      try {
        const parsed = JSON.parse(userRaw);
        setUser(parsed);
        setIsLoggedIn(true);

        try {
          const profileRes = await authService.getMe();
          if (profileRes?.user) {
            setUser(profileRes.user);
            localStorage.setItem('user', JSON.stringify(profileRes.user));
          }
        } catch {
          // ignore
        }

        try {
          const bookingsRes = await bookingService.getMyBookings();
          const list = Array.isArray(bookingsRes) ? bookingsRes : (bookingsRes?.bookings || []);
          const upcoming = list.filter(b => ['confirmed', 'pending'].includes(b.bookingStatus?.toLowerCase())).length;
          const completed = list.filter(b => b.bookingStatus?.toLowerCase() === 'completed').length;
          const cancelled = list.filter(b => b.bookingStatus?.toLowerCase() === 'cancelled').length;
          const refunds = list.filter(b => b.paymentStatus?.toLowerCase() === 'refunded').length;
          setOrderStats({ upcoming, completed, cancelled, refunds });
        } catch {
          // ignore
        }
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const loadSavedAddresses = () => {
    try {
      const stored = localStorage.getItem('user_saved_addresses');
      if (stored) {
        setSavedAddresses(JSON.parse(stored));
      } else {
        setSavedAddresses([]);
      }
    } catch {
      setSavedAddresses([]);
    }
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!newAddress.address.trim()) {
      toast.error('Please enter address details');
      return;
    }
    const updated = [...savedAddresses, { id: Date.now().toString(), ...newAddress }];
    setSavedAddresses(updated);
    localStorage.setItem('user_saved_addresses', JSON.stringify(updated));
    setNewAddress({ title: 'Home', address: '', landmark: '' });
    setIsAddingAddress(false);
    toast.success('Address saved successfully!');
  };

  const handleDeleteAddress = (id) => {
    const updated = savedAddresses.filter(a => a.id !== id);
    setSavedAddresses(updated);
    localStorage.setItem('user_saved_addresses', JSON.stringify(updated));
    toast.success('Address removed');
  };

  const handleToggleVegMode = () => {
    const newVal = !vegMode;
    setVegMode(newVal);
    localStorage.setItem('user_veg_mode', String(newVal));
    if (newVal) {
      toast.success('Veg Mode activated: Showing only vegetarian items 🌿');
    } else {
      toast('Standard mode active');
    }
  };

  const handleSelectTheme = (themeName) => {
    setSelectedTheme(themeName);
    localStorage.setItem('user_app_theme', themeName);
    setShowThemeModal(false);
    toast.success(`App theme updated to ${themeName}`);
  };

  const handleSelectAppearance = (mode) => {
    setAppearanceMode(mode);
    localStorage.setItem('user_appearance_mode', mode);
    setShowAppearanceModal(false);
    toast.success(`Appearance set to ${mode}`);
  };

  const handleLogout = () => {
    clearAllAuth();
    setIsLoggedIn(false);
    setUser(null);
    setShowLogoutModal(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const copyToClipboard = (text, msg) => {
    navigator.clipboard.writeText(text);
    toast.success(msg || 'Copied to clipboard!');
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'MyDestination - Hotels, Tours & Stays',
      text: 'Explore premium hotels, wedding destinations, and tours on MyDestination!',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(window.location.origin, 'App link copied to clipboard!');
        }
      }
    } else {
      copyToClipboard(window.location.origin, 'App link copied to clipboard!');
    }
  };

  const handleShareReferral = async () => {
    const code = user?.referralCode || 'MYDEST100';
    const referLink = `${window.location.origin}/r/${code}`;
    const text = `Use my referral code ${code} to sign up on MyDestination and get ₹100 cashback! ${referLink}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join MyDestination',
          text,
          url: referLink
        });
      } catch {
        copyToClipboard(code, 'Referral code copied!');
      }
    } else {
      copyToClipboard(code, 'Referral code copied!');
    }
  };

  const availableCoupons = [
    { code: 'WELCOME100', discount: '₹100 OFF', desc: 'Flat ₹100 off on your first stay or order', min: 'Min booking ₹500' },
    { code: 'DESTINATION20', discount: '20% OFF', desc: 'Up to ₹500 off on luxury hotels & resorts', min: 'Min booking ₹1,500' },
    { code: 'ROYALWED', discount: '15% OFF', desc: 'Exclusive discount on wedding venue bookings', min: 'Min booking ₹50,000' }
  ];

  return (
    <div className="min-h-screen bg-[#F5F6F8] pb-28 text-gray-900 font-sans antialiased">
      {/* Top Header */}
      <div className="px-5 pt-6 pb-2">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl sm:text-[26px] font-black text-gray-900 tracking-tight">
            Profile
          </h1>
          <p className="text-xs sm:text-[13px] text-gray-500 font-medium mt-0.5">
            {isLoggedIn
              ? 'Manage your travel, bookings & account settings'
              : 'Log in to unlock orders, addresses & rewards'}
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-3 space-y-3.5">
        {/* 1. Top Guest / User Banner Card */}
        <div className="bg-[#FFF8F0] border border-[#FFE8D6] rounded-3xl p-5 shadow-xs transition-all">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-[#FFE8D6] flex items-center justify-center text-[#FF6A00] shrink-0 overflow-hidden shadow-2xs">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={26} className="text-[#FF6A00]" strokeWidth={2.2} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                  {isLoggedIn ? (user?.name || 'User') : 'Guest User'}
                </h2>
                {isLoggedIn && (
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                {isLoggedIn
                  ? (user?.phone || user?.email || 'Manage your account details')
                  : 'Sign in to access your orders, saved addresses & profile details.'}
              </p>
              {isLoggedIn && formatUserId(user) && (
                <p className="text-[10px] font-mono font-bold text-gray-400 mt-1 tracking-wide">
                  User ID: {formatUserId(user)}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            {isLoggedIn ? (
              <button
                onClick={() => navigate('/profile/edit')}
                className="w-full py-3 bg-[#FF6A00] hover:bg-[#F25C00] active:scale-[0.99] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
              >
                EDIT PROFILE & DETAILS
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 bg-[#FF6A00] hover:bg-[#F25C00] active:scale-[0.99] text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2"
              >
                LOG IN / SIGN UP
              </button>
            )}
          </div>
        </div>

        {/* 2. 2x2 Quick Action Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Wallet */}
          <div
            onClick={() => navigate('/wedding/wallet')}
            className="bg-white rounded-2xl p-3.5 border border-gray-100/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF2E5] flex items-center justify-center text-[#FF6A00] shrink-0">
                <Wallet size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400">Wallet</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight mt-0.5">
                  {isLoggedIn ? `₹${walletBalance}` : 'View Balance'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#FF6A00] shrink-0" />
          </div>

          {/* Coupons */}
          <div
            onClick={() => setShowCouponsModal(true)}
            className="bg-white rounded-2xl p-3.5 border border-gray-100/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF2E5] flex items-center justify-center text-[#FF6A00] shrink-0">
                <Tag size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400">Coupons</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight mt-0.5">
                  {couponsCount} Active
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#FF6A00] shrink-0" />
          </div>

          {/* My Cart */}
          <div
            onClick={() => navigate('/bookings')}
            className="bg-white rounded-2xl p-3.5 border border-gray-100/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF2E5] flex items-center justify-center text-[#FF6A00] shrink-0">
                <ShoppingCart size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400">My Cart</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight mt-0.5">
                  View Cart
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#FF6A00] shrink-0" />
          </div>

          {/* Saved Addresses */}
          <div
            onClick={() => setShowAddressModal(true)}
            className="bg-white rounded-2xl p-3.5 border border-gray-100/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF2E5] flex items-center justify-center text-[#FF6A00] shrink-0">
                <MapPin size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-gray-400">Saved Addresses</p>
                <p className="text-xs sm:text-sm font-bold text-gray-900 leading-tight mt-0.5">
                  {savedAddresses.length} Saved
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[#FF6A00] shrink-0" />
          </div>
        </div>

        {/* 3. Section 1: General Preferences Group (White rounded container) */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs divide-y divide-gray-50 overflow-hidden">
          {/* Notifications & Alerts */}
          <div
            onClick={() => navigate('/notifications')}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Bell size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Notifications & Alerts</p>
                <p className="text-xs text-gray-400 font-medium">Push alerts & promo settings</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          {/* Veg Mode */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F8EE] text-[#22C55E] flex items-center justify-center shrink-0">
                <span className="text-lg">🍃</span>
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Veg Mode</p>
                <p className="text-xs text-gray-400 font-medium">Show only vegetarian food items</p>
              </div>
            </div>
            {/* Custom Pill Toggle Matching Screenshot */}
            <div
              onClick={handleToggleVegMode}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer flex items-center p-0.5 ${
                vegMode ? 'bg-black' : 'bg-black'
              }`}
            >
              <motion.div
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className={`w-5 h-5 rounded-full bg-white shadow-sm ${
                  vegMode ? 'ml-auto' : 'ml-0'
                }`}
              />
            </div>
          </div>

          {/* Appearance Settings */}
          <div
            onClick={() => setShowAppearanceModal(true)}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Palette size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Appearance Settings</p>
                <p className="text-xs text-gray-400 font-medium">Theme: {appearanceMode}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          {/* App Theme */}
          <div
            onClick={() => setShowThemeModal(true)}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Palette size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">App Theme</p>
                <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500"></span> {selectedTheme}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          {/* Favorites */}
          <div
            onClick={() => navigate('/saved-places')}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Heart size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Favorites</p>
                <p className="text-xs text-gray-400 font-medium">Your favorite restaurants & dishes</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          {/* My Service Bookings */}
          <div
            onClick={() => navigate('/bookings')}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Wrench size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">My Service Bookings</p>
                <p className="text-xs text-gray-400 font-medium">Repairs, cleaning & home services</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </div>

        {/* 4. Section 2: My Orders Section Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              My Orders
            </h3>
            <button
              onClick={() => navigate('/bookings')}
              className="text-xs font-bold text-[#FF6A00] hover:text-[#F25C00] flex items-center gap-0.5"
            >
              View All Orders <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {/* Upcoming */}
            <div
              onClick={() => navigate('/bookings')}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#FFEFE2] flex items-center justify-center text-[#FF6A00] mb-1.5 shadow-2xs">
                <ShoppingBag size={18} strokeWidth={2.2} />
              </div>
              <span className="text-sm font-bold text-gray-900">{orderStats.upcoming}</span>
              <span className="text-[11px] font-medium text-gray-400">Upcoming</span>
            </div>

            {/* Completed */}
            <div
              onClick={() => navigate('/bookings')}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#E8F8EE] flex items-center justify-center text-[#22C55E] mb-1.5 shadow-2xs">
                <CheckCircle2 size={18} strokeWidth={2.2} />
              </div>
              <span className="text-sm font-bold text-gray-900">{orderStats.completed}</span>
              <span className="text-[11px] font-medium text-gray-400">Completed</span>
            </div>

            {/* Cancelled */}
            <div
              onClick={() => navigate('/bookings')}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#FEECEC] flex items-center justify-center text-[#EF4444] mb-1.5 shadow-2xs">
                <XCircle size={18} strokeWidth={2.2} />
              </div>
              <span className="text-sm font-bold text-gray-900">{orderStats.cancelled}</span>
              <span className="text-[11px] font-medium text-gray-400">Cancelled</span>
            </div>

            {/* Refunds */}
            <div
              onClick={() => navigate('/wedding/wallet')}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-[#FFEFE2] flex items-center justify-center text-[#FF6A00] mb-1.5 shadow-2xs">
                <RotateCcw size={18} strokeWidth={2.2} />
              </div>
              <span className="text-sm font-bold text-gray-900">{orderStats.refunds}</span>
              <span className="text-[11px] font-medium text-gray-400">Refunds</span>
            </div>
          </div>
        </div>

        {/* 5. Section 3: Engagement & Growth Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs divide-y divide-gray-50 overflow-hidden">
          {/* Refer & Earn */}
          <div
            onClick={handleShareReferral}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Gift size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Refer & Earn</p>
                <p className="text-xs text-gray-400 font-medium">
                  Code: • Share & earn ₹100
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          {/* Rate App */}
          <div
            onClick={() => setShowRateModal(true)}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Star size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Rate App</p>
                <p className="text-xs text-gray-400 font-medium">Love our app? Leave us a 5-star rating</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          {/* Share App */}
          <div
            onClick={handleShareApp}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Share2 size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Share App</p>
                <p className="text-xs text-gray-400 font-medium">Share Quickdrop food delivery app with friends</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </div>

        {/* 6. Section 4: Support & Legal Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-2xs divide-y divide-gray-50 overflow-hidden">
          {/* Help & Support */}
          <div
            onClick={() => navigate('/contact')}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Headphones size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Help & Support</p>
                <p className="text-xs text-gray-400 font-medium">FAQs, order refund status & 24/7 support</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          {/* About Us */}
          <div
            onClick={() => navigate('/about')}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Info size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">About Us</p>
                <p className="text-xs text-gray-400 font-medium">Version 1.2.0 • Quickdrop Food & Drink</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          {/* Privacy Policy */}
          <div
            onClick={() => navigate('/privacy')}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <Shield size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Privacy Policy</p>
                <p className="text-xs text-gray-400 font-medium">How we protect & manage your data</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>

          {/* Terms & Conditions */}
          <div
            onClick={() => navigate('/terms')}
            className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors cursor-pointer active:bg-gray-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-[#FEECEC] text-[#F87171] flex items-center justify-center shrink-0">
                <FileText size={19} strokeWidth={2.2} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Terms & Conditions</p>
                <p className="text-xs text-gray-400 font-medium">Service rules & delivery terms</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </div>
        </div>

        {/* 7. Bottom Log In / Log Out Action Button */}
        <div className="pt-2 pb-4">
          {isLoggedIn ? (
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full py-3.5 border-2 border-[#FF6A00] text-[#FF6A00] bg-white hover:bg-orange-50/40 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-[0.99]"
            >
              <LogOut size={18} className="text-[#FF6A00]" />
              Log Out of Account
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3.5 border-2 border-[#FF6A00] text-[#FF6A00] bg-white hover:bg-orange-50/40 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-[0.99]"
            >
              <LogIn size={18} className="text-[#FF6A00]" />
              Log In to Account
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS */}
      {/* ========================================================================= */}

      {/* 1. Saved Addresses Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF6A00] flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Saved Addresses</h3>
                </div>
                <button
                  onClick={() => { setShowAddressModal(false); setIsAddingAddress(false); }}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Address List */}
              {!isAddingAddress && (
                <div className="space-y-3">
                  {savedAddresses.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin size={36} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-700">No saved addresses yet</p>
                      <p className="text-xs text-gray-400 mt-0.5">Add your home, office or frequent destinations.</p>
                    </div>
                  ) : (
                    savedAddresses.map((addr) => (
                      <div key={addr.id} className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                              {addr.title}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{addr.address}</p>
                          {addr.landmark && (
                            <p className="text-[11px] text-gray-400 mt-0.5">Landmark: {addr.landmark}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-gray-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}

                  <button
                    onClick={() => setIsAddingAddress(true)}
                    className="w-full py-3 border-2 border-dashed border-orange-200 text-[#FF6A00] bg-orange-50/50 hover:bg-orange-50 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all mt-2"
                  >
                    <Plus size={16} /> Add New Address
                  </button>
                </div>
              )}

              {/* Add Address Form */}
              {isAddingAddress && (
                <form onSubmit={handleSaveAddress} className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Address Type</label>
                    <div className="flex gap-2 mt-1">
                      {['Home', 'Office', 'Other'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewAddress({ ...newAddress, title: type })}
                          className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                            newAddress.title === type
                              ? 'bg-[#FF6A00] text-white border-[#FF6A00]'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Full Address</label>
                    <textarea
                      required
                      rows={3}
                      value={newAddress.address}
                      onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                      placeholder="Flat / Building no., Street, Area, City, Pincode"
                      className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={newAddress.landmark}
                      onChange={e => setNewAddress({ ...newAddress, landmark: e.target.value })}
                      placeholder="Nearby hospital, mall or landmark"
                      className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#FF6A00]"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-[#FF6A00] hover:bg-[#F25C00] text-white font-bold rounded-xl text-xs shadow-sm"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Coupons Modal */}
      <AnimatePresence>
        {showCouponsModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-[#FF6A00] flex items-center justify-center">
                    <Tag size={16} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Available Coupons & Offers</h3>
                </div>
                <button
                  onClick={() => setShowCouponsModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {availableCoupons.map((c) => (
                  <div key={c.code} className="p-4 rounded-2xl border border-orange-200 bg-orange-50/40 relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-[#FF6A00] tracking-wider uppercase bg-white px-2.5 py-1 rounded-lg border border-orange-200 shadow-2xs">
                            {c.code}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            {c.discount}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 font-medium mt-2">{c.desc}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{c.min}</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(c.code, `Coupon ${c.code} copied!`)}
                        className="p-2 bg-white text-[#FF6A00] hover:bg-orange-100 rounded-xl border border-orange-200 shadow-2xs active:scale-95 transition-all"
                        title="Copy Code"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Appearance Settings Modal */}
      <AnimatePresence>
        {showAppearanceModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Appearance Settings</h3>
                <button
                  onClick={() => setShowAppearanceModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'Light mode', icon: Sun, desc: 'Default bright & clean appearance' },
                  { name: 'Dark mode', icon: Moon, desc: 'Reduced eye strain in low light' },
                  { name: 'System default', icon: Laptop, desc: 'Follows your device system preferences' }
                ].map(opt => {
                  const Icon = opt.icon;
                  const isSel = appearanceMode === opt.name;
                  return (
                    <div
                      key={opt.name}
                      onClick={() => handleSelectAppearance(opt.name)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSel ? 'border-[#FF6A00] bg-orange-50/40 shadow-2xs' : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isSel ? 'bg-[#FF6A00] text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{opt.name}</p>
                          <p className="text-[11px] text-gray-400">{opt.desc}</p>
                        </div>
                      </div>
                      {isSel && <Check size={18} className="text-[#FF6A00]" />}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. App Theme Modal */}
      <AnimatePresence>
        {showThemeModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">App Theme Color</h3>
                <button
                  onClick={() => setShowThemeModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-gray-200"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'Red', color: '#EF4444', label: '🔴 Red' },
                  { name: 'Orange', color: '#FF6A00', label: '🟠 Orange' },
                  { name: 'Emerald', color: '#10B981', label: '🟢 Emerald' },
                  { name: 'Blue', color: '#3B82F6', label: '🔵 Blue' },
                  { name: 'Purple', color: '#8B5CF6', label: '🟣 Purple' }
                ].map(theme => (
                  <button
                    key={theme.name}
                    onClick={() => handleSelectTheme(theme.name)}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                      selectedTheme === theme.name
                        ? 'border-[#FF6A00] bg-orange-50/40 shadow-2xs font-bold text-gray-900'
                        : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full shadow-xs shrink-0" style={{ backgroundColor: theme.color }}></span>
                    <span className="text-xs font-semibold">{theme.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Rate App Modal */}
      <AnimatePresence>
        {showRateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <Star size={28} className="fill-amber-500 text-amber-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Rate App</h3>
              <p className="text-xs text-gray-500 mb-5">
                How has your experience been with Quickdrop / MyDestination?
              </p>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform hover:scale-125"
                  >
                    <Star
                      size={30}
                      className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                    />
                  </button>
                ))}
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowRateModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Later
                </button>
                <button
                  onClick={() => {
                    setShowRateModal(false);
                    toast.success('Thank you for your 5-star feedback! ⭐');
                  }}
                  className="flex-1 py-3 bg-[#FF6A00] hover:bg-[#F25C00] text-white font-bold rounded-xl text-xs shadow-md shadow-orange-200"
                >
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Log Out</h3>
              <p className="text-xs text-gray-500 mb-6">
                Are you sure you want to log out of your account?
              </p>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-200"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfilePage;
