import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Edit3, X, LogOut, LayoutGrid, Clock, Map, Home, Bell, Wallet } from 'lucide-react';
import { useSettings } from '../../../../shared/context/SettingsContext';
import { clearLocalUserSession } from '../services/authService';

const TaxiSidebar = ({ isOpen: propIsOpen, onClose: propOnClose }) => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const logoImg = settings?.general?.logo || '';
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    const [localIsOpen, setLocalIsOpen] = useState(false);

    useEffect(() => {
        const handleOpen = () => setLocalIsOpen(true);
        window.addEventListener('openTaxiSidebar', handleOpen);
        return () => window.removeEventListener('openTaxiSidebar', handleOpen);
    }, []);

    const isOpen = propIsOpen !== undefined ? propIsOpen : localIsOpen;
    
    const onClose = () => {
        if (propOnClose) propOnClose();
        setLocalIsOpen(false);
    };

    const handleNavigation = (path) => {
        onClose();
        navigate(path);
    };

    const handleLogout = () => {
        clearLocalUserSession();
        window.location.href = '/login';
    };

    const navLinks = [
        { icon: LayoutGrid, label: 'All Services', path: '/home' },
        { icon: Home, label: 'Taxi Home', path: '/taxi/user' },
        { icon: Clock, label: 'My Rides', path: '/taxi/user/activity' },
        { icon: Wallet, label: 'Wallet', path: '/taxi/wallet' },
        { icon: Bell, label: 'Notifications', path: '/taxi/notifications' },
        { icon: Map, label: 'Support', path: '/taxi/user/support' },
    ];

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100]" style={{ touchAction: 'none' }}>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
                        onClick={onClose} 
                    />
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'tween', ease: 'circOut', duration: 0.4 }}
                        className="absolute top-0 left-0 h-[100dvh] w-[85%] max-w-[300px] bg-white shadow-2xl flex flex-col"
                    >
                        <div className="flex items-center justify-between px-5 pb-2 pt-[calc(env(safe-area-inset-top)+1.25rem)] shrink-0">
                            <img src={logoImg} alt="Logo" className="h-16 object-contain" />
                            <button onClick={onClose} className="p-2 text-slate-400 bg-slate-50 rounded-full hover:text-slate-600 hover:bg-slate-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            <div className="px-5 mb-4 shrink-0">
                                {user ? (
                                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                        <div className="flex items-start justify-between relative z-10">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border-2 border-white/20 backdrop-blur-sm overflow-hidden">
                                                    {user.profileImage || user.avatar ? (
                                                        <img src={user.profileImage || user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={22} className="text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-base leading-tight">{user.name}</h3>
                                                    <p className="text-[11px] text-white/60 mt-0.5">{user.phone || 'User Profile'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleNavigation('/taxi/user/profile')} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm">
                                                <Edit3 size={14} className="text-white" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-500 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                                                <User size={20} className="text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-base leading-tight">Guest User</h3>
                                                <p className="text-[10px] text-white/60">Sign in for better experience</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <button onClick={() => handleNavigation('/login')} className="flex-1 py-2 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Login</button>
                                            <button onClick={() => handleNavigation('/signup')} className="flex-1 py-2 bg-white/10 text-white border border-white/20 text-xs font-bold rounded-lg hover:bg-white/20 transition-colors">Signup</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="px-5 space-y-2 pb-6">
                                {navLinks.map((link, idx) => {
                                    const Icon = link.icon;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleNavigation(link.path)}
                                            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                                                <Icon size={18} />
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm">{link.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {user && (
                            <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0">
                                <button 
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-3 p-3 rounded-2xl text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-all font-bold shadow-sm group"
                                >
                                    <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600 transition-colors">
                                        <LogOut size={16} />
                                    </div>
                                    <span className="text-sm">Log Out</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default TaxiSidebar;
