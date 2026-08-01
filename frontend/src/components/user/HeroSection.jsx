import React, { useState, useEffect } from 'react';
import { Search, Menu, Wallet, Bell, SlidersHorizontal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/rokologin-removebg-preview.png';
import MobileMenu from '../../components/ui/MobileMenu';
import { useNavigate } from 'react-router-dom';
import walletService from '../../services/walletService';
import BirdFlock from '../common/BirdFlock';
import resortHero from '../../assets/hotels/resort-hero.jpg';

const HeroSection = () => {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [placeholderIndex, setPlaceholderIndex] = useState(0);
    const [walletBalance, setWalletBalance] = useState(0);

    const placeholders = [
        "Search in Bucharest...",
        "Find luxury hotels...",
        "Book villas in Bali...",
        "Couple friendly stays...",
        "Search near Red Square..."
    ];

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const token = localStorage.getItem('token');
                const user = JSON.parse(localStorage.getItem('user') || '{}');

                // If using bypass token, show mock balance instead of calling API
                if (token && token.startsWith('bypass-token')) {
                    setWalletBalance(100); // Mock ₹100
                    return;
                }

                if (user?._id) {
                    const walletData = await walletService.getWallet();
                    if (walletData.success && walletData.wallet) {
                        setWalletBalance(walletData.wallet.balance);
                    }
                }
            } catch (error) {
                // Silently handle 401 errors for bypass tokens or unauthenticated states
                if (error?.status !== 401) {
                    console.error('Failed to fetch wallet', error);
                }
            }
        };
        fetchWallet();
    }, []);

    // Placeholder Rotation
    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [placeholders.length]);

    const handleSearchClick = () => {
        navigate('/search');
    };

    return (
        <section className="relative w-full px-5 pt-4 pb-2 flex flex-col gap-4 md:gap-6 md:pt-8 md:pb-10 bg-transparent transition-all duration-300">

            {/* Fixed Sticky Header & Search Bar block on mobile, relative on desktop */}
            <div className="fixed top-0 left-0 right-0 z-[60] bg-[var(--color-hotel-bg)] flex flex-col shadow-sm md:shadow-none md:relative md:top-auto md:left-auto md:right-auto md:z-auto md:bg-transparent">
                
                {/* 1. Header Row (Fixed on mobile) */}
                <div className="flex md:hidden items-center justify-between h-[88px] pt-7 pb-2 px-5 bg-surface text-white">
                    
                    {/* Left Section: Menu & Logo */}
                    <div className="flex items-center gap-2">
                        {/* Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(true)}
                            className="p-1 -ml-1 text-white hover:opacity-80 transition-opacity"
                        >
                            <Menu size={24} />
                        </button>

                        {/* Logo */}
                        <img
                            src={logo}
                            alt="My DESTINATION Logo"
                            className="h-10 object-contain ml-1"
                        />
                    </div>

                    {/* Right Section: Wallet & Notifications */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/wallet')}
                            className="relative p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition shadow-sm"
                            title="My Wallet"
                        >
                            <Wallet size={18} />
                        </button>
                        <button
                            onClick={() => navigate('/notifications')}
                            className="relative p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition shadow-sm"
                            title="Notifications"
                        >
                            <Bell size={18} />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border-2 border-[var(--color-surface)] rounded-full"></span>
                        </button>
                    </div>
                </div>

                {/* 2. Search Bar Wrapper (Fixed below header on mobile) */}
                <div className="w-full px-5 py-3 md:hidden">
                    <div
                        onClick={handleSearchClick}
                        className="w-full bg-white h-11 md:h-14 rounded-xl md:rounded-2xl shadow-sm border border-surface/5 flex items-center px-3 md:px-4 gap-2 md:gap-3 relative overflow-hidden cursor-pointer transition-all duration-300"
                    >
                        <Search size={18} className="text-surface/50 z-10 md:w-6 md:h-6" />

                        <div className="flex-1 h-full flex items-center bg-transparent outline-none text-surface font-medium z-20 relative text-xs md:text-sm">
                            {/* Input simulated via div/text */}
                        </div>

                        <div className="absolute left-9 right-10 md:left-12 md:right-12 h-full flex items-center pointer-events-none z-0">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={placeholderIndex}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="text-surface/50 font-normal text-xs md:text-sm absolute w-full truncate"
                                >
                                    {placeholders[placeholderIndex]}
                                </motion.span>
                            </AnimatePresence>
                        </div>

                        {/* Filter Icon */}
                        <button className="p-1 rounded-lg bg-surface/5 z-10">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-surface)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="6" x2="20" y2="6"></line>
                                <line x1="4" y1="12" x2="20" y2="12"></line>
                                <line x1="4" y1="18" x2="12" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Layout spacer for fixed header block on mobile */}
            <div className="h-[156px] md:hidden shrink-0"></div>

            {/* Desktop hero */}
            <div className="hidden md:block relative -mt-2 overflow-hidden rounded-[28px] border border-white/60 shadow-[0_18px_50px_-18px_rgba(15,23,42,0.18)]">
                <img
                    src={resortHero}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Light scrim from the left -- enough for the copy to hold, not
                    enough to wash the photo out */}
                <div className="absolute inset-0 bg-[linear-gradient(95deg,rgba(2,20,28,0.62)_0%,rgba(2,20,28,0.38)_38%,rgba(2,20,28,0.08)_62%,transparent_82%)]" />
                <BirdFlock
                    tint="255,255,255"
                    birds={[
                        { top: '18%', width: 40, opacity: 0.75, duration: 26, delay: 0,  bob: 8, flap: 0.85 },
                        { top: '30%', width: 30, opacity: 0.6,  duration: 33, delay: 5,  bob: 6, flap: 1.05 },
                        { top: '12%', width: 24, opacity: 0.5,  duration: 40, delay: 11, bob: 5, flap: 1.2 },
                    ]}
                />

                <div className="relative z-10 px-10 py-14 lg:px-14 lg:py-16">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-md">
                        Discover Your Perfect Stay <Sparkles size={12} className="text-emerald-500" />
                    </span>

                    <h1 className="mt-5 text-[2.6rem] font-black leading-[1.08] tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] lg:text-[3.1rem]">
                        Find the best hotels for
                        <br />
                        <span className="text-emerald-300">your next adventure</span>
                    </h1>

                    <p className="mt-3 text-sm font-semibold text-white/85 lg:text-base">
                        Luxury stays, unforgettable experiences
                    </p>

                    {/* Search row */}
                    <div className="mt-8 flex max-w-3xl items-center gap-2 rounded-[20px] border border-white/70 bg-white/95 p-2 shadow-[0_12px_36px_-12px_rgba(15,23,42,0.2)] backdrop-blur">
                        <div
                            onClick={handleSearchClick}
                            className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-4"
                        >
                            <Search size={19} className="shrink-0 text-surface/40" />
                            <span className="truncate text-sm font-medium text-surface/45">
                                Find luxury hotels, resorts, homestays...
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={handleSearchClick}
                            className="flex shrink-0 items-center gap-2 rounded-[14px] border border-surface/10 bg-white px-4 py-3 text-[13px] font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                            <SlidersHorizontal size={15} />
                            Filters
                        </button>
                        <button
                            type="button"
                            onClick={handleSearchClick}
                            className="flex shrink-0 items-center gap-2 rounded-[14px] bg-emerald-700 px-6 py-3 text-[13px] font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 active:scale-95"
                        >
                            <Search size={15} />
                            Search
                        </button>
                    </div>
                </div>
            </div>

            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        </section>
    );
};

export default HeroSection;
