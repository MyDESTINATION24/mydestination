import React, { Suspense } from 'react';
import { Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Clock, Loader2 } from 'lucide-react';

// Eager Imports (Critical UI)
import BottomNavbar from './components/ui/BottomNavbar';
import TopNavbar from './components/ui/TopNavbar';
import Footer from './components/ui/Footer';
import PartnerBottomNavbar from './app/partner/components/PartnerBottomNavbar';

import ScrollToTop from './components/ui/ScrollToTop';

// Hooks & Services
import { useLenis } from './app/shared/hooks/useLenis';
import { legalService, userService, hotelService } from './services/apiService';
import adminService from './services/adminService';
import { requestNotificationPermission, onMessageListener } from './utils/firebase';
import logo from './assets/rokologin-removebg-preview.png';
import { AuthProvider as WeddingVendorAuthProvider } from "./modules/wedding-integrated/vendor/context/AuthContext";
import { VendorProvider as WeddingVendorProvider } from "./modules/wedding-integrated/vendor/context/VendorContext";
import { initAppMode, isWebView } from './utils/deviceDetect';

// Init app mode from URL params on very first load
initAppMode();

// Lazy Imports - User Pages
const Home = React.lazy(() => import('./pages/user/Home'));
const UserPropertyDetailsPage = React.lazy(() => import('./pages/user/PropertyDetailsPage'));
const UserLogin = React.lazy(() => import('./pages/auth/UserLogin'));
const UserSignup = React.lazy(() => import('./pages/auth/UserSignup'));
const SearchPage = React.lazy(() => import('./pages/user/SearchPage'));
const BookingsPage = React.lazy(() => import('./pages/user/BookingsPage'));
const ListingPage = React.lazy(() => import('./pages/user/ListingPage'));
const BookingConfirmationPage = React.lazy(() => import('./pages/user/BookingConfirmationPage'));
const WalletPage = React.lazy(() => import('./pages/user/WalletPage'));
const PaymentPage = React.lazy(() => import('./pages/user/PaymentPage'));
const SupportPage = React.lazy(() => import('./pages/user/SupportPage'));
const ReferAndEarnPage = React.lazy(() => import('./pages/user/ReferAndEarnPage'));
const SavedPlacesPage = React.lazy(() => import('./pages/user/SavedPlacesPage'));
const NotificationsPage = React.lazy(() => import('./pages/user/NotificationsPage'));
const SettingsPage = React.lazy(() => import('./pages/user/SettingsPage'));
const PartnerLandingPage = React.lazy(() => import('./pages/user/PartnerLandingPage'));
const LegalPage = React.lazy(() => import('./pages/user/LegalPage'));
const TermsPage = React.lazy(() => import('./pages/user/TermsPage'));
const PrivacyPage = React.lazy(() => import('./pages/user/PrivacyPage'));
const AboutPage = React.lazy(() => import('./pages/user/AboutPage'));
const ContactPage = React.lazy(() => import('./pages/user/ContactPage'));
const BlogsPage = React.lazy(() => import('./pages/user/BlogsPage'));
const AmenitiesPage = React.lazy(() => import('./pages/user/AmenitiesPage'));
const ReviewsPage = React.lazy(() => import('./pages/user/ReviewsPage'));
const OffersPage = React.lazy(() => import('./pages/user/OffersPage'));
const ProfileEdit = React.lazy(() => import('./pages/user/ProfileEdit'));
const BookingCheckoutPage = React.lazy(() => import('./pages/user/BookingCheckoutPage'));
const CareersPage = React.lazy(() => import('./pages/user/CareersPage'));
const CancellationPage = React.lazy(() => import('./pages/user/CancellationPage'));
const ReferralHandler = React.lazy(() => import('./pages/auth/ReferralHandler'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));

// Lazy Imports - CMS Admin Pages
const CMSLogin = React.lazy(() => import('./app/cms-admin/pages/CMSLogin'));
const CMSLayout = React.lazy(() => import('./app/cms-admin/layouts/CMSLayout'));
const CMSDashboard = React.lazy(() => import('./app/cms-admin/pages/CMSDashboard'));
const CMSHeroConfig = React.lazy(() => import('./app/cms-admin/pages/CMSHeroConfig'));
const CMSDestinations = React.lazy(() => import('./app/cms-admin/pages/CMSDestinations'));
const CMSPromoBanner = React.lazy(() => import('./app/cms-admin/pages/CMSPromoBanner'));
const CMSServices = React.lazy(() => import('./app/cms-admin/pages/CMSServices'));
const CMSStaff = React.lazy(() => import('./app/cms-admin/pages/CMSStaff'));
const CMSFooter = React.lazy(() => import('./app/cms-admin/pages/CMSFooter'));

// Lazy Imports - Admin Pages
const AdminLogin = React.lazy(() => import('./modules/admin/pages/auth/AdminLogin'));
const AdminSignup = React.lazy(() => import('./app/admin/pages/AdminSignup'));
const AdminDashboard = React.lazy(() => import('./app/admin/pages/AdminDashboard'));
const AdminHotelDetail = React.lazy(() => import('./app/admin/pages/AdminHotelDetail'));
const AdminUsers = React.lazy(() => import('./app/admin/pages/AdminUsers'));
const AdminUserDetail = React.lazy(() => import('./app/admin/pages/AdminUserDetail'));
const AdminBookings = React.lazy(() => import('./app/admin/pages/AdminBookings'));
const AdminBookingDetail = React.lazy(() => import('./app/admin/pages/AdminBookingDetail'));
const AdminPartners = React.lazy(() => import('./app/admin/pages/AdminPartners'));
const AdminPartnerDetail = React.lazy(() => import('./app/admin/pages/AdminPartnerDetail'));
const AdminReviews = React.lazy(() => import('./app/admin/pages/AdminReviews'));
const AdminFinance = React.lazy(() => import('./pages/admin/FinanceAndPayoutsPage'));
const AdminSettings = React.lazy(() => import('./app/admin/pages/AdminSettings'));
const AdminOffers = React.lazy(() => import('./app/admin/pages/AdminOffers'));
const AdminProtectedRoute = React.lazy(() => import('./app/admin/AdminProtectedRoute'));
const AdminProperties = React.lazy(() => import('./app/admin/pages/AdminProperties'));
const AdminLegalPages = React.lazy(() => import('./app/admin/pages/AdminLegalPages'));
const AdminContactMessages = React.lazy(() => import('./app/admin/pages/AdminContactMessages'));
const AdminNotifications = React.lazy(() => import('./app/admin/pages/AdminNotifications'));
const AdminFaqs = React.lazy(() => import('./app/admin/pages/AdminFaqs'));

// Lazy Imports - Partner Pages
const HotelLogin = React.lazy(() => import('./pages/auth/HotelLoginPage'));
const HotelSignup = React.lazy(() => import('./pages/auth/HotelSignupPage'));
const PartnerHome = React.lazy(() => import('./app/partner/pages/PartnerHome'));
const AddVillaWizard = React.lazy(() => import('./app/partner/pages/AddVillaWizard'));
const AddHotelWizard = React.lazy(() => import('./app/partner/pages/AddHotelWizard'));
const AddHostelWizard = React.lazy(() => import('./app/partner/pages/AddHostelWizard'));
const AddPGWizard = React.lazy(() => import('./app/partner/pages/AddPGWizard'));
const AddResortWizard = React.lazy(() => import('./app/partner/pages/AddResortWizard'));
const AddHomestayWizard = React.lazy(() => import('./app/partner/pages/AddHomestayWizard'));
const PartnerDashboard = React.lazy(() => import('./app/partner/pages/PartnerDashboard'));
const PartnerBookings = React.lazy(() => import('./app/partner/pages/PartnerBookings'));
const PartnerWallet = React.lazy(() => import('./app/partner/pages/PartnerWallet'));
const PartnerReviews = React.lazy(() => import('./app/partner/pages/PartnerReviews'));
const PartnerPage = React.lazy(() => import('./app/partner/pages/PartnerPage'));
const PartnerJoinPropertyType = React.lazy(() => import('./app/partner/pages/PartnerJoinPropertyType'));
const PartnerProperties = React.lazy(() => import('./app/partner/pages/PartnerProperties'));
const PartnerPropertyDetails = React.lazy(() => import('./app/partner/pages/PartnerPropertyDetails'));
const PartnerBookingDetail = React.lazy(() => import('./app/partner/pages/PartnerBookingDetail'));

const PartnerInventory = React.lazy(() => import('./app/partner/pages/PartnerInventory'));
const PartnerInventoryProperties = React.lazy(() => import('./app/partner/pages/PartnerInventoryProperties'));
const PartnerNotifications = React.lazy(() => import('./app/partner/pages/PartnerNotificationsPage'));
const PartnerKYC = React.lazy(() => import('./app/partner/pages/PartnerKYC'));
const PartnerSupport = React.lazy(() => import('./app/partner/pages/PartnerSupport'));
const PartnerProfile = React.lazy(() => import('./app/partner/pages/PartnerProfile'));
const PartnerTransactions = React.lazy(() => import('./app/partner/pages/PartnerTransactions'));
const PartnerTerms = React.lazy(() => import('./app/partner/pages/PartnerTerms'));
const PartnerSettings = React.lazy(() => import('./app/partner/pages/PartnerSettings'));
const PartnerAbout = React.lazy(() => import('./app/partner/pages/PartnerAbout'));
const PartnerPrivacy = React.lazy(() => import('./app/partner/pages/PartnerPrivacy'));
const PartnerContact = React.lazy(() => import('./app/partner/pages/PartnerContact'));
const PartnerBankDetails = React.lazy(() => import('./app/partner/pages/PartnerBankDetails'));
const BlogManager = React.lazy(() => import('./pages/manager/BlogManager'));
const BlogDetail = React.lazy(() => import('./pages/user/BlogDetail'));

// Lazy Imports - Layouts
const HotelLayout = React.lazy(() => import('./layouts/HotelLayout'));
const AdminLayout = React.lazy(() => import('./app/admin/layouts/AdminLayout'));

// Lazy Imports - Welcome Page
const WelcomePage = React.lazy(() => import('./pages/WelcomePage'));

// Lazy Imports - Wedding Module (User Views)
const WeddingLayout = React.lazy(() => import('./modules/wedding-integrated/components/WeddingLayout'));
const WeddingHomePage = React.lazy(() => import('./modules/wedding-integrated/views/WeddingHomePage'));
const WeddingDestinationsPage = React.lazy(() => import('./modules/wedding-integrated/views/DestinationsPage'));
const WeddingDestinationDetailPage = React.lazy(() => import('./modules/wedding-integrated/views/DestinationDetailPage'));
const WeddingPlannersPage = React.lazy(() => import('./modules/wedding-integrated/views/PlannersPage'));
const WeddingPlannerDetailPage = React.lazy(() => import('./modules/wedding-integrated/views/PlannerDetailPage'));
const WeddingVendorListingPage = React.lazy(() => import('./modules/wedding-integrated/views/VendorListingPage'));
const WeddingVendorDetailPage = React.lazy(() => import('./modules/wedding-integrated/views/VendorDetailPage'));
const WeddingRealWeddingsByLocation = React.lazy(() => import('./modules/wedding-integrated/views/RealWeddingsByLocation'));
const WeddingRealWeddingGalleryPage = React.lazy(() => import('./modules/wedding-integrated/views/RealWeddingGalleryPage'));
const WeddingMyBookingsPage = React.lazy(() => import('./modules/wedding-integrated/views/MyBookingsPage'));
const WeddingBookingDetailPage = React.lazy(() => import('./modules/wedding-integrated/views/BookingDetailPage'));
const WeddingSavedDestinationsPage = React.lazy(() => import('./modules/wedding-integrated/views/SavedDestinationsPage'));
const WeddingMyEnquiriesPage = React.lazy(() => import('./modules/wedding-integrated/views/MyEnquiriesPage'));
const WeddingAccountSettingsPage = React.lazy(() => import('./modules/wedding-integrated/views/AccountSettingsPage'));
const WeddingEnquiryPage = React.lazy(() => import('./modules/wedding-integrated/views/WeddingEnquiryPage'));
const WeddingHelpSupportPage = React.lazy(() => import('./modules/wedding-integrated/views/HelpSupportPage'));
const WeddingMySupportTicketsPage = React.lazy(() => import('./modules/wedding-integrated/views/MySupportTicketsPage'));

// Lazy Imports - Wedding Admin Module
const WeddingAdminLayout = React.lazy(() => import('./modules/wedding-integrated/admin/components/AdminLayout'));
const WeddingAdminDashboard = React.lazy(() => import('./modules/wedding-integrated/admin/views/AdminDashboard'));
const WeddingAdminLogin = React.lazy(() => import('./modules/wedding-integrated/admin/views/AdminLogin'));
const WeddingManageVendors = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageVendors'));
const WeddingManageEnquiries = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageEnquiries'));
const WeddingAddCategory = React.lazy(() => import('./modules/wedding-integrated/admin/views/AddCategory'));
const WeddingManageCustomers = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageCustomers'));
const WeddingManageFinancials = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageFinancials'));
const WeddingManageDestinations = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageDestinations'));
const WeddingManageVenues = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageVenues'));
const WeddingManageRealWeddings = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageRealWeddings'));
const WeddingAdminProfile = React.lazy(() => import('./modules/wedding-integrated/admin/views/AdminProfile'));
const WeddingAdminSettings = React.lazy(() => import('./modules/wedding-integrated/admin/views/AdminSettings'));
const WeddingManageSupport = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageSupport'));
const WeddingManageCategories = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageCategories'));
const WeddingManageTestimonials = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageTestimonials'));
const WeddingManageSubscriptions = React.lazy(() => import('./modules/wedding-integrated/admin/views/ManageSubscriptions'));
const WeddingAdminFinancialSettings = React.lazy(() => import('./modules/wedding-integrated/admin/views/AdminFinancialSettings'));

// Lazy Imports - Wedding Vendor Module
const WeddingVendorOnboardingLayout = React.lazy(() => import('./modules/wedding-integrated/vendor/components/VendorOnboardingLayout'));
const WeddingVendorLogin = React.lazy(() => import('./modules/wedding-integrated/vendor/auth/views/VendorLogin'));
const WeddingVendorSignup = React.lazy(() => import('./modules/wedding-integrated/vendor/auth/views/VendorSignup'));
const WeddingVendorOnboardingStep1 = React.lazy(() => import('./modules/wedding-integrated/vendor/onboarding/views/Step1BasicInfo'));
const WeddingVendorOnboardingStep2 = React.lazy(() => import('./modules/wedding-integrated/vendor/onboarding/views/Step2Portfolio'));
const WeddingVendorOnboardingStep3 = React.lazy(() => import('./modules/wedding-integrated/vendor/onboarding/views/Step3Services'));
const WeddingVendorOnboardingStep4 = React.lazy(() => import('./modules/wedding-integrated/vendor/onboarding/views/Step4Pricing'));
const WeddingVendorOnboardingStep5 = React.lazy(() => import('./modules/wedding-integrated/vendor/onboarding/views/Step5KYC'));
const WeddingVendorOnboardingReview = React.lazy(() => import('./modules/wedding-integrated/vendor/onboarding/views/ReviewSubmit'));
const WeddingVendorDashboard = React.lazy(() => import('./modules/wedding-integrated/vendor/panel/views/DashboardHome'));
const WeddingVendorPendingApproval = React.lazy(() => import('./modules/wedding-integrated/vendor/auth/views/VendorPendingApproval'));
const WeddingVendorProfileEditor = React.lazy(() => import('./modules/wedding-integrated/vendor/panel/views/ProfileEditor'));
const WeddingVendorWorkManager = React.lazy(() => import('./modules/wedding-integrated/vendor/panel/views/WorkManager'));
const WeddingVendorLeadsInbox = React.lazy(() => import('./modules/wedding-integrated/vendor/panel/views/LeadsInbox'));
const WeddingVendorReviewsManager = React.lazy(() => import('./modules/wedding-integrated/vendor/panel/views/ReviewsManager'));
const WeddingVendorSettings = React.lazy(() => import('./modules/wedding-integrated/vendor/panel/views/VendorSettings'));
const WeddingVendorMyVenues = React.lazy(() => import('./modules/wedding-integrated/vendor/panel/views/MyVenues'));
const WeddingVendorAddVenue = React.lazy(() => import('./modules/wedding-integrated/vendor/panel/views/AddVenue'));
const WeddingVendorWallet = React.lazy(() => import('./modules/wedding-integrated/vendor/panel/views/VendorWallet'));
const WeddingVendorAuthLogin = React.lazy(() => import('./modules/wedding-integrated/vendor/auth/views/VendorLogin'));
const WeddingVendorAuthSignup = React.lazy(() => import('./modules/wedding-integrated/vendor/auth/views/VendorSignup'));
const WeddingVendorSubscription = React.lazy(() => import('./modules/wedding-integrated/vendor/panel/views/VendorSubscription'));
const WeddingPaymentStatus = React.lazy(() => import('./modules/wedding-integrated/views/PaymentStatusPage'));
const TaxiApp = React.lazy(() => import('./modules/taxi/TaxiApp'));

// Loading Fallback Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-10 h-10 animate-spin text-surface" />
      <p className="text-gray-500 text-sm font-medium animate-pulse">Loading...</p>
    </div>
  </div>
);

// Wrapper to conditionally render Navbars & Handle Lenis
const Layout = ({ children }) => {
  const location = useLocation();
  const [platformStatus, setPlatformStatus] = React.useState({
    loading: true,
    maintenanceMode: false,
    maintenanceTitle: '',
    maintenanceMessage: ''
  });

  // Disable Lenis on admin-style dashboard routes so nested panels keep native wheel/touchpad scrolling.
  const isCmsRoute =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/cms-admin') ||
    location.pathname.startsWith('/taxi/admin') ||
    location.pathname.startsWith('/taxi/user-import') ||
    location.pathname.startsWith('/taxi/driver-import') ||
    location.pathname.startsWith('/taxi/owner') ||
    location.pathname.startsWith('/wedding/admin') ||
    location.pathname.startsWith('/wedding/vendor');
  useLenis(isCmsRoute);

  const [hideNavsDueToSlider, setHideNavsDueToSlider] = React.useState(false);

  React.useEffect(() => {
    const handleSliderChange = (e) => {
      setHideNavsDueToSlider(!!e.detail);
    };
    window.addEventListener('mydestination:slider', handleSliderChange);
    return () => window.removeEventListener('mydestination:slider', handleSliderChange);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const data = await legalService.getPlatformStatus();
        if (isMounted) {
          setPlatformStatus({
            loading: false,
            maintenanceMode: !!data.maintenanceMode,
            maintenanceTitle: data.maintenanceTitle || 'We will be back soon.',
            maintenanceMessage: data.maintenanceMessage || 'The platform is under scheduled maintenance. Please check back in some time.'
          });
        }
      } catch (error) {
        if (isMounted) {
          setPlatformStatus(prev => ({ ...prev, loading: false }));
        }
      }
    };
    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // 1. GLOBAL HIDE: Auth pages, Admin, and Property Wizard
  const globalHideRoutes = ['/login', '/signup', '/register', '/admin', '/cms-admin', '/hotel/join', '/welcome'];
  const isWeddingRoute = location.pathname.startsWith('/wedding');
  const isTaxiRoute = location.pathname.startsWith('/taxi');
  const shouldGlobalHide = location.pathname === '/' || globalHideRoutes.some(route => location.pathname.includes(route)) || isWeddingRoute || isTaxiRoute;

  if (shouldGlobalHide) {
    return <>{children}</>;
  }

  const isUserHotelDetail = /^\/hotel\/[0-9a-fA-F]{24}(\/(amenities|reviews|offers))?$/.test(location.pathname);
  const isPartnerApp = location.pathname.startsWith('/hotel') && !isUserHotelDetail;

  // 3. NAVBAR VISIBILITY
  const showUserNavs = !isPartnerApp;

  // Specific user pages where BottomNav is hidden
  const hideUserBottomNavOn = ['/booking-confirmation', '/payment', '/support', '/refer', '/hotel/', '/legal', '/terms', '/privacy'];
  const showUserBottomNav = showUserNavs && !hideUserBottomNavOn.some(r => location.pathname.includes(r)) && !hideNavsDueToSlider;

  // Partner Bottom Nav should show in Partner App (authenticated pages)
  const isPartnerPublic = location.pathname === '/hotel/privacy' || location.pathname === '/hotel/contact';
  const showPartnerBottomNav = isPartnerApp && location.pathname !== '/hotel' && !isPartnerPublic && !hideNavsDueToSlider;

  const isAuthRoute = ['/login', '/signup', '/hotel/login', '/hotel/register'].some(route =>
    location.pathname.startsWith(route)
  );

  const showMaintenanceOverlay =
    platformStatus.maintenanceMode &&
    !isCmsRoute &&
    !isAuthRoute;

  return (
    <>
      {showUserNavs && <TopNavbar />}

      <div className={`min-h-screen md:pt-16 ${showUserBottomNav || showPartnerBottomNav ? 'pb-20 md:pb-0' : ''} ${isWeddingRoute ? 'wedding-module' : 'hotel-module'}`}>
        {showMaintenanceOverlay ? (
          <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-6 py-10 text-center bg-gradient-to-b from-[#111827] via-[#0f172a] to-black">
            <div className="flex flex-col items-center justify-center max-w-md w-full">
              <div className="mb-6 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Clock className="w-8 h-8 md:w-9 md:h-9 text-[#39593f]" />
                </div>
                <img
                  src={logo}
                  alt="My DESTINATION"
                  className="h-10 md:h-12 object-contain"
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white mb-3 leading-snug">
                {platformStatus.maintenanceTitle}
              </h1>
              <p className="text-sm md:text-base text-gray-300 mb-8 leading-relaxed">
                {platformStatus.maintenanceMessage}
              </p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {showUserBottomNav && <BottomNavbar />}
      {showPartnerBottomNav && <PartnerBottomNavbar />}
      {showUserNavs && location.pathname !== '/' && location.pathname === '/home' && <Footer />}
    </>

  );
};

// Simple Protected Route for Users
// In WebView (Flutter app): always require login → redirect to /login
// In Browser: allow access; partner-logged-in users are redirected to partner dashboard
const UserProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If partner is logged in but tries to access user routes, redirect to partner dashboard
  if (user?.role === 'partner') {
    console.warn(`[AUTH] Partner ${user._id} attempted to access user route: ${location.pathname}. Redirecting to /hotel/dashboard.`);
    return <Navigate to="/hotel/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

const PublicOrProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  // For both Browser and WebView:
  // If a partner is logged in and tries to access user-facing public routes,
  // redirect them to the partner dashboard. Otherwise allow access.
  if (token && user?.role === 'partner') {
    return <Navigate to="/hotel/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};

/**
 * UserPrivateRoute — always requires authentication (both WebView and Browser)
 * Used for pages that require the user to be logged in: Bookings, Wallet, Checkout, etc.
 * On redirect, preserves location so login can send you back.
 */
const UserPrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const location = useLocation();

  if (!token) {
    // Send wedding module users to wedding login, others to generic login
    const isWeddingRoute = location.pathname.startsWith('/wedding');
    const loginPath = isWeddingRoute ? '/wedding/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  if (user?.role === 'partner') {
    return <Navigate to="/hotel/dashboard" replace />;
  }

  return children ? children : <Outlet />;
};


// Partner Protected Route
const PartnerProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  const location = useLocation();

  // Allow access to login/register/join/privacy/contact
  const publicPartnerPaths = ['/hotel/login', '/hotel/register', '/hotel/privacy', '/hotel/contact'];
  if (publicPartnerPaths.some(p => location.pathname.startsWith(p))) {
    return children ? children : <Outlet />;
  }

  if (!token || !user || user.role !== 'partner') {
    return <Navigate to="/hotel/login" state={{ from: location }} replace />;
  }

  const isPending = user.partnerApprovalStatus !== 'approved';
  if (isPending) {
    const allowedPending = [
      '/hotel/dashboard',
      '/hotel/partner-dashboard',
      '/hotel/join',
      '/hotel/profile',
      '/hotel/join-hotel',
      '/hotel/join-resort',
      '/hotel/join-hostel',
      '/hotel/join-villa',
      '/hotel/join-pg',
      '/hotel/join-homestay'
    ];
    if (!allowedPending.some(p => location.pathname.startsWith(p))) {
      return <Navigate to="/hotel/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
};

// Wedding Vendor Protected Route
const WeddingVendorProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const vendorUserRaw = localStorage.getItem('vendor_user');
  const user = userRaw ? JSON.parse(userRaw) : (vendorUserRaw ? JSON.parse(vendorUserRaw) : null);
  const location = useLocation();

  if (!token || !user) {
    return <Navigate to="/wedding/vendor/login" state={{ from: location }} replace />;
  }

  // If user is logged in but not a vendor, they might need to onboard
  if (user.role !== 'vendor') {
    return <Navigate to="/wedding/vendor/onboarding" replace />;
  }

  // If vendor is rejected, block them
  if (user.partnerApprovalStatus === 'rejected') {
    return <Navigate to="/wedding/vendor/pending-approval" replace />;
  }

  // --- STRICT SUBSCRIPTION LOGIC ---
  const isSubscriptionRoute = location.pathname.includes('/wedding/vendor/subscription');
  
  // Only approved vendors require a subscription. 
  // Check both boolean flag AND expiry date to ensure true strict enforcement
  let hasActiveSubscription = user?.hasActiveSubscription === true;
  if (user?.subscriptionExpiryDate && new Date(user.subscriptionExpiryDate) < new Date()) {
    hasActiveSubscription = false;
  }
  
  if (user.partnerApprovalStatus === 'approved' && !hasActiveSubscription && !isSubscriptionRoute) {
    return <Navigate to="/wedding/vendor/subscription" replace />;
  }

  // Allow 'approved' and 'pending' vendors to access their dashboard
  return children ? children : <Outlet />;
};

// Public Route (redirects to home/dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  
  if (token) {
    if (user?.role === 'partner') {
      return <Navigate to="/hotel/dashboard" replace />;
    } else if (user?.role === 'vendor') {
      return <Navigate to="/wedding/vendor/dashboard" replace />;
    }
    return <Navigate to="/home" replace />;
  }
  return children;
};


// =============================================================================
// PANEL-ISOLATED PUBLIC ROUTES
// Cross-panel redirect FIX: Har panel ka apna isolated guard hai.
// Ek panel ka token doosre panel ke login page ko redirect NAHI karega.
// =============================================================================

/**
 * UserPublicRoute - /login, /signup, /wedding/login, /wedding/signup
 * Sirf role='user' logged in ho to redirect karo.
 * Partner/vendor token? -> User login page dikhao (cross-panel steal NAHI).
 */
const UserPublicRoute = ({ children, redirectTo = '/home' }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  if (token && user?.role === 'user') {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
};

/**
 * PartnerPublicRoute - /hotel/login, /hotel/register
 * Sirf role='partner' logged in ho to redirect karo.
 * User/vendor token? -> Partner login page dikhao.
 */
const PartnerPublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const user = userRaw ? JSON.parse(userRaw) : null;
  if (token && user?.role === 'partner') {
    return <Navigate to="/hotel/dashboard" replace />;
  }
  return children;
};

/**
 * WeddingVendorPublicRoute - /wedding/vendor/login, /wedding/vendor/signup
 * Sirf role='vendor' logged in ho to redirect karo.
 */
const WeddingVendorPublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRaw = localStorage.getItem('user');
  const vendorUserRaw = localStorage.getItem('vendor_user');
  const user = userRaw ? JSON.parse(userRaw) : (vendorUserRaw ? JSON.parse(vendorUserRaw) : null);
  if (token && user?.role === 'vendor') {
    return <Navigate to="/wedding/vendor/dashboard" replace />;
  }
  return children;
};

function App() {
  // Fix for Back Button in WebView/App Wrappers (Flutter/Android)
  // Ensures history stack has depth so "canGoBack" is true, preventing immediate app exit.
  React.useEffect(() => {
    if (window.history && window.history.length === 1) {
      window.history.pushState(null, document.title, window.location.href);
    }
  }, []);

  // One-time cleanup: remove the legacy persisted WebView flag.
  // Old deviceDetect.js stored '__mydestination_app_mode__ = "1"' in localStorage permanently.
  // This caused isWebView() to return true in real browsers that share storage with the app,
  // blocking web push registration. Safe to remove — detection is now done via live UA/URL check.
  React.useEffect(() => {
    localStorage.removeItem('__mydestination_app_mode__');
  }, []);


  // ─── WEB PUSH NOTIFICATIONS (Browser only) ──────────────────────────────────
  // Flutter WebView users: FCM tokens are managed ENTIRELY by the Flutter native
  // code. Flutter hits /api/users/fcm-token or /api/partners/fcm-token directly
  // with platform='app'. The React frontend has NO role in app token management.
  //
  // Real browser users: We request web push permission here, get a web FCM token,
  // and register it with the backend using platform='web'.
  // ─────────────────────────────────────────────────────────────────────────────

  // Register the web FCM token with the correct backend endpoint based on logged-in role.
  const registerWebToken = React.useCallback(async (fcmToken) => {
    try {
      const pathname = String(window.location.pathname || '').toLowerCase();
      if (pathname.startsWith('/taxi')) {
        return;
      }

      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        await adminService.updateFcmToken(fcmToken, 'web');
        console.log('[FCM] ✓ Admin web token registered.');
        return;
      }
      const tokenAuth = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      if (tokenAuth && userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'partner') {
          await hotelService.updateFcmToken(fcmToken, 'web');
          console.log('[FCM] ✓ Partner web token registered.');
        } else {
          await userService.updateFcmToken(fcmToken, 'web');
          console.log('[FCM] ✓ User web token registered.');
        }
      } else {
        console.log('[FCM] No logged-in session — web token will be registered on login.');
      }
    } catch (err) {
      console.warn('[FCM] Failed to register web token:', err);
    }
  }, []);

  React.useEffect(() => {
    let cachedWebToken = null;

    const initWebFcm = async () => {
      // requestNotificationPermission() returns null in WebView (handled in firebase.js).
      // Only proceeds in real browser environments.
      const token = await requestNotificationPermission();
      if (token) {
        cachedWebToken = token;
        await registerWebToken(token);
      }
    };

    initWebFcm();

    // Re-register web token after login/signup.
    // Dispatched from: UserLogin.jsx, HotelLoginPage.jsx, AdminLogin.jsx, UserSignup.jsx
    const handleLoginEvent = async () => {
      console.log('[FCM] Login event — re-registering web token.');
      if (cachedWebToken) {
        await registerWebToken(cachedWebToken);
      } else {
        // Permission not yet obtained — try now (user may have enabled it after loading)
        const token = await requestNotificationPermission();
        if (token) {
          cachedWebToken = token;
          await registerWebToken(token);
        }
      }
    };

    window.addEventListener('fcm:register', handleLoginEvent);

    // Cross-tab login sync
    const handleStorage = (e) => {
      if ((e.key === 'token' || e.key === 'adminToken') && e.newValue) {
        handleLoginEvent();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Foreground messages — shows in-app toast in browser.
    // In Flutter WebView, onMessageListener is a no-op (firebase.js checks isWebView()).
    onMessageListener((payload) => {
      console.log('[FCM] Foreground message:', payload);
      toast((t) => (
        <div className="flex flex-col">
          <span className="font-bold">{payload.notification?.title || 'Notification'}</span>
          <span className="text-sm">{payload.notification?.body}</span>
        </div>
      ), {
        duration: 5000,
        position: 'top-right',
        style: { background: '#333', color: '#fff' },
      });
    });

    return () => {
      window.removeEventListener('fcm:register', handleLoginEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, [registerWebToken]);


  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          zIndex: 10000
        }}
      />
      <Layout>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── User Auth Routes — UserPublicRoute isolates user panel ── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/taxi/*" element={<TaxiApp />} />
            <Route path="/login" element={<UserPublicRoute redirectTo="/home"><UserLogin /></UserPublicRoute>} />
            <Route path="/wedding/login" element={<UserPublicRoute redirectTo="/wedding"><UserLogin theme="wedding" /></UserPublicRoute>} />
            <Route path="/signup" element={<UserPublicRoute redirectTo="/home"><UserSignup /></UserPublicRoute>} />
            <Route path="/wedding/signup" element={<UserPublicRoute redirectTo="/wedding"><UserSignup theme="wedding" /></UserPublicRoute>} />
            <Route path="/r/:referralCode" element={<ReferralHandler />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/cancellation" element={<CancellationPage />} />
            <Route path="/careers" element={<CareersPage />} />


            {/* ── Hotel/Partner Module — PartnerPublicRoute isolates partner panel ── */}
            <Route path="/hotel/login" element={<PartnerPublicRoute><HotelLogin /></PartnerPublicRoute>} />
            <Route path="/hotel/register" element={<PartnerPublicRoute><HotelSignup /></PartnerPublicRoute>} />
            <Route path="/hotel" element={<HotelLayout />}>
              <Route index element={<Navigate to="/hotel/login" replace />} />
              <Route path="partner" element={<Navigate to="/hotel" replace />} />
              {/* Wizard Route */}
              <Route element={<PartnerProtectedRoute />}>
                <Route path="join" element={<PartnerJoinPropertyType />} />
                <Route path="join-hotel" element={<AddHotelWizard />} />
                <Route path="join-resort" element={<AddResortWizard />} />
                <Route path="join-hostel" element={<AddHostelWizard />} />
                <Route path="join-villa" element={<AddVillaWizard />} />
                <Route path="join-pg" element={<AddPGWizard />} />
                <Route path="join-homestay" element={<AddHomestayWizard />} />
                <Route path="partner-dashboard" element={<PartnerDashboard />} />
                <Route path="dashboard" element={<PartnerDashboard />} />

                {/* Partner Sub-pages */}
                <Route path="properties" element={<PartnerProperties />} />
                <Route path="properties/:id" element={<PartnerPropertyDetails />} />
                <Route path="inventory-properties" element={<PartnerInventoryProperties />} />
                <Route path="inventory/:id" element={<PartnerInventory />} />
                <Route path="bookings" element={<PartnerBookings />} />
                <Route path="bookings" element={<PartnerBookings />} />
                <Route path="bookings/:id" element={<PartnerBookingDetail />} />
                <Route path="wallet" element={<PartnerWallet />} />
                <Route path="reviews" element={<PartnerReviews />} />
                <Route path="transactions" element={<PartnerTransactions />} />
                <Route path="notifications" element={<PartnerNotifications />} />
                <Route path="kyc" element={<PartnerKYC />} />
                <Route path="support" element={<PartnerSupport />} />
                <Route path="terms" element={<PartnerTerms />} />
                <Route path="about" element={<PartnerAbout />} />
                <Route path="settings" element={<PartnerSettings />} />
                <Route path="bank-details" element={<PartnerBankDetails />} />
                <Route path="profile" element={<PartnerProfile />} />
              </Route>

              {/* Public Partner Pages — accessible without login */}
              <Route path="privacy" element={<PartnerPrivacy />} />
              <Route path="contact" element={<PartnerContact />} />
            </Route>

            {/* CMS Admin Routes */}
            <Route path="/cms-admin/login" element={<CMSLogin />} />
            <Route path="/cms-admin" element={<CMSLayout />}>
              <Route index element={<CMSDashboard />} />
              <Route path="hero" element={<CMSHeroConfig />} />
              <Route path="destinations" element={<CMSDestinations />} />
              <Route path="promo" element={<CMSPromoBanner />} />
              <Route path="services" element={<CMSServices />} />
              <Route path="staff" element={<CMSStaff />} />
              <Route path="footer" element={<CMSFooter />} />
            </Route>

            {/* Admin Auth Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/signup" element={<AdminSignup />} />

            {/* Admin App Routes */}
            <Route element={<AdminProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="users/:id" element={<AdminUserDetail />} />
                <Route path="bookings" element={<AdminBookings />} />
                <Route path="bookings/:id" element={<AdminBookingDetail />} />
                <Route path="partners" element={<AdminPartners />} />
                <Route path="partners/:id" element={<AdminPartnerDetail />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="finance" element={<AdminFinance />} />
                <Route path="legal" element={<AdminLegalPages />} />
                <Route path="contact-messages" element={<AdminContactMessages />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="properties" element={<AdminProperties />} />
                <Route path="properties/:id" element={<AdminHotelDetail />} />
                <Route path="offers" element={<AdminOffers />} />
                <Route path="notifications" element={<AdminNotifications />} />
                <Route path="faqs" element={<AdminFaqs />} />
              </Route>
            </Route>

            {/* ──────────────────────────────────────
                PROTECTED USER ROUTES (ENTRY FLOW)
            ────────────────────────────────────── */}
            <Route element={<UserProtectedRoute />}>
              <Route path="/home" element={<Home />} />
            </Route>

            {/* ──────────────────────────────────────
                PUBLIC / SEMI-PROTECTED USER ROUTES
                Browser: accessible without login
                WebView: require login (same as before)
            ────────────────────────────────────── */}
            <Route element={<PublicOrProtectedRoute />}>
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/hotel/:id" element={<UserPropertyDetailsPage />} />
              <Route path="/hotel/:id/amenities" element={<AmenitiesPage />} />
              <Route path="/hotel/:id/reviews" element={<ReviewsPage />} />
              <Route path="/hotel/:id/offers" element={<OffersPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/listings" element={<Navigate to="/search" replace />} />
              <Route path="/partner-landing" element={<PartnerLandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/blogs" element={<BlogsPage />} />
              <Route path="/blogs/:id" element={<BlogDetail />} />
              <Route path="/manage-blogs" element={<BlogManager />} />
              <Route path="/serviced" element={<div className="pt-20 text-center text-surface font-bold">Serviced Page</div>} />
            </Route>

            {/* ──────────────────────────────────────
                WEDDING MODULE ROUTES
                Destination wedding functionality
            ────────────────────────────────────── */}
            <Route path="/wedding" element={<WeddingLayout />}>
              <Route index element={<WeddingHomePage />} />
              <Route path="destinations" element={<WeddingDestinationsPage />} />
              <Route path="destinations/:id" element={<WeddingDestinationDetailPage />} />
              <Route path="planners" element={<WeddingPlannersPage />} />
              <Route path="planners/:id" element={<WeddingPlannerDetailPage />} />
              <Route path="vendors" element={<WeddingVendorListingPage />} />
              <Route path="vendors/:vendorId" element={<WeddingVendorDetailPage />} />
              <Route path="enquiry" element={<WeddingEnquiryPage />} />
              <Route path="support" element={<WeddingHelpSupportPage />} />
              <Route path="my-tickets" element={<WeddingMySupportTicketsPage />} />
              {/* Private Wedding User Routes */}
              <Route element={<UserPrivateRoute />}>
                <Route path="bookings" element={<WeddingMyBookingsPage />} />
                <Route path="bookings/:bookingId" element={<WeddingBookingDetailPage />} />
                <Route path="saved" element={<WeddingSavedDestinationsPage />} />
                <Route path="my-enquiries" element={<WeddingMyEnquiriesPage />} />
                <Route path="account" element={<WeddingAccountSettingsPage />} />
                <Route path="payment/status" element={<WeddingPaymentStatus />} />
              </Route>

              <Route path="real-weddings/by-location/:destinationId" element={<WeddingRealWeddingsByLocation />} />
              <Route path="real-weddings/gallery/:weddingId" element={<WeddingRealWeddingGalleryPage />} />
            </Route>

            {/* Wedding Admin Routes */}
            <Route path="/wedding/admin/login" element={<WeddingAdminLogin />} />
            <Route path="/wedding/admin" element={<WeddingAdminLayout />}>
              <Route index element={<Navigate to="/wedding/admin/dashboard" replace />} />
              <Route path="dashboard" element={<WeddingAdminDashboard />} />
              <Route path="vendors/*" element={<WeddingManageVendors />} />
              <Route path="add-category" element={<WeddingAddCategory />} />
              <Route path="enquiries" element={<WeddingManageEnquiries />} />
              <Route path="customers" element={<WeddingManageCustomers />} />
              <Route path="financials" element={<WeddingManageFinancials />} />
              <Route path="destinations" element={<WeddingManageDestinations />} />
              <Route path="venues" element={<WeddingManageVenues />} />
              <Route path="subscriptions" element={<WeddingManageSubscriptions />} />
              <Route path="categories" element={<WeddingManageCategories />} />
              <Route path="testimonials" element={<WeddingManageTestimonials />} />
              <Route path="gallery" element={<WeddingManageRealWeddings />} />
              <Route path="support" element={<WeddingManageSupport />} />
              <Route path="profile" element={<WeddingAdminProfile />} />
              <Route path="settings/*" element={<WeddingAdminSettings />} />
              <Route path="settings/financial" element={<WeddingAdminFinancialSettings />} />
            </Route>

            {/* Wedding Vendor Module Routes */}
            <Route element={<WeddingVendorAuthProvider><WeddingVendorProvider><Outlet /></WeddingVendorProvider></WeddingVendorAuthProvider>}>
              <Route path="/wedding/vendor/login" element={<WeddingVendorPublicRoute><WeddingVendorLogin /></WeddingVendorPublicRoute>} />
              <Route path="/wedding/vendor/signup" element={<WeddingVendorPublicRoute><WeddingVendorSignup /></WeddingVendorPublicRoute>} />
              <Route path="/wedding/vendor/pending-approval" element={<WeddingVendorPendingApproval />} />

              {/* Vendor Onboarding (Integrated) */}
              <Route path="/wedding/vendor/onboarding" element={<WeddingVendorOnboardingLayout />}>
                <Route index element={<Navigate to="step-1" replace />} />
                <Route path="step-1" element={<WeddingVendorOnboardingStep1 />} />
                <Route path="step-2" element={<WeddingVendorOnboardingStep3 />} />
                <Route path="step-3" element={<WeddingVendorOnboardingStep4 />} />
                <Route path="step-4" element={<WeddingVendorOnboardingStep5 />} />
                <Route path="step-5" element={<WeddingVendorOnboardingReview />} />
              </Route>

              {/* Vendor Main Dashboard (Protected) */}
              <Route element={<WeddingVendorProtectedRoute />}>
                <Route path="/wedding/vendor" element={<WeddingVendorOnboardingLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<WeddingVendorDashboard />} />
                  <Route path="profile" element={<WeddingVendorProfileEditor />} />
                  <Route path="work" element={<WeddingVendorWorkManager />} />
                  <Route path="leads" element={<WeddingVendorLeadsInbox />} />
                  <Route path="reviews" element={<WeddingVendorReviewsManager />} />
                  <Route path="wallet" element={<WeddingVendorWallet />} />
                  <Route path="settings" element={<WeddingVendorSettings />} />
                  <Route path="venues/my" element={<WeddingVendorMyVenues />} />
                  <Route path="venues/add" element={<WeddingVendorAddVenue />} />
                  {/* Subscription inside layout so sidebar is visible */}
                  <Route path="subscription" element={<WeddingVendorSubscription />} />
                </Route>
              </Route>

              {/* Payment Status — OUTSIDE protected route so PhonePe redirect always works */}
              <Route path="/wedding/vendor/payment/status" element={<WeddingPaymentStatus />} />
            </Route>


            {/* ──────────────────────────────────────
                PRIVATE USER ROUTES
                Always require login (WebView + Browser)
                After login, redirected back via location.state.from
            ────────────────────────────────────── */}
            <Route element={<UserPrivateRoute />}>
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/wallet" element={<WalletPage />} />
              <Route path="/payment" element={<PaymentPage />} />
              <Route path="/payment/:id" element={<PaymentPage />} />
              <Route path="/support" element={<SupportPage />} />
              <Route path="/checkout" element={<BookingCheckoutPage />} />
              <Route path="/booking-confirmation" element={<BookingConfirmationPage />} />
              <Route path="/booking/:id" element={<BookingConfirmationPage />} />
              <Route path="/refer" element={<ReferAndEarnPage />} />
              <Route path="/saved-places" element={<SavedPlacesPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </Layout>
    </>
  );
}

export default App;
