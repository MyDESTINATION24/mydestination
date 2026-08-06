import React from 'react';
import { Home, Briefcase, Navigation, User, Building2, Car, Heart, LayoutGrid } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isSuperApp = location.pathname === '/' || location.pathname === '/home';

    const superAppNavItems = [
        { name: 'Home', icon: Home, route: '/home' },
        { name: 'Hotels', icon: Building2, route: '/hotels' },
        { name: 'Taxi', icon: Car, route: '/taxi' },
        { name: 'Wedding', icon: Heart, route: '/wedding' },
        { name: 'Profile', icon: User, route: '/profile/edit' },
    ];

    const hotelNavItems = [
        { name: 'Services', icon: LayoutGrid, route: '/home' },
        { name: 'Home', icon: Home, route: '/hotels' },
        { name: 'Bookings', icon: Briefcase, route: '/bookings' },
        { name: 'Near By', icon: Navigation, route: '/search' },
        { name: 'Profile', icon: User, route: '/profile/edit' },
    ];

    const navItems = isSuperApp ? superAppNavItems : hotelNavItems;

    const getActiveTab = (path) => {
        if (isSuperApp) {
            if (path === '/' || path === '/home') return 'Home';
            if (path.startsWith('/hotels') || path.includes('property')) return 'Hotels';
            if (path.startsWith('/taxi')) return 'Taxi';
            if (path.startsWith('/wedding')) return 'Wedding';
            if (path.includes('profile') || path.includes('bookings') || path.includes('wallet') || path.includes('settings')) return 'Profile';
            return 'Home';
        } else {
            if (path === '/' || path === '/home' || path.startsWith('/hotels')) return 'Home';
            if (path.startsWith('/bookings')) return 'Bookings';
            if (path.includes('search') || path.includes('property')) return 'Near By';
            if (path.includes('profile') || path.includes('wallet') || path.includes('settings')) return 'Profile';
            return 'Home';
        }
    };

    const activeTab = getActiveTab(location.pathname);

    const handleNavClick = (item) => {
        navigate(item.route);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] pb-[max(env(safe-area-inset-bottom),14px)] print:hidden">
            <div className="flex items-center justify-around py-2.5 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;

                    return (
                        <button
                            key={item.name}
                            onClick={() => handleNavClick(item)}
                            className={`flex flex-col items-center gap-1 min-w-[70px] transition-all duration-300 ${isActive ? "scale-105" : "hover:scale-105"}`}
                        >
                            <div 
                                className={`w-12 h-11 flex items-center justify-center transition-all duration-500 ${isActive
                                    ? "font-bold shadow-2xs" 
                                    : "text-slate-400"
                                }`}
                                style={{
                                    borderRadius: 'var(--icon-radius, 1.25rem)',
                                    ...(isActive ? { background: 'var(--color-theme-gradient, var(--color-surface, #FFD000))', color: '#1a261a' } : {})
                                }}
                            >
                                <Icon className={`w-5.5 h-5.5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                            </div>
                            <span 
                                className={`text-[9px] font-black uppercase tracking-[0.12em] ${isActive ? "font-extrabold" : "text-slate-400"}`}
                                style={isActive ? { color: 'var(--color-surface, #FFD000)' } : {}}
                            >
                                {item.name}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BottomNavbar;
