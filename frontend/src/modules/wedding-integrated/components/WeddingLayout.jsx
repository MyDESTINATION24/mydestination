import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Home, MapPin, Users, MessageSquare, Menu, X, User, Bell, HelpCircle, Calendar, Settings, LogOut, ChevronRight, LogIn, Clock, LayoutGrid } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import logoImg from "../assets/logo.png";
import { weddingService } from "../../../services/weddingService";
import { weddingEnquiryService } from "../../../services/apiService";
import { installWeddingFcmRegistration, onWeddingMessage, registerWeddingFcmToken } from "../services/weddingFcmService";


const navLinks = [
  { to: "/home", label: "Services", icon: LayoutGrid },
  { to: "/wedding", label: "Home", icon: Home },
  { to: "/wedding/destinations", label: "Destinations", icon: MapPin },
  { to: "/wedding/vendors", label: "Vendors", icon: Users },
  { to: "/wedding/enquiry", label: "Enquiry", icon: MessageSquare },
];

// Removed hardcoded megaMenuData to ensure only real dynamic categories are shown

const WeddingLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifs(true);
      const data = await weddingEnquiryService.getMyEnquiries();
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifs", error);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (storedUser && token) {
      try { setUser(JSON.parse(storedUser)); } 
      catch (e) { setUser(null); }
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  // ── Wedding FCM Setup ────────────────────────────────────────────────────────
  useEffect(() => {
    // Install auto-registration (retries on focus/pageshow)
    installWeddingFcmRegistration();

    // Listen for foreground (in-app) push notifications
    onWeddingMessage((payload) => {
      const title = payload.notification?.title || 'My Destination';
      const body  = payload.notification?.body  || '';
      const url   = payload.data?.url;

      // Show a nice toast notification for foreground messages
      toast(
        (t) => (
          <div
            onClick={() => {
              if (url) window.location.href = url.startsWith('http') ? url : url;
              toast.dismiss(t.id);
            }}
            style={{ cursor: url ? 'pointer' : 'default' }}
          >
            <strong style={{ display: 'block', marginBottom: 4 }}>{title}</strong>
            <span style={{ fontSize: 13, color: '#555' }}>{body}</span>
          </div>
        ),
        {
          duration: 6000,
          icon: '💍',
          style: {
            borderLeft: '4px solid #81313A',
            background: '#fff',
            color: '#333',
            maxWidth: 360
          }
        }
      );
    });
  }, []); // Run once on mount

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    toast.success("Logged out successfully");
    setMobileSidebarOpen(false);
    navigate("/");
  };

  const isGallery = location.pathname.includes('/real-weddings/gallery');
  const isBookingDetail = location.pathname.match(/\/wedding\/bookings\/bk-\d+/);
  const hideNav = isGallery || isBookingDetail;

  const [footerDestinations, setFooterDestinations] = useState([]);
  const [footerCategories, setFooterCategories] = useState([]);
  const [dynamicMegaMenu, setDynamicMegaMenu] = useState([[], [], [], []]);

  // Handle touch interactions for mobile sidebar if needed
  useEffect(() => {
    const handleTouchMove = (e) => {
      if (!mobileSidebarOpen) return;
      const sidebar = document.getElementById('mobile-sidebar-container');
      if (sidebar && sidebar.contains(e.target)) {
        return;
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    if (mobileSidebarOpen) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [mobileSidebarOpen]);

  // Listen for custom event from TopNavbar to open sidebar on desktop
  useEffect(() => {
    const handleOpenSidebar = () => setMobileSidebarOpen(true);
    window.addEventListener('openWeddingSidebar', handleOpenSidebar);
    return () => window.removeEventListener('openWeddingSidebar', handleOpenSidebar);
  }, []);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const [destData, catData] = await Promise.all([
          weddingService.getDestinations(),
          weddingService.getCategories()
        ]);

        if (Array.isArray(destData)) {
          setFooterDestinations(destData.slice(0, 6));
        }
        const actualCatData = Array.isArray(catData) ? catData : (catData?.categories || []);

        if (actualCatData) {
          setFooterCategories(actualCatData.slice(0, 5));
          
          if (actualCatData.length > 0) {
            // Generate Dynamic Mega Menu
            const grouped = actualCatData.reduce((acc, cat) => {
              const parent = cat.parentCategory || cat.name;
              if (!acc[parent]) acc[parent] = [];
              acc[parent].push(cat);
              return acc;
            }, {});

            const sections = Object.entries(grouped).map(([parent, cats]) => ({
              title: parent,
              links: cats.map(c => ({
                label: c.name,
                to: `/wedding/vendors?category=${encodeURIComponent(c.name)}`,
                tag: c.type === 'primary' ? 'PREMIUM' : undefined
              }))
            }));

            const columns = [[], [], [], []];
            sections.forEach((section, index) => {
              columns[index % 4].push(section);
            });
            
            setDynamicMegaMenu(columns);
          } else {
            setDynamicMegaMenu([[], [], [], []]);
          }
        }
      } catch (error) {
        console.error("Footer fetch error", error);
      }
    };
    fetchFooterData();
  }, []);

  // Hide the main app's navbars when wedding module is active
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('mydestination:slider', { detail: true }));
    return () => {
      window.dispatchEvent(new CustomEvent('mydestination:slider', { detail: false }));
    };
  }, []);

  return (
    <div className="wedding-module min-h-screen" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF0F3 100%)', backgroundAttachment: 'fixed' }}>
      {/* Navbar */}
      {!hideNav && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 md:gap-4">
                <button 
                  onClick={() => setMobileSidebarOpen(true)}
                  className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <Link to="/wedding" className="flex items-center gap-2">
                  <img src={logoImg} alt="Weddings Logo" className="h-8 md:h-11 w-auto object-contain transition-transform duration-300" />
                </Link>
                <div className="hidden md:block">
                  <Link to="/home" className="text-gray-600 font-bold text-sm hover:text-[#81313A] transition">
                    Services
                  </Link>
                </div>
              </div>

              {/* Brand Text (Watermark Style) */}
              <div className="flex items-center opacity-30 hover:opacity-50 transition-opacity duration-500 cursor-default grayscale mix-blend-multiply">
                <div className="flex flex-col items-center select-none">
                  <span style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "#81313A",
                    fontSize: "15px",
                    fontWeight: "900",
                    letterSpacing: "0.18em",
                    lineHeight: "1.15",
                    textTransform: "uppercase",
                  }}>
                    My Destination
                  </span>
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    color: "#81313A",
                    fontSize: "10px",
                    fontFamily: "'Noto Serif Devanagari', 'Devanagari', serif",
                    fontWeight: "500",
                    letterSpacing: "0.04em",
                    opacity: "0.78",
                    lineHeight: "1.4",
                    marginTop: "1px",
                  }}>
                    <span style={{ fontSize: "8px", opacity: 0.6 }}>—</span>
                    अतिथि देवो भवः
                    <span style={{ fontSize: "8px", opacity: 0.6 }}>—</span>
                  </span>
                </div>
              </div>

              {/* Desktop nav */}
              <div className="hidden md:flex items-center gap-8 h-full">
                {navLinks.filter(link => link.label !== "Enquiry").map((link) => {
                  if (link.label === "Vendors") {
                    return (
                      <div
                        key={link.to}
                        className="h-full flex items-center relative"
                        onMouseEnter={() => setMegaMenuOpen(true)}
                        onMouseLeave={() => setMegaMenuOpen(false)}
                      >
                        <Link
                          to={link.to}
                          className={`text-sm font-medium transition-colors duration-200 hover:text-[#81313A] py-5 ${location.pathname === link.to ? "text-[#81313A]" : "text-slate-500"
                            }`}
                        >
                          {link.label}
                        </Link>

                        {/* Mega Menu Dropdown */}
                        <div className={`fixed top-[64px] left-1/2 -translate-x-1/2 w-[90vw] max-w-[1100px] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] rounded-2xl p-8 transition-all duration-300 transform cursor-default border border-slate-100 hidden md:flex gap-8 justify-between z-[60] ${megaMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                          }`}>
                          {dynamicMegaMenu.map((column, colIdx) => (
                            <div key={colIdx} className="flex-1 flex flex-col gap-6">
                              {column.map((category) => (
                                <div key={category.title}>
                                  <h4 className="text-[14px] font-bold text-[#81313A] mb-3">{category.title}</h4>
                                  <ul className="flex flex-col gap-2.5">
                                    {category.links.map((subLink) => (
                                      <li key={subLink.label}>
                                        <Link
                                          to={subLink.to}
                                          onClick={() => setMegaMenuOpen(false)}
                                          className={`text-[13px] whitespace-nowrap text-slate-500 hover:text-[#81313A] transition-colors flex items-center gap-2 ${subLink.isViewAll ? 'font-bold mt-1 text-slate-800' : ''}`}
                                        >
                                          {subLink.label}
                                          {subLink.tag && (
                                            <span className="text-[9px] uppercase tracking-wider text-green-700 font-bold border border-green-200 px-1.5 py-0.5 rounded leading-none bg-green-50 shadow-sm">
                                              {subLink.tag}
                                            </span>
                                          )}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      className={`text-sm font-medium transition-colors duration-200 hover:text-[#81313A] py-5 ${location.pathname === link.to ? "text-[#81313A]" : "text-slate-500"
                        }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <Link
                  to="/wedding/enquiry"
                  className="px-5 py-2 rounded-full text-sm font-medium wedding-gradient text-white transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  Plan Your Wedding
                </Link>
              </div>

              {/* Action Icons */}
              <div className="flex items-center gap-2 md:gap-4 relative">
                <button
                  onClick={() => {
                    setNotifOpen(!notifOpen);
                    if (!notifOpen) fetchNotifications();
                  }}
                  className="relative p-2 rounded-full bg-[#81313A]/5 text-[#81313A] hover:bg-[#81313A]/10 transition-colors"
                  title="Notifications & Bookings"
                >
                  <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                  {/* Indicator Dot */}
                  <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                </button>

                {/* Notifications Dropdown */}
                {notifOpen && (
                  <div className="absolute top-full right-10 md:right-12 mt-3 w-80 bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100 rounded-2xl overflow-hidden z-[100] flex flex-col max-h-[400px]">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                      <h4 className="font-bold text-slate-800">Your Notifications</h4>
                      <Link to="/wedding/my-enquiries" onClick={() => setNotifOpen(false)} className="text-[10px] uppercase font-bold text-[#81313A] hover:underline">View All</Link>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto no-scrollbar p-2">
                      {loadingNotifs ? (
                        <div className="py-10 flex justify-center"><div className="w-6 h-6 border-2 border-[#81313A] border-t-transparent rounded-full animate-spin"></div></div>
                      ) : notifications.length > 0 ? (
                        <div className="space-y-1">
                          {notifications.slice(0, 5).map((notif, i) => (
                            <Link 
                              key={notif._id || i}
                              to="/wedding/my-enquiries"
                              onClick={() => setNotifOpen(false)}
                              className="block p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                            >
                              <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 mt-2 rounded-full shrink-0 ${notif.status === 'Booked' ? 'bg-purple-500' : notif.status === 'Contacted' ? 'bg-emerald-500' : notif.status === 'Lost' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                                <div>
                                  <p className="text-xs font-semibold text-slate-800 line-clamp-1">Enquiry for {notif.weddingDate || 'TBD'}</p>
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    Status updated to <span className="font-bold text-slate-700">{notif.status || 'New'}</span>
                                  </p>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                          <p className="text-xs text-slate-500">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => setMobileSidebarOpen(true)}
                  className="hidden md:block p-2 rounded-full bg-[#81313A]/5 text-[#81313A] hover:bg-[#81313A]/10 transition-colors"
                  title="Menu"
                >
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Sidebar (Desktop & Mobile) */}
      {createPortal(
        <div className={`fixed inset-0 z-[10000] ${mobileSidebarOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${mobileSidebarOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setMobileSidebarOpen(false)}
          style={{ touchAction: 'none' }}
        />
        {/* Sidebar */}
        <div id="mobile-sidebar-container" className={`absolute top-0 left-0 h-[100dvh] w-[280px] sm:w-[320px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out overscroll-contain ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-5 pt-8 border-b border-slate-100 flex items-start justify-between shrink-0">
            <div className="flex flex-col gap-3">
              {user ? (
                <>
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm flex items-center justify-center bg-slate-50">
                    {user.profileImage || user.avatar ? (
                      <img src={user.profileImage || user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-[#81313A]" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800" style={{ fontFamily: "'Playfair Display', serif" }}>{user.name}</h2>
                  </div>
                </>
              ) : (
                <img src={logoImg} alt="Logo" className="h-8 object-contain" />
              )}
            </div>
            <button onClick={() => setMobileSidebarOpen(false)} className="p-2 text-slate-400 bg-slate-50 rounded-full hover:text-[#81313A] hover:bg-[#81313A]/10">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto py-4 px-4 space-y-2 wedding-sidebar-scrollbar overscroll-contain" style={{ WebkitOverflowScrolling: "touch" }}>
            {navLinks.map(link => (
              <div key={link.to}>
                <Link 
                  to={link.to} 
                  onClick={() => {
                    if (link.label !== "Vendors") setMobileSidebarOpen(false);
                  }}
                  className="flex items-center gap-3 py-2 text-slate-700 font-bold text-[15px]"
                >
                  <div className="w-8 h-8 rounded-full bg-[#81313A]/10 flex items-center justify-center text-[#81313A]">
                    <link.icon className="w-4 h-4" />
                  </div>
                  {link.label}
                </Link>
                {/* Dynamic Vendor Categories */}
                {link.label === "Vendors" && dynamicMegaMenu && (
                  <div className="pl-4 pt-3 pb-2 space-y-5 border-l-2 border-slate-100 ml-4 mt-2">
                    {dynamicMegaMenu.flat().map((category, idx) => {
                      if (!category || !category.title) return null;
                      return (
                        <div key={idx}>
                          <h4 className="text-[11px] font-black text-[#81313A] mb-3 uppercase tracking-[0.1em]">{category.title}</h4>
                          <ul className="flex flex-col gap-3">
                            {category.links.map(sub => (
                              <li key={sub.label}>
                                <Link 
                                  to={sub.to}
                                  onClick={() => setMobileSidebarOpen(false)}
                                  className="text-[13px] font-medium text-slate-500 hover:text-[#81313A] flex items-center gap-2"
                                >
                                  {sub.label}
                                  {sub.tag && (
                                    <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 border border-emerald-200 rounded shadow-sm font-bold tracking-wider">
                                      {sub.tag}
                                    </span>
                                  )}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            
            
            {/* Divider */}
            <div className="my-4 border-t border-slate-100"></div>
            
            {/* Profile Items */}
            {[
              { icon: Calendar, label: "My Bookings", to: "/wedding/bookings" },
              { icon: Heart, label: "Saved Destinations", to: "/wedding/saved" },
              { icon: Users, label: "Wedding Planner", to: "/wedding/planners" },
              { icon: MessageSquare, label: "My Enquiries", to: "/wedding/my-enquiries" },
              { icon: Clock, label: "My Support Tickets", to: "/wedding/support#my-tickets" },
              { icon: Settings, label: "Account Settings", to: "/wedding/settings" },
            ].map((item, i) => (
              <Link
                key={i}
                to={user ? item.to : "/wedding/login"}
                onClick={() => setMobileSidebarOpen(false)}
                className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#81313A]/5 transition-all group"
              >
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-[#81313A]/10 group-hover:text-[#81313A] transition-all">
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="flex-1 text-[13px] font-bold text-slate-600 group-hover:text-[#81313A] transition-colors">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
          {!user && (
            <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0">
              <Link 
                to="/wedding/login"
                onClick={() => setMobileSidebarOpen(false)}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-2xl text-white bg-[#81313A] hover:bg-[#81313A]/90 transition-all font-bold shadow-md"
              >
                <div className="p-2 rounded-xl bg-white/10 text-white">
                  <LogIn className="w-4 h-4" />
                </div>
                <span className="text-sm">Log In / Sign Up</span>
              </Link>
            </div>
          )}
          {user && (
            <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-3 p-3 rounded-2xl text-slate-600 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all font-bold shadow-sm group"
              >
                <div className="p-2 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm">Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>, document.body)}



      {/* Content */}
      <main className={`${!hideNav ? 'pt-16' : ''} ${location.pathname !== "/wedding" && location.pathname !== "/wedding/" && !hideNav ? "pb-24 md:pb-16" : ""}`}>
        <Outlet />
      </main>

      {/* Bottom Navbar for Mobile */}
      {!hideNav && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] pb-safe">
          <div className="flex items-center justify-around py-2.5 px-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to || (link.to !== '/wedding' && location.pathname.startsWith(link.to));

              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex flex-col items-center gap-1 min-w-[70px] transition-all duration-300 ${isActive ? "scale-105" : "hover:scale-105"
                    }`}
                >
                  <div className={`w-12 h-11 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 ${isActive
                      ? "bg-[#81313A]/10 text-[#81313A]"
                      : "text-slate-400"
                    }`}>
                    <Icon className={`w-5.5 h-5.5 ${isActive ? "stroke-[2.5px]" : "stroke-[1.8px]"}`} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.12em] ${isActive ? "text-[#81313A]" : "text-slate-400"
                    }`}>
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      {(location.pathname === "/wedding" || location.pathname === "/wedding/") && (
        <footer className="hidden md:block bg-[hsl(353,20%,15%)] text-white pt-6 pb-28 md:pt-10 md:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-y-6 md:gap-8">
              <div>
                <p className="text-xs opacity-70 mt-2">
                  Creating unforgettable destination wedding experiences across
                  India's most beautiful locations.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider">My DESTINATIONS</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs opacity-70">
                  {(footerDestinations.length > 0 ? footerDestinations : [{ name: "Goa" }, { name: "Jaipur" }, { name: "Udaipur" }, { name: "Kerala" }, { name: "Rishikesh" }]).map((d) => (
                    <Link key={d._id || d.name} to={`/wedding/destinations/${d._id || d.name.toLowerCase()}`} className="block hover:opacity-100 transition-opacity">
                      {d.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider">Services</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs opacity-70">
                  {(footerCategories.length > 0 ? footerCategories : [{ name: "Full Planning" }, { name: "Decor & Design" }, { name: "Photography" }, { name: "Catering" }, { name: "Entertainment" }]).map((s) => (
                    <Link 
                      key={s._id || s.name} 
                      to={`/wedding/vendors?category=${encodeURIComponent(s.name)}`}
                      className="block hover:opacity-100 transition-opacity"
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 text-xs uppercase tracking-wider">Get in Touch</h4>
                <p className="text-xs opacity-70 mb-2">hello@weddings.example.com</p>
                <p className="text-xs opacity-70">+91 98765 43210</p>
              </div>
            </div>
            <div className="border-t border-white/20 mt-8 pt-6 text-center text-[11px] opacity-50">
              © 2026 My DESTINATION™. All rights reserved.
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default WeddingLayout;
