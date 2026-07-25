import React from 'react';
import { Outlet, Link, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Settings, Image, Globe, Edit3, Type, Users, AlignJustify, Briefcase, Info } from 'lucide-react';
import logo from '../../../assets/rokologin-removebg-preview.png';
import { clearAllAuth } from '@/shared/auth/clearAllAuth';

const CMSLayout = () => {
  const navigate = useNavigate();

  // Guard: /cms-admin and every child route had no auth check at all.
  if (!localStorage.getItem('cmsToken')) {
    return <Navigate to="/cms-admin/login" replace />;
  }

  const handleLogout = () => {
    clearAllAuth();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-emerald-950 text-white flex flex-col">
        <div className="p-4 border-b border-emerald-900/50 flex items-center gap-3">
          <div className="h-8 w-8 overflow-hidden flex-shrink-0 bg-white rounded-full p-1">
            <img src={logo} alt="Logo" className="h-full w-auto max-w-none object-left object-cover" />
          </div>
          <span className="font-bold text-lg tracking-wide">CMS Admin</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li>
              <Link to="/cms-admin" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <LayoutDashboard size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
            </li>
            <div className="pt-4 pb-2 px-3">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Website Pages</span>
            </div>
            <li>
              <Link to="/cms-admin/hero" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Image size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Hero Section</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/destinations" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Globe size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Destinations</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/promo" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Edit3 size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Promo Banner</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/intro-video" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Globe size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Intro Video & Features</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/services" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Type size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Services & Text</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/travel-tips" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Globe size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Premium Travel & Tours</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/categories" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Settings size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Categories</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/essential-accessories" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Briefcase size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Essential Accessories</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/about-us" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Info size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">About Us</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/staff" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Users size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Staff & About</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/footer" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <AlignJustify size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Footer Settings</span>
              </Link>
            </li>
            <div className="pt-4 pb-2 px-3">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Content Management</span>
            </div>
            <li>
              <Link to="/cms-admin/blogs" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Edit3 size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Manage Blogs</span>
              </Link>
            </li>
            <li>
              <Link to="/cms-admin/articles" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Edit3 size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Manage Articles</span>
              </Link>
            </li>
            <div className="pt-4 pb-2 px-3">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Forms & Submissions</span>
            </div>
            <li>
              <Link to="/cms-admin/applications" className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-emerald-900/50 transition">
                <Users size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">Job Applications</span>
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-emerald-900/50">
          <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-sm hover:bg-red-900/50 text-red-400 transition w-full text-left">
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6">
          <h1 className="text-lg font-bold text-gray-800">Website Management</h1>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CMSLayout;
