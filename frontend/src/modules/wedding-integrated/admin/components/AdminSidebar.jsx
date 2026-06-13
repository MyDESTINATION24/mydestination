import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  MapPin,
  Image,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  UserCheck,
  UserPlus,
  CreditCard,
  BarChart,
  LifeBuoy,
  Megaphone,
  Briefcase,
  Building2,
  Palette,
  FolderPlus,
  Layers,
  Wallet
} from 'lucide-react';
import { adminStyles } from '../theme/themeConfig';
import toast from 'react-hot-toast';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/wedding/admin/dashboard' },
  {
    icon: Users,
    label: 'Manage Vendors',
    path: '/wedding/admin/vendors',
    subItems: [
      { label: 'All Vendors', path: '/wedding/admin/vendors/all', icon: UserCheck },
      { label: 'Pending Approvals', path: '/wedding/admin/vendors/pending', icon: UserPlus },
    ]
  },
  { icon: FolderPlus, label: 'Add Category', path: '/wedding/admin/add-category' },
  { icon: Briefcase, label: 'Manage Customers', path: '/wedding/admin/customers' },
  { icon: Wallet, label: 'Wallet Recharges', path: '/wedding/admin/user-recharges' },
  { icon: MessageSquare, label: 'Enquiries', path: '/wedding/admin/enquiries' },
  { icon: CreditCard, label: 'Financials', path: '/wedding/admin/financials' },
  { icon: Layers, label: 'Subscriptions', path: '/wedding/admin/subscriptions' },
  { icon: MapPin, label: 'Destinations', path: '/wedding/admin/destinations' },
  { icon: Building2, label: 'Venue Approval', path: '/wedding/admin/venues' },
  { icon: Palette, label: 'Categories', path: '/wedding/admin/categories' },
  { icon: MessageSquare, label: 'Testimonials', path: '/wedding/admin/testimonials' },
  { icon: Image, label: 'Real Weddings', path: '/wedding/admin/gallery' },
  { icon: LifeBuoy, label: 'Support', path: '/wedding/admin/support' },
  {
    icon: Settings,
    label: 'Settings',
    path: '/wedding/admin/settings',
    subItems: [
      { label: 'Appearance', path: '/wedding/admin/settings/appearance', icon: Palette },
      { label: 'Platform Fees', path: '/wedding/admin/settings/financial', icon: CreditCard },
    ]
  },
];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true); // Keep vendors expanded by default if active

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    toast.success("Successfully logged out");
    navigate("/admin/login");
  };

  return (
    <aside className={`w-72 h-screen fixed left-0 top-0 bg-[#F8E2E5] border-r border-[hsl(353,45%,35%)]/20 z-50 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.05)]`}>
      <div className="h-20 px-8 border-b border-[hsl(353,45%,35%)]/20 mb-4 flex items-center shrink-0">
        <h1 className={`${adminStyles.heading} text-xl font-bold tracking-tight`}>
          MY DESTINATION
          <span className="block text-[10px] mt-1 uppercase tracking-[0.2em] font-sans opacity-70">Admin Panel</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto wedding-sidebar-scrollbar min-h-0">
        {menuItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const hasSubItems = item.subItems && item.subItems.length > 0;

          return (
            <div key={item.path} className="flex flex-col">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm text-[hsl(353,20%,15%)] ${isActive
                    ? 'bg-[hsl(353,45%,35%)] text-white shadow-md active-sidebar-item'
                    : 'hover:bg-[hsl(353,45%,35%)]/10'
                  } ${hasSubItems ? 'justify-between' : ''}`
                }
                onClick={(e) => {
                  if (hasSubItems) {
                    setExpanded(!expanded);
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {hasSubItems ? (
                  expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                ) : (
                  <div className="ml-auto opacity-0 transition-opacity active:opacity-100">
                    <ChevronRight size={16} />
                  </div>
                )}
              </NavLink>

              {/* Sub Items */}
              {hasSubItems && expanded && (
                <div className="mt-1 ml-4 pl-4 border-l-2 border-[hsl(353,45%,35%)]/20 flex flex-col gap-1 animate-in slide-in-from-top-2 duration-300">
                  {item.subItems.map((sub) => (
                    <NavLink
                      key={sub.path}
                      to={sub.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-medium transition-all ${isActive
                          ? 'text-[hsl(353,45%,35%)] bg-[hsl(353,45%,35%)]/10 font-bold'
                          : 'text-gray-500 hover:text-[hsl(353,45%,35%)] hover:bg-[hsl(353,45%,35%)]/5'
                        }`
                      }
                    >
                      <sub.icon size={16} />
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="p-2 mt-auto border-t border-[hsl(353,45%,35%)]/20 pt-3">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-all font-medium"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
