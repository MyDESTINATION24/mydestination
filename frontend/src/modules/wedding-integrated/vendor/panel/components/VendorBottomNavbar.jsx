import React from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  UserCircle, 
  Image as ImageIcon, 
  MessageSquare, 
  Star,
  Settings,
  Building2,
  PlusCircle,
  CreditCard,
  Wallet
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const allNavItems = [
  { id: "dashboard", label: "Home", icon: LayoutDashboard, path: "/wedding/vendor/dashboard", venueOnly: false },
  { id: "leads", label: "Leads", icon: MessageSquare, path: "/wedding/vendor/leads", venueOnly: false },
  { id: "add-venue", label: "Add Venue", icon: PlusCircle, path: "/wedding/vendor/venues/add", venueOnly: true },
  { id: "my-venues", label: "My Venues", icon: Building2, path: "/wedding/vendor/venues/my", venueOnly: true },
  { id: "reviews", label: "Love", icon: Star, path: "/wedding/vendor/reviews", venueOnly: false },
  { id: "subscription", label: "Plan", icon: CreditCard, path: "/wedding/vendor/subscription", venueOnly: false },
  { id: "wallet", label: "Wallet", icon: Wallet, path: "/wedding/vendor/wallet", venueOnly: false },
  { id: "profile", label: "Profile", icon: UserCircle, path: "/wedding/vendor/profile", venueOnly: false },
  { id: "settings", label: "Admin", icon: Settings, path: "/wedding/vendor/settings", venueOnly: false },
];

const VendorBottomNavbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isVenueManager = user?.category === "Venue Manager";
  const navItems = allNavItems.filter((item) => !item.venueOnly || isVenueManager);

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#F3E9E2] px-1 pt-1.5 pb-[max(env(safe-area-inset-bottom),14px)] z-50 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        
        return (
          <Link
            key={item.id}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 transition-all duration-300 relative ${
              isActive ? "scale-105" : "hover:scale-105"
            } min-w-0 flex-1`}
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${
              isActive 
                ? "bg-[#B06A6C]/10 text-[#B06A6C]" 
                : "text-[#8E7E77] hover:bg-[#F3E9E2]/30"
            }`}>
              <Icon className={`w-4 h-4 ${isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
            </div>
            <span className={`text-[7.5px] font-black uppercase tracking-tighter truncate w-full text-center px-0.5 ${
              isActive ? "text-[#B06A6C]" : "text-[#8E7E77]"
            }`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
};

export default VendorBottomNavbar;
