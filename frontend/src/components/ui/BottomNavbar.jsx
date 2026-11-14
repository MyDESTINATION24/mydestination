import React from 'react';
import { Briefcase, Navigation, User, LayoutGrid } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // One menu everywhere on phones. The services page (/home) used to swap in
    // a different bar -- Home, Hotels, Taxi, Wedding, Profile -- so tapping
    // Services landed on a highlighted "Home" tab: the same duplicate again.
    // Switching services is done by the tabs at the top of each service.
    const navItems = [
        // ?services=1 shows the services list; plain /home on a phone reopens
        // the last service, which made this button do nothing.
        { name: 'Services', icon: LayoutGrid, route: '/home?services=1' },
        { name: 'Bookings', icon: Briefcase, route: '/bookings' },
        { name: 'Near By', icon: Navigation, route: '/search' },
        { name: 'Profile', icon: User, route: '/profile' },
    ];

    const getActiveTab = (path) => {
        if (path === '/' || path === '/home' || path.startsWith('/hotels')) return 'Services';
        if (path.startsWith('/bookings')) return 'Bookings';
        if (path.includes('search') || path.includes('property')) return 'Near By';
        if (path.includes('profile') || path.includes('wallet') || path.includes('settings')) return 'Profile';
        return 'Services';
    };

    const activeTab = getActiveTab(location.pathname);

    const handleNavClick = (item) => {
        navigate(item.route);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] print:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center justify-around pt-1.5 pb-1 px-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.name;

                    return (
                        <button
                            key={item.name}
                            onClick={() => handleNavClick(item)}
                            className={`flex flex-col items-center gap-0.5 min-w-[64px] py-0.5 transition-all duration-300 ${isActive ? "scale-105" : "hover:scale-105"}`}
                        >
                            <div 
                                className={`w-9 h-9 flex items-center justify-center transition-all duration-500 ${isActive
                                    ? "font-bold shadow-2xs" 
                                    : "text-slate-400"
                                }`}
                                style={{
                                    borderRadius: 'var(--icon-radius, 50%)',
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
