import React, { useState } from "react";
import { 
  Menu, 
  ChevronDown, 
  LogOut,
  Settings,
  User,
  Search,
  Camera,
  Loader2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import NotificationDropdown from "./NotificationDropdown";
import GlobalSearch from "./GlobalSearch";
import { api } from "../../../../../services/apiService";
import toast from "react-hot-toast";

const VendorNavbar = ({ onOpenSidebar, title = "Dashboard" }) => {
  const { user, logout, updateUser } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/wedding/vendor/login");
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/auth/upload-profile-image', formData);

      if (response.data.success) {
        updateUser({ profileImage: response.data.profileImage });
        toast.success("Profile photo updated!");
      }
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const vendorName = user?.name || "Vendor Admin";
  const vendorImage = user?.profileImage;

  return (
    <header className="sticky top-0 right-0 left-0 bg-[#F7F1ED] border-b border-[#DED0C5] z-50 transition-all duration-300 shadow-sm">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*" 
      />

      <div className="flex h-16 md:h-20 items-center justify-between px-4 md:px-12 gap-3">

        {/* Title Area - Hidden on mobile search */}
        {!showMobileSearch && (
          <div className="flex items-center gap-6 animate-wedding-fade-in shrink-0">
            <div className="flex flex-col">
              <h1 className="text-lg md:text-xl font-black text-[#4A3730] uppercase tracking-wider leading-tight">
                {title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#B06A6C] animate-pulse" />
                <p className="text-[9px] md:text-[10px] font-black text-[#7B6A62] uppercase tracking-[0.25em]">
                  Vendor Workspace
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Search Input */}
        {showMobileSearch && (
          <div className="flex-1 lg:hidden animate-wedding-slide-down">
            <GlobalSearch
              query={searchQuery}
              setQuery={setSearchQuery}
              onCloseMobile={() => setShowMobileSearch(false)}
            />
          </div>
        )}

        {/* Global Search (Desktop) */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-8">
          <GlobalSearch query={searchQuery} setQuery={setSearchQuery} />
        </div>

        {/* Action Icons */}
        <div className={`flex items-center gap-2 md:gap-4 ${showMobileSearch ? 'hidden md:flex' : 'flex'}`}>
          <NotificationDropdown />

          {/* Mobile Search Toggle */}
          {!showMobileSearch && (
            <button
              onClick={() => setShowMobileSearch(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-[#B06A6C]/10 text-[#B06A6C] flex items-center justify-center hover:bg-[#B06A6C] hover:text-white transition-all group"
            >
              <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}

          <div className="h-8 w-[1px] bg-[#F3E9E2] mx-1 hidden lg:block" />

          {/* Profile Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-3 group shrink-0">
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-md relative bg-white flex items-center justify-center cursor-pointer group/avatar"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-[#B06A6C] animate-spin" />
                ) : vendorImage ? (
                  <>
                    <img 
                      src={vendorImage} 
                      alt="Profile" 
                      className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-4 h-4 text-white" />
                    </div>
                  </>
                ) : (
                  <User className="w-6 h-6 text-[#B06A6C]" />
                )}
              </div>
              <div 
                onClick={() => setShowDropdown(!showDropdown)}
                className="hidden sm:flex flex-col gap-0.5 cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black text-[#4A3730]">{vendorName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[#8E7E77] transition-transform duration-300 ${showDropdown ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} />
                </div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">
                  {user?.isVerified ? 'Verified' : 'Partner'}
                </span>
              </div>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setShowDropdown(false)} />
                <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-[#F3E9E2] z-[101] py-2 animate-wedding-slide-down">
                  <div className="px-4 py-3 border-b border-[#F3E9E2] mb-1">
                    <p className="text-[10px] font-black text-[#B06A6C] uppercase tracking-[0.2em] mb-1">Logged in as</p>
                    <p className="text-[13px] font-black text-[#4A3730] truncate">{vendorName}</p>
                  </div>
                  
                  <Link
                    to="/wedding/vendor/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[13px] font-black text-[#7B6A62] hover:bg-[#F3E9E2]/30 hover:text-[#B06A6C] transition-all"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  
                  <Link
                    to="/wedding/vendor/settings"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-3 text-[13px] font-black text-[#7B6A62] hover:bg-[#F3E9E2]/30 hover:text-[#B06A6C] transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  
                  <div className="h-[1px] bg-[#F3E9E2] my-1 mx-2" />
                  
                  <button
                    onClick={() => { setShowDropdown(false); setShowLogoutModal(true); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-black text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(30,15,10,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-[2rem] border border-[#DED0C5] shadow-2xl overflow-hidden bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-[#B06A6C] to-[#C17A7C]" />
            <div className="p-8 flex flex-col items-center gap-5 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#B06A6C]/10 flex items-center justify-center">
                <LogOut className="w-7 h-7 text-[#B06A6C]" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#4A3730]">Sign Out?</h3>
                <p className="text-sm text-[#7B6A62] font-semibold mt-1">Are you sure you want to sign out?</p>
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 py-3.5 rounded-2xl font-black text-[13px] text-[#7B6A62] bg-[#F3E9E2]/30 border border-[#F3E9E2] hover:bg-[#F3E9E2]/50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-3.5 rounded-2xl font-black text-[13px] text-white bg-[#B06A6C] hover:bg-[#9d313d] transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default VendorNavbar;

