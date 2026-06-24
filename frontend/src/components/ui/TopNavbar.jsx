import React from 'react';
import { User, Globe, Navigation, Menu } from 'lucide-react';
import logo from '../../assets/rokologin-removebg-preview.png';
import weddingLogo from '../../modules/wedding-integrated/assets/logo.png';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { propertyService } from '../../services/propertyService';
import { toast } from 'react-hot-toast';

const taxiLogo = '/taxi/WhatsApp_Image_2026-06-23_at_3.32.53_PM-removebg-preview.png';

const TopNavbar = () => {
    const navigate = useNavigate();
    // Get user from local storage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.name || 'User';

    const location = useLocation();
    
    // Check if we are on the Super App Dashboard
    const isSuperApp = location.pathname === '/' || location.pathname === '/home';
    const isGlobalModule = location.pathname.startsWith('/settings') || location.pathname.startsWith('/saved-places') || location.pathname.startsWith('/wallet');
    const isWeddingModule = location.pathname.startsWith('/wedding');
    const isTaxiModule = location.pathname.startsWith('/taxi');
    const isHotelModule = !isSuperApp && !isGlobalModule && !isWeddingModule && !isTaxiModule;
    
    // Fallback to show default links (Hotel links) on global pages like Wallet so header doesn't look broken
    const showDefaultLinks = isHotelModule || isGlobalModule;

    const hoverClass = isWeddingModule ? 'hover:text-[#81313A]' : 'hover:text-surface';

    if (isSuperApp) {
        return null;
    }

    const handleNearBy = async (e) => {
        e.preventDefault();
        try {
            toast.loading('Getting your location...');
            const location = await propertyService.getCurrentLocation();
            toast.dismiss();
            navigate(`/search?lat=${location.lat}&lng=${location.lng}&radius=50&sort=distance`);
        } catch (error) {
            toast.dismiss();
            toast.error('Could not get location. Please enable permissions.');
        }
    };

    return (
        <nav className="hidden md:flex w-full h-16 bg-white/95 backdrop-blur-md border-b border-gray-100 px-8 justify-between items-center fixed top-0 z-[60]">

            {/* Logo and Menu */}
            <div className="flex items-center gap-4">
                {isWeddingModule && (
                    <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openWeddingSidebar'))}
                        className="w-10 h-10 rounded-full bg-[#81313A]/5 text-[#81313A] flex items-center justify-center hover:bg-[#81313A]/10 transition"
                        title="Wedding Menu"
                    >
                        <Menu size={20} />
                    </button>
                )}
                <Link to={isWeddingModule ? "/wedding" : isTaxiModule ? "/taxi" : "/home"}>
                    <img src={isWeddingModule ? weddingLogo : isTaxiModule ? taxiLogo : logo} alt="My DESTINATION" className="h-12 object-contain" />
                </Link>
            </div>

            {/* Desktop Links */}
            <div className="flex items-center gap-8">
                {/* Always show Services and Home */}
                <Link to="/home" className={`text-gray-600 font-bold text-sm ${hoverClass} transition`}>
                    Services
                </Link>
                <Link 
                    to={isWeddingModule ? '/wedding' : isTaxiModule ? '/taxi' : isGlobalModule ? '/home' : '/hotels'} 
                    className={`text-gray-600 font-bold text-sm ${hoverClass} transition`}
                >
                    Home
                </Link>
                
                {/* Default / Hotel Specific Links */}
                {showDefaultLinks && (
                    <>
                        <Link to="/listings" className="text-gray-600 font-bold text-sm hover:text-surface transition">
                            Search
                        </Link>
                        <Link to="/bookings" className="text-gray-600 font-bold text-sm hover:text-surface transition">
                            Bookings
                        </Link>
                        <button
                            onClick={handleNearBy}
                            className="text-gray-600 font-bold text-sm hover:text-surface transition flex items-center gap-1.5"
                        >
                            <Navigation size={16} />
                            Near By
                        </button>
                        <Link to="/refer" className="text-gray-600 font-bold text-sm hover:text-surface transition">
                            Refer & Earn
                        </Link>
                    </>
                )}

                {/* Wedding Specific Links */}
                {isWeddingModule && (
                    <>
                        <Link to="/wedding/destinations" className="text-gray-600 font-bold text-sm hover:text-[#81313A] transition">
                            Destinations
                        </Link>
                        <Link to="/wedding/vendors" className="text-gray-600 font-bold text-sm hover:text-[#81313A] transition">
                            Vendors
                        </Link>
                        <Link to="/wedding/planners" className="text-gray-600 font-bold text-sm hover:text-[#81313A] transition">
                            Planners
                        </Link>
                    </>
                )}

                {/* Taxi Specific Links */}
                {isTaxiModule && (
                    <>
                        <Link to="/taxi/rides" className="text-gray-600 font-bold text-sm hover:text-yellow-500 transition">
                            My Rides
                        </Link>
                        <Link to="/taxi/support" className="text-gray-600 font-bold text-sm hover:text-yellow-500 transition">
                            Support
                        </Link>
                    </>
                )}
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
                <Link
                    to={isWeddingModule ? '/wedding/saved' : '/saved-places'}
                    className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition"
                >
                    <Globe size={18} className={isWeddingModule ? "text-[#81313A]" : "text-surface"} />
                </Link>

                <Link
                    to={isWeddingModule ? '/wedding/account' : '/settings'}
                    className={`pl-3 pr-4 py-1.5 bg-gray-50 border border-gray-200 rounded-full flex items-center gap-3 ${isWeddingModule ? 'hover:border-[#81313A]' : 'hover:border-surface'} transition group`}
                >
                    <div className={`w-8 h-8 rounded-full ${isWeddingModule ? 'bg-[#81313A]' : 'bg-surface'} text-white flex items-center justify-center font-bold text-xs`}>
                        {userName.charAt(0)}
                    </div>
                    <span className={`text-sm font-bold ${isWeddingModule ? 'text-[#81313A] group-hover:text-[#81313A]/80' : 'text-surface group-hover:text-surface/80'}`}>
                        {userName.split(' ')[0]}
                    </span>
                </Link>
            </div>

        </nav>
    );
};

export default TopNavbar;
