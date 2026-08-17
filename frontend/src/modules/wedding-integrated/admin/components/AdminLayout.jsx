import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { ADMIN_THEME } from '../theme/themeConfig';

const AdminLayout = () => {
  const location = useLocation();
  const token = localStorage.getItem("admin_token");

  // Check role-based admin access
  if (!token) {
    return <Navigate to="/wedding/admin/login" replace />;
  }

  // Get the title from current path for the header
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return "Admin Dashboard";
    if (path.includes('vendors')) return "Vendor Management";
    if (path.includes('enquiries')) return "Wedding Enquiries";
    if (path.includes('destinations')) return "Manage Destinations";
    if (path.includes('categories')) return "Manage Categories";
    if (path.includes('testimonials')) return "Manage Testimonials";
    if (path.includes('gallery')) return "Real Weddings Gallery";
    if (path.includes('profile')) return "Edit Profile";
    if (path.includes('settings')) return "Admin Settings";
    return "Admin Panel";
  };

  return (
    <div className="min-h-screen font-sans wedding-module" style={{ background: ADMIN_THEME.colors.background }}>
      <AdminSidebar />

      <main className="ml-72 transition-all relative z-[100]">
        <AdminHeader title={getPageTitle()} />

        {/* Page Content */}
        <div className="pt-24 p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
