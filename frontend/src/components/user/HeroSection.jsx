import React, { useState, useEffect } from 'react';
import { Search, Menu, Wallet, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/rokologin-removebg-preview.png';
import MobileMenu from '../../components/ui/MobileMenu';
import { useNavigate } from 'react-router-dom';
import walletService from '../../services/walletService';

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
                <div className="w-full px-5 py-3 md:px-0 md:py-0 md:bg-transparent">
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

            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

        </section>
    );
};

export default HeroSection;
