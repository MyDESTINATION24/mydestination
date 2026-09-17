import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  UserCircle, 
  Image as ImageIcon, 
  MessageSquare, 
  Star, 
  Settings, 
  X,
  LogOut,
  Eye,
  Building2,
  Wallet,
  CreditCard
} from "lucide-react";

const allNavItems = [
  { id: "dashboard", label: "Vendor Dashboard", icon: LayoutDashboard, path: "/wedding/vendor/dashboard", venueOnly: false },
  { id: "profile", label: "Vendor Profile", icon: UserCircle, path: "/wedding/vendor/profile", venueOnly: false },
  { id: "add-venue", label: "Add Venue", icon: Building2, path: "/wedding/vendor/venues/add", venueOnly: true },
  { id: "my-venues", label: "My Venues", icon: Building2, path: "/wedding/vendor/venues/my", venueOnly: true },
  { id: "leads", label: "Enquiry Inbox", icon: MessageSquare, path: "/wedding/vendor/leads", venueOnly: false },
  { id: "wallet", label: "My Wallet", icon: Wallet, path: "/wedding/vendor/wallet", venueOnly: false },
  { id: "subscription", label: "My Subscription", icon: CreditCard, path: "/wedding/vendor/subscription", venueOnly: false },
  { id: "reviews", label: "Client Love", icon: Star, path: "/wedding/vendor/reviews", venueOnly: false },
  { id: "settings", label: "Vendor Settings", icon: Settings, path: "/wedding/vendor/settings", venueOnly: false },
];

const VendorSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isVenueManager = user?.category === "Venue Manager";
  const navItems = allNavItems.filter((item) => !item.venueOnly || isVenueManager);
  // Every vendor used to see a placeholder name and a stock photo of a stranger
  // here. Show the signed-in vendor instead.
  const [vendorName, setVendorName] = useState(user?.name || "Vendor");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/wedding/vendor/login");
  };

  useEffect(() => {
    const handleUpdate = (e) => {
      if (e.detail && e.detail.name) setVendorName(e.detail.name);
    };

    if (user?.name) setVendorName(user.name);
    window.addEventListener('vendorProfileUpdate', handleUpdate);
    return () => window.removeEventListener('vendorProfileUpdate', handleUpdate);
  }, [user?.name]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-40 lg:hidden transition-all duration-500"
          onClick={onClose}
        />
      )}

      <aside 
        className={`fixed top-0 lg:top-4 left-0 lg:left-4 bottom-0 lg:bottom-4 w-72 bg-gradient-to-b from-[#EBE0D8] to-[#F3E9E2] border border-[#DED0C5] z-50 transition-all duration-500 transform lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:rounded-[2.5rem] lg:shadow-2xl lg:shadow-[#4A3730]/10 overflow-hidden`}
      >
        <div className="h-full flex flex-col p-8 pb-6">
          {/* Logo & Close Button */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/wedding" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#B06A6C] to-[#9E5A5C] flex items-center justify-center shadow-xl shadow-[#B06A6C]/30 transition-transform group-hover:rotate-6">
                <span className="text-white font-black text-2xl  pt-0.5">D</span>
              </div>
              <div className="flex flex-col">
                <span className="font-black text-2xl  text-[#4A3730] leading-none" >
                  Destine
                </span>
                <span className="text-[10px] font-black text-[#B06A6C] uppercase tracking-[0.2em] mt-1 ml-0.5 opacity-80">
                  Business
                </span>
              </div>
            </Link>
            <button 
              onClick={onClose}
              className="lg:hidden p-2.5 rounded-2xl bg-[#F3E9E2] text-[#B06A6C] hover:bg-[#B06A6C] hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 space-y-2.5 overflow-y-auto wedding-sidebar-scrollbar pr-2 -mr-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-4 px-6 py-4 rounded-[1.25rem] font-black text-[13px] transition-all duration-500 group relative overflow-hidden ${
                    isActive 
                      ? "bg-gradient-to-r from-[#B06A6C] to-[#C17A7C] text-white shadow-lg shadow-[#B06A6C]/30" 
                      : "text-[#7B6A62] hover:bg-white/40 hover:text-[#B06A6C]"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-all duration-500 ${isActive ? "scale-110 rotate-3" : "group-hover:scale-110 active:scale-90"}`} />
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Preview & Profile Actions */}
          <div className="mt-6 pt-6 border-t border-[#DED0C5] shrink-0">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xl rotate-3 shrink-0 bg-gradient-to-br from-[#B06A6C] to-[#9E5A5C] flex items-center justify-center">
                  <span className="text-white font-black text-lg">{String(vendorName || "V").trim().charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black text-[#4A3730]">{vendorName}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold text-[#7B6A62] uppercase tracking-widest leading-none mt-0.5">Vendor Admin</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowLogoutModal(true)}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-black text-[12px] bg-white/40 text-rose-600 border border-rose-200/50 hover:bg-rose-500 hover:text-white transition-all group"
              >
                <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
                Sign Out Vendor
              </button>
            </div>
          </div>
        </div>
      </aside>
      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background: "rgba(30,15,10,0.55)", backdropFilter: "blur(8px)" }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-[2rem] border border-[#DED0C5] shadow-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #F9F3EE 0%, #EFE5DC 100%)",
              boxShadow: "0 30px 80px rgba(176,106,108,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent bar */}
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #B06A6C, #C17A7C, #B06A6C)" }} />

            <div className="px-8 pt-8 pb-8 flex flex-col items-center gap-5">
              {/* Icon */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #B06A6C22, #B06A6C44)" }}
              >
                <LogOut className="w-7 h-7 text-[#B06A6C]" />
              </div>

              {/* Text */}
              <div className="text-center">
                <h3 className="text-xl font-black text-[#4A3730] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Sign Out?
                </h3>
                <p className="text-sm text-[#7B6A62] font-semibold mt-1.5 leading-relaxed">
                  Are you sure you want to sign out of your vendor workspace?
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 w-full mt-1">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3.5 rounded-2xl font-black text-[13px] text-[#7B6A62] bg-white/70 border border-[#DED0C5] hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3.5 rounded-2xl font-black text-[13px] text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #B06A6C, #C17A7C)" }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorSidebar;
