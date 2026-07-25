import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Search,
  User,
  Calendar,
  Settings,
  Mail,
  LogOut,
  Edit3,
  ChevronDown
} from 'lucide-react';
import { adminStyles } from '../theme/themeConfig';
import toast from 'react-hot-toast';
import { clearAllAuth } from '@/shared/auth/clearAllAuth';

const AdminHeader = ({ title = "Dashboard" }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAllAuth();
    toast.success("Successfully logged out");
    navigate("/wedding/admin/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className={`h-20 w-[calc(100%-18rem)] fixed right-0 top-0 bg-[#F8E2E5] border-b border-[hsl(353,45%,35%)]/20 z-40 px-8 flex items-center justify-between shadow-sm`}>
      <div className="flex items-center gap-4">
        <h2 className={`${adminStyles.heading} text-2xl font-semibold`}>
          {title}
        </h2>
        <div className="ml-8 relative">
          <input
            type="text"
            placeholder="Search everything..."
            className="w-80 h-10 pl-10 pr-4 rounded-xl border border-white/40 bg-white/50 focus:outline-none focus:ring-2 focus:ring-[hsl(353,45%,35%)] transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 border border-white/60 shadow-sm text-sm font-medium text-[hsl(353,45%,35%)]">
          <Calendar size={16} />
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>

        <button className="relative p-2 rounded-full hover:bg-white/60 transition-all text-[hsl(353,45%,35%)]">
          <Bell size={22} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-10 w-[1px] bg-white/50"></div>

        {/* Profile Section with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-2xl transition-all hover:bg-white/40 ${isProfileOpen ? 'bg-white/60 shadow-sm' : ''}`}
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[hsl(353,20%,15%)] leading-tight">Admin User</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Super Admin</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(353,45%,35%)] to-[hsl(353,45%,45%)] flex items-center justify-center text-white shadow-md shadow-[hsl(353,45%,35%)]/20">
              <User size={20} />
            </div>
            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Card - Increased opacity for better readability */}
          {isProfileOpen && (
            <div className={`absolute right-0 mt-3 w-72 bg-white/95 backdrop-blur-xl border border-white/50 rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top-right z-50`}>
              <div className="flex flex-col items-center mb-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[hsl(353,45%,35%)] to-[hsl(353,45%,45%)] flex items-center justify-center text-white text-3xl font-serif mb-3 shadow-xl">
                  A
                </div>
                <h4 className="text-lg font-bold text-[hsl(353,20%,15%)] leading-none">Admin User</h4>
                <div className="flex items-center gap-1.5 mt-2 text-gray-500">
                  <Mail size={12} />
                  <span className="text-xs">admin@mydestination.com</span>
                </div>
              </div>

              <div className="space-y-1">
                <Link
                  to="/wedding/admin/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-[hsl(353,20%,15%)] hover:bg-[hsl(353,45%,35%)]/10 hover:text-[hsl(353,45%,35%)] transition-all"
                >
                  <Edit3 size={18} />
                  Edit Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
                >
                  <LogOut size={18} />
                  Logout Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
