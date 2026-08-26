import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Wallet, Tag, ShoppingBag, MapPin, Bell, Palette, Heart,
  Car, Crown, Gift, Star, Share2, Headphones, Info, Shield,
  FileText, LogIn, LogOut, ChevronRight, CheckCircle2, XCircle,
  RotateCcw, Sparkles, Phone, Mail, Edit3, Loader2, Moon, Sun,
  Check, ArrowLeft, Copy, Clock, Layers
} from 'lucide-react';
import { userService, bookingService } from '../../services/apiService';
import toast from 'react-hot-toast';
import { clearAllAuth } from '@/shared/auth/clearAllAuth';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [couponsCount, setCouponsCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [orderStats, setOrderStats] = useState({
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    refunds: 0
  });
  const [vegMode, setVegMode] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [rating, setRating] = useState(5);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');

    if (token && userRaw && !token.startsWith('bypass-token')) {
      try {
        const parsed = JSON.parse(userRaw);
        setUser(parsed);
        setIsLoggedIn(true);

        // Fetch live profile / wallet / bookings in parallel
        try {
          const profileRes = await userService.getProfile();
          if (profileRes?.user) {
            setUser(profileRes.user);
            localStorage.setItem('user', JSON.stringify(profileRes.user));
          }
        } catch {
          // ignore
        }

        try {
          const walletRes = await userService.getWallet();
          if (walletRes?.balance !== undefined) {
            setWalletBalance(walletRes.balance);
          }
        } catch {
          // ignore
        }

        try {
          const savedRes = await userService.getSavedHotels();
          if (savedRes?.savedHotels) {
            setSavedCount(savedRes.savedHotels.length);
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
        console.error('Error parsing user data:', e);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const handleLogout = () => {
    clearAllAuth();
    setIsLoggedIn(false);
    setUser(null);
    setShowLogoutModal(false);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'MyDestination - Hotels, Tours & Stays',
      text: 'Book luxury hotels, wedding destinations, and cabs at the best prices with MyDestination!',
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(window.location.origin, 'Link copied to clipboard!');
        }
      }
    } else {
      copyToClipboard(window.location.origin, 'Link copied to clipboard!');
    }
  };

  const handleShareReferral = async () => {
    const code = user?.referralCode || 'MYDEST100';
    const referLink = `${window.location.origin}/r/${code}`;
    const text = `Use my referral code ${code} to sign up on MyDestination and get ₹100 wallet cashback! ${referLink}`;

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

  const copyToClipboard = (text, msg) => {
    navigator.clipboard.writeText(text);
    toast.success(msg || 'Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-24 text-slate-900 selection:bg-amber-100 selection:text-amber-900">
      {/* Top Header */}
      <div className="bg-white px-5 pt-7 pb-4 border-b border-slate-100 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Profile
          </h1>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            {isLoggedIn
              ? 'Manage your travel, bookings & account settings'
              : 'Log in to unlock orders, addresses & rewards'}
          </p>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 pt-5 space-y-4">
        {/* Hero User Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF8EE] via-[#FFF5E6] to-[#FFF1D6] border border-[#FDE5BE] rounded-[1.75rem] p-5 shadow-[0_4px_24px_rgba(234,162,33,0.08)]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-orange-200 border-2 border-white shadow-sm flex items-center justify-center text-amber-700 shrink-0 overflow-hidden relative">
              {user?.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User size={30} className="text-amber-800/80" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 truncate">
                  {isLoggedIn ? (user?.name || 'User') : 'Guest User'}
                </h2>
                {isLoggedIn && (
                  <span className="bg-amber-500/15 text-amber-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-amber-500/20">
                    Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5 line-clamp-2 leading-relaxed">
                {isLoggedIn
                  ? (user?.phone || user?.email || 'Manage your travel preferences')
                  : 'Sign in to access your orders, saved addresses & profile details.'}
              </p>
            </div>
          </div>

          {/* Action Button on Hero */}
          <div className="mt-4 pt-4 border-t border-amber-200/60 flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={() => navigate('/profile/edit')}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Edit3 size={15} />
                  Edit Profile & Address
                </button>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="p-3 bg-white/80 hover:bg-white text-rose-600 border border-rose-200/80 rounded-2xl transition-colors shadow-2xs active:scale-95"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <LogIn size={16} />
                LOG IN / SIGN UP
              </button>
            )}
          </div>
        </div>

        {/* 2x2 Quick Action Cards Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Wallet */}
          <div
            onClick={() => navigate('/wallet')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF6E9] flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Wallet</p>
                <p className="text-sm font-black text-slate-900 leading-tight">
                  {isLoggedIn ? `₹${walletBalance.toLocaleString('en-IN')}` : 'View Balance'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-amber-500/60 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Coupons */}
          <div
            onClick={() => navigate('/notifications')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] flex items-center justify-center text-orange-600 shrink-0 group-hover:scale-105 transition-transform">
                <Tag size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Coupons</p>
                <p className="text-sm font-black text-slate-900 leading-tight">
                  {isLoggedIn ? 'Active Offers' : '0 Active'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-orange-500/60 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* My Bookings / Cart */}
          <div
            onClick={() => navigate('/bookings')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF6E9] flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
                <ShoppingBag size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">My Bookings</p>
                <p className="text-sm font-black text-slate-900 leading-tight">
                  View Stays
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-amber-500/60 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
          </div>

          {/* Saved Places / Wishlist */}
          <div
            onClick={() => navigate('/saved-places')}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer flex items-center justify-between group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFF4EE] flex items-center justify-center text-orange-600 shrink-0 group-hover:scale-105 transition-transform">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Saved Places</p>
                <p className="text-sm font-black text-slate-900 leading-tight">
                  {savedCount > 0 ? `${savedCount} Saved` : '0 Saved'}
                </p>
              </div>
            </div>
            <ChevronRight size={16} className="text-orange-500/60 group-hover:text-orange-600 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Grouped Card: My Orders & Bookings Summary */}
        <div className="bg-white rounded-[1.5rem] border border-slate-100 p-5 shadow-[0_2px_14px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              My Orders & Stays
            </h3>
            <button
              onClick={() => navigate('/bookings')}
              className="text-xs font-black text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
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
              <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 mb-1.5 group-hover:bg-orange-100 transition-colors">
                <ShoppingBag size={20} />
              </div>
              <span className="text-sm font-black text-slate-900">{orderStats.upcoming}</span>
              <span className="text-[10px] font-semibold text-slate-400">Upcoming</span>
            </div>

            {/* Completed */}
            <div
              onClick={() => navigate('/bookings')}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1.5 group-hover:bg-emerald-100 transition-colors">
                <CheckCircle2 size={20} />
              </div>
              <span className="text-sm font-black text-slate-900">{orderStats.completed}</span>
              <span className="text-[10px] font-semibold text-slate-400">Completed</span>
            </div>

            {/* Cancelled */}
            <div
              onClick={() => navigate('/bookings')}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-1.5 group-hover:bg-rose-100 transition-colors">
                <XCircle size={20} />
              </div>
              <span className="text-sm font-black text-slate-900">{orderStats.cancelled}</span>
              <span className="text-[10px] font-semibold text-slate-400">Cancelled</span>
            </div>

            {/* Refunds */}
            <div
              onClick={() => navigate('/wallet')}
              className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-1.5 group-hover:bg-amber-100 transition-colors">
                <RotateCcw size={20} />
              </div>
              <span className="text-sm font-black text-slate-900">{orderStats.refunds}</span>
              <span className="text-[10px] font-semibold text-slate-400">Refunds</span>
            </div>
          </div>
        </div>

        {/* Grouped Card: Preferences & Services */}
        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-slate-100">
          {/* Notifications */}
          <div
            onClick={() => navigate('/notifications')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Bell size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Notifications & Alerts</p>
                <p className="text-[11px] text-slate-400 font-medium">Push alerts & promo settings</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>

          {/* Quick Filter: Verified / Premium Mode Toggle */}
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Couple & Family Friendly Mode</p>
                <p className="text-[11px] text-slate-400 font-medium">Highlight top verified stays</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={vegMode}
                onChange={(e) => {
                  setVegMode(e.target.checked);
                  toast.success(e.target.checked ? 'Filter mode active' : 'Standard view');
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:width-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Favorites */}
          <div
            onClick={() => navigate('/saved-places')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Heart size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Favorites & Wishlist</p>
                <p className="text-[11px] text-slate-400 font-medium">Your favorite hotels & destinations</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>

          {/* Taxi & Travel Services */}
          <div
            onClick={() => navigate('/taxi')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Car size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Taxi & Airport Rides</p>
                <p className="text-[11px] text-slate-400 font-medium">Cabs, rentals & outstation travel</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>

          {/* Wedding Module */}
          <div
            onClick={() => navigate('/wedding')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Crown size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Wedding Destinations & Venues</p>
                <p className="text-[11px] text-slate-400 font-medium">Royal palaces, beach resorts & planners</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>
        </div>

        {/* Grouped Card: Promotions & Sharing */}
        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-slate-100">
          {/* Refer & Earn */}
          <div
            onClick={handleShareReferral}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Gift size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Refer & Earn</p>
                <p className="text-[11px] text-slate-400 font-medium">
                  Code: {user?.referralCode || 'MYDEST100'} • Share & earn ₹100
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>

          {/* Rate App */}
          <div
            onClick={() => setShowRateModal(true)}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Star size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Rate App</p>
                <p className="text-[11px] text-slate-400 font-medium">Love our app? Leave us a 5-star rating</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>

          {/* Share App */}
          <div
            onClick={handleShareApp}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Share2 size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Share App</p>
                <p className="text-[11px] text-slate-400 font-medium">Share MyDestination app with friends</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>
        </div>

        {/* Grouped Card: Support & Legal */}
        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-[0_2px_14px_rgba(0,0,0,0.03)] overflow-hidden divide-y divide-slate-100">
          {/* Help & Support */}
          <div
            onClick={() => navigate('/support')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Headphones size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Help & Support</p>
                <p className="text-[11px] text-slate-400 font-medium">FAQs, booking refund status & 24/7 support</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>

          {/* About Us */}
          <div
            onClick={() => navigate('/about')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Info size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">About Us</p>
                <p className="text-[11px] text-slate-400 font-medium">Version 1.2.0 • MyDestination Travel & Stays</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>

          {/* Privacy Policy */}
          <div
            onClick={() => navigate('/privacy')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Privacy Policy</p>
                <p className="text-[11px] text-slate-400 font-medium">How we protect & manage your data</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>

          {/* Terms & Conditions */}
          <div
            onClick={() => navigate('/terms')}
            className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors cursor-pointer active:bg-slate-50"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Terms & Conditions</p>
                <p className="text-[11px] text-slate-400 font-medium">Service rules & delivery terms</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-slate-300" />
          </div>
        </div>

        {/* Bottom Login / Logout Button */}
        <div className="pt-2 pb-6">
          {isLoggedIn ? (
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full py-4 border-2 border-amber-500 text-amber-600 bg-white hover:bg-amber-50/50 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <LogOut size={18} className="text-amber-500" />
              Log Out of Account
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 border-2 border-amber-500 text-amber-600 bg-white hover:bg-amber-50/50 rounded-2xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <LogIn size={18} className="text-amber-500" />
              Log In to Account
            </button>
          )}
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut size={24} />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Confirm Logout</h3>
              <p className="text-xs text-slate-500 mb-6">
                Are you sure you want to log out of your MyDestination account?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs uppercase shadow-md shadow-rose-200"
                >
                  Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rate App Modal */}
      <AnimatePresence>
        {showRateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star size={28} className="fill-amber-500" />
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1">Rate MyDestination</h3>
              <p className="text-xs text-slate-500 mb-4">
                How has your travel booking experience been?
              </p>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1.5 focus:outline-none transition-transform hover:scale-125"
                  >
                    <Star
                      size={28}
                      className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRateModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase"
                >
                  Later
                </button>
                <button
                  onClick={() => {
                    setShowRateModal(false);
                    toast.success('Thank you for your rating!');
                  }}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs uppercase shadow-md shadow-amber-200"
                >
                  Submit
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
