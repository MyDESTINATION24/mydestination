import React, { useEffect, useState } from 'react';


const CMSDashboard = () => {
  const [stats, setStats] = useState({ loaded: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Overview</h2>
        <p className="text-sm text-gray-500">Welcome to your Website Management Panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">🖼️</span>
          </div>
          <h3 className="font-bold text-gray-800">Landing Page</h3>
          <p className="text-xs text-gray-500 mt-2">Manage your hero banners, destinations, and main categories.</p>
        </div>
        <div className="bg-white p-6 border border-gray-100 rounded-sm shadow-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📝</span>
          </div>
          <h3 className="font-bold text-gray-800">Blogs & Articles</h3>
          <p className="text-xs text-gray-500 mt-2 mb-4">Manage dynamic blog posts and articles for your website.</p>
          <div className="flex gap-2">
            <a href="/cms-admin/blogs" className="text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded-md px-3 py-1.5 hover:bg-emerald-900/30 transition">Blogs</a>
            <a href="/cms-admin/articles" className="text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded-md px-3 py-1.5 hover:bg-emerald-900/30 transition">Articles</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CMSDashboard;
