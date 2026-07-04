import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { MapPin, FileText } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import api from './shared/api/axiosInstance';
import { socketService } from './shared/api/socket';
import { SettingsProvider } from './shared/context/SettingsContext';
import AppAutoUpdater from './shared/components/AppAutoUpdater';
import { addRealtimeNotification } from './user/utils/realtimeNotificationStore';
import { clearLocalUserSession, getLocalUserToken } from './user/services/authService';
import { clearCurrentRide } from './user/services/currentRideService';
import RentalLocationTracker from './user/components/RentalLocationTracker';
import userBusService from './user/services/busService';
import { userService } from './user/services/userService';
import { syncUpcomingRideReminders } from './user/utils/upcomingRideReminderService';
import { getAuthenticatedDriverRole, getLocalDriverToken } from './driver/services/registrationService';
import TaxiSidebar from './user/components/TaxiSidebar';
import { getTaxiAdminToken, getTaxiUserToken } from './shared/authStorage';
import './taxi-index.css';
import './TaxiApp.css';


// Lazy loading pages for performance
const UserHome = lazy(() => import('./user/pages/Home'));
const Login = lazy(() => import('./user/pages/auth/Login'));
const VerifyOTP = lazy(() => import('./user/pages/auth/VerifyOTP'));
const Signup = lazy(() => import('./user/pages/auth/Signup'));

// Ride Module Pages
const SelectLocation = lazy(() => import('./user/pages/ride/SelectLocation'));
const SelectVehicle = lazy(() => import('./user/pages/ride/SelectVehicle'));
const SearchingDriver = lazy(() => import('./user/pages/ride/SearchingDriver'));
const RideTracking = lazy(() => import('./user/pages/ride/RideTracking'));
const RideComplete = lazy(() => import('./user/pages/ride/RideComplete'));
const Chat = lazy(() => import('./user/pages/ride/Chat'));
const Support = lazy(() => import('./user/pages/ride/Support'));
const RideDetail = lazy(() => import('./user/pages/ride/RideDetail'));

// Parcel Module Pages
const ParcelType = lazy(() => import('./user/pages/parcel/ParcelType'));
const SenderReceiverDetails = lazy(() => import('./user/pages/parcel/SenderReceiverDetails'));

// Profile & History
const Activity = lazy(() => import('./user/pages/Activity'));
const Profile = lazy(() => import('./user/pages/Profile'));
const Wallet = lazy(() => import('../../pages/user/WalletPage'));

import TaxiUserBottomNav from './user/components/BottomNavbar';
const TaxiWalletWrapper = () => (
  <>
    <Wallet />
    <TaxiUserBottomNav />
  </>
);

// Coming Soon placeholder (for /tours and any unbuilt routes)
const ComingSoon = lazy(() => import('./shared/pages/ComingSoon'));
const LegalPage = lazy(() => import('./shared/pages/LegalPage'));
const LandingPage = lazy(() => import('./shared/pages/LandingPage'));
const AboutPage = lazy(() => import('./shared/pages/AboutPage'));
const ContactPage = lazy(() => import('./shared/pages/ContactPage'));
const FaqPage = lazy(() => import('./shared/pages/FaqPage'));
const ServicesPage = lazy(() => import('./shared/pages/ServicesPage'));
const BlogPage = lazy(() => import('./shared/pages/BlogPage'));
const LinksPage = lazy(() => import('./shared/pages/LinksPage'));

// Phase 1 — Parcel flow completions
const ParcelSearchingDriver = lazy(() => import('./user/pages/parcel/ParcelSearchingDriver'));
const ParcelTracking = lazy(() => import('./user/pages/parcel/ParcelTracking'));

// Phase 2 — Core utility pages
const UserNotifications = lazy(() => import('./user/pages/Notifications'));
const PromoCodes = lazy(() => import('./user/pages/PromoCodes'));
const UserReferral = lazy(() => import('./user/pages/Referral'));

// Phase 3 — Safety & Support
const SOSContacts = lazy(() => import('./user/pages/safety/SOSContacts'));
const SupportTickets = lazy(() => import('./user/pages/support/SupportTickets'));
const SupportTicketDetail = lazy(() => import('./user/pages/support/SupportTicketDetail'));
const DeleteAccount = lazy(() => import('./user/pages/profile/DeleteAccount'));

// Phase 4 — Cab/Intercity/Bus flows
const CabHome = lazy(() => import('./user/pages/cab/CabHome'));
const SharedTaxi = lazy(() => import('./user/pages/cab/SharedTaxi'));
const SharedTaxiSeats = lazy(() => import('./user/pages/cab/SharedTaxiSeats'));
const SharedTaxiConfirm = lazy(() => import('./user/pages/cab/SharedTaxiConfirm'));
const AirportCab = lazy(() => import('./user/pages/cab/AirportCab'));
const AirportCabConfirm = lazy(() => import('./user/pages/cab/AirportCabConfirm'));
const SpiritualTrip = lazy(() => import('./user/pages/cab/SpiritualTrip'));
const SpiritualTripVehicle = lazy(() => import('./user/pages/cab/SpiritualTripVehicle'));
const SpiritualTripConfirm = lazy(() => import('./user/pages/cab/SpiritualTripConfirm'));

const IntercityVehicle = lazy(() => import('./user/pages/intercity/IntercityVehicle'));
const IntercityDetails = lazy(() => import('./user/pages/intercity/IntercityDetails'));
const IntercityConfirm = lazy(() => import('./user/pages/intercity/IntercityConfirm'));

const BusHome = lazy(() => import('./user/pages/bus/BusHome'));
const BusList = lazy(() => import('./user/pages/bus/BusList'));
const BusSeats = lazy(() => import('./user/pages/bus/BusSeats'));
const BusPreview = lazy(() => import('./user/pages/bus/BusPreview'));
const BusDetails = lazy(() => import('./user/pages/bus/BusDetails'));
const BusConfirm = lazy(() => import('./user/pages/bus/BusConfirm'));

// Phase 5 — Onboarding
const Onboarding = lazy(() => import('./user/pages/auth/Onboarding'));

// New Feature Pages
const BikeRentalHome = lazy(() => import('./user/pages/rental/BikeRentalHome'));
const RentalVehicleDetail = lazy(() => import('./user/pages/rental/RentalVehicleDetail'));
const RentalSchedule = lazy(() => import('./user/pages/rental/RentalSchedule'));
const RentalKYC = lazy(() => import('./user/pages/rental/RentalKYC'));
const RentalDeposit = lazy(() => import('./user/pages/rental/RentalDeposit'));
const RentalConfirmed = lazy(() => import('./user/pages/rental/RentalConfirmed'));
const IntercityHome = lazy(() => import('./user/pages/intercity/IntercityHome'));
const CabSharing = lazy(() => import('./user/pages/cabsharing/CabSharing'));

// Car Pooling flow
const UserPoolingHome = lazy(() => import('./user/pages/pooling/PoolingHome'));
const UserPoolingList = lazy(() => import('./user/pages/pooling/PoolingList'));
const UserPoolingSeats = lazy(() => import('./user/pages/pooling/PoolingSeats'));
const UserPoolingConfirm = lazy(() => import('./user/pages/pooling/PoolingConfirm'));
const AirwaysHome = lazy(() => import('./user/pages/airways/AirwaysHome'));
const AirwaysRouteBooking = lazy(() => import('./user/pages/airways/AirwaysRouteBooking'));
const AirwaysConfirmation = lazy(() => import('./user/pages/airways/AirwaysConfirmation'));
const UserToursHome = lazy(() => import('./user/pages/tours/ToursHome'));
const UserTourDetails = lazy(() => import('./user/pages/tours/TourDetails'));
const UserTourBooking = lazy(() => import('./user/pages/tours/TourBooking'));
const UserTourConfirmation = lazy(() => import('./user/pages/tours/TourConfirmation'));

// Profile Settings Sub-pages
const ProfileSettings = lazy(() => import('./user/pages/profile/ProfileSettings'));
const PaymentSettings = lazy(() => import('./user/pages/profile/PaymentSettings'));
const AddressSettings = lazy(() => import('./user/pages/profile/AddressSettings'));
const BusBookings = lazy(() => import('./user/pages/profile/BusBookings'));
const BusBookingDetail = lazy(() => import('./user/pages/profile/BusBookingDetail'));
const UserSubscriptions = lazy(() => import('./user/pages/profile/Subscriptions'));
// Driver Module - Common
import DriverLayout from './driver/components/DriverLayout';

// Driver Module - Registration
const LanguageSelect = lazy(() => import('./driver/pages/registration/LanguageSelect'));
const DriverWelcome = lazy(() => import('./driver/pages/registration/DriverWelcome'));
const PhoneRegistration = lazy(() => import('./driver/pages/registration/PhoneRegistration'));
const OTPVerification = lazy(() => import('./driver/pages/registration/OTPVerification'));
const RegistrationStatus = lazy(() => import('./driver/pages/registration/RegistrationStatus'));
const StepPersonal = lazy(() => import('./driver/pages/registration/StepPersonal'));
const StepReferral = lazy(() => import('./driver/pages/registration/StepReferral'));
const StepVehicle = lazy(() => import('./driver/pages/registration/StepVehicle'));
const StepDocuments = lazy(() => import('./driver/pages/registration/StepDocuments'));
const ApplicationStatus = lazy(() => import('./driver/pages/registration/ApplicationStatus'));
const PoolingDriverHome = lazy(() => import('./driver/pages/PoolingDriverHome'));

// Driver Module - Core
const DriverHome = lazy(() => import('./driver/pages/DriverHome'));
const OwnerDashboard = lazy(() => import('./driver/pages/OwnerDashboard'));
const OwnerBusServicePage = lazy(() => import('./driver/pages/OwnerBusServicePage'));
const OwnerBusBookingsPage = lazy(() => import('./driver/pages/OwnerBusBookingsPage'));
const ActiveTrip = lazy(() => import('./driver/pages/ActiveTrip'));
const DriverWallet = lazy(() => import('./driver/pages/DriverWallet'));
const DriverProfile = lazy(() => import('./driver/pages/DriverProfile'));
const ServiceCenterDashboard = lazy(() => import('./driver/pages/ServiceCenterDashboard'));
const ServiceCenterVehicleDetails = lazy(() => import('./driver/pages/ServiceCenterVehicleDetails'));
const RideRequests = lazy(() => import('./driver/pages/RideRequests'));
const DriverIncentives = lazy(() => import('./driver/pages/DriverIncentives'));
const BusDriverHome = lazy(() => import('./driver/pages/BusDriverHome'));

// Driver Module - Settings
const EditProfile = lazy(() => import('./driver/pages/settings/EditProfile'));
const DriverDocuments = lazy(() => import('./driver/pages/settings/DriverDocuments'));
const Notifications = lazy(() => import('./driver/pages/settings/Notifications'));
const PayoutMethods = lazy(() => import('./driver/pages/settings/PayoutMethods'));
const Referral = lazy(() => import('./driver/pages/settings/Referral'));
const DriverDeleteAccount = lazy(() => import('./driver/pages/settings/DeleteAccount'));
const SecuritySOS = lazy(() => import('./driver/pages/settings/SecuritySOS'));
const DriverSupport = lazy(() => import('./driver/pages/settings/Support'));
const DriverHelpSupportOptions = lazy(() => import('./driver/pages/settings/HelpSupportOptions'));
const DriverSupportChat = lazy(() => import('./driver/pages/settings/SupportChat'));
const VehicleFleet = lazy(() => import('./driver/pages/settings/VehicleFleet'));
const OwnerVehicleFleet = lazy(() => import('./driver/pages/settings/OwnerVehicleFleet'));
const AddVehicle = lazy(() => import('./driver/pages/settings/AddVehicle'));
const ManageDrivers = lazy(() => import('./driver/pages/settings/ManageDrivers'));
const AddDriver = lazy(() => import('./driver/pages/settings/AddDriver'));

// Admin Module Pages
const AdminLayout = lazy(() => import('./admin/components/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/pages/auth/AdminLogin'));
const AdminDashboard = lazy(() => import('./admin/pages/dashboard/MainDashboard'));
const AdminEarnings = lazy(() => import('./admin/pages/dashboard/AdminEarnings'));
const AdminChat = lazy(() => import('./admin/pages/operations/Chat'));
const AdminTrips = lazy(() => import('./admin/pages/operations/Trips'));
const AdminDeliveries = lazy(() => import('./admin/pages/operations/Deliveries'));
const AdminOngoing = lazy(() => import('./admin/pages/operations/Ongoing'));
const AdminWalletPayment = lazy(() => import('./admin/pages/wallet/WalletPayment'));
const AdminUserList = lazy(() => import('./admin/pages/users/UserList'));
const AdminUserCreate = lazy(() => import('./admin/pages/users/UserCreate'));
const AdminUserDetails = lazy(() => import('./admin/pages/users/UserDetails'));
const AdminDeleteRequestUsers = lazy(() => import('./admin/pages/users/DeleteRequestUsers'));
const AdminUserBulkUpload = lazy(() => import('./admin/pages/users/UserBulkUpload'));
const AdminUserImportCreate = lazy(() => import('./admin/pages/users/UserImportCreate'));
const AdminUserSubscriptions = lazy(() => import('./admin/pages/users/UserSubscriptions'));
const AdminUserSubscriptionCreate = lazy(() => import('./admin/pages/users/UserSubscriptionCreate'));

// DRIVER MANAGEMENT IMPORTS
const AdminDriverList = lazy(() => import('./admin/pages/drivers/DriverList'));
const AdminDriverDetails = lazy(() => import('./admin/pages/drivers/DriverDetails'));
const AdminPendingDrivers = lazy(() => import('./admin/pages/drivers/PendingDrivers'));
const AdminDriverSubscriptions = lazy(() => import('./admin/pages/drivers/DriverSubscriptions'));
const AdminDriverSubscriptionCreate = lazy(() => import('./admin/pages/drivers/DriverSubscriptionCreate'));
const AdminDriverRatings = lazy(() => import('./admin/pages/drivers/DriverRatings'));
const AdminDriverRatingDetail = lazy(() => import('./admin/pages/drivers/DriverRatingDetail'));
const AdminDriverWallet = lazy(() => import('./admin/pages/drivers/DriverWallet'));
const AdminNegativeBalanceDrivers = lazy(() => import('./admin/pages/drivers/NegativeBalanceDrivers'));
const AdminWithdrawalRequestDrivers = lazy(() => import('./admin/pages/drivers/WithdrawalRequestDrivers'));
const AdminWithdrawalRequestDetail = lazy(() => import('./admin/pages/drivers/WithdrawalRequestDetail'));
const AdminDriverDeleteRequests = lazy(() => import('./admin/pages/drivers/DriverDeleteRequests'));
const AdminGlobalDocuments = lazy(() => import('./admin/pages/drivers/GlobalDocuments'));
const AdminDriverDocumentForm = lazy(() => import('./admin/pages/drivers/DriverDocumentForm'));
const AdminDriverBulkUpload = lazy(() => import('./admin/pages/drivers/DriverBulkUpload'));
const AdminDriverImportCreate = lazy(() => import('./admin/pages/drivers/DriverImportCreate'));
const AdminDriverAudit = lazy(() => import('./admin/pages/drivers/DriverAudit'));
const AdminPaymentMethods = lazy(() => import('./admin/pages/drivers/PaymentMethods'));
const AdminDriverCreate = lazy(() => import('./admin/pages/drivers/CreateDriver'));
const AdminDriverEdit = lazy(() => import('./admin/pages/drivers/EditDriver'));
const AdminReferralDashboard = lazy(() => import('./admin/pages/referrals/ReferralDashboard'));
const AdminUserReferralSettings = lazy(() => import('./admin/pages/referrals/UserReferralSettings'));
const AdminDriverReferralSettings = lazy(() => import('./admin/pages/referrals/DriverReferralSettings'));
const AdminReferralTranslation = lazy(() => import('./admin/pages/referrals/ReferralTranslation'));

const AdminPromoCodes = lazy(() => import('./admin/pages/promotions/PromoCodes'));
const AdminSendNotification = lazy(() => import('./admin/pages/promotions/SendNotification'));
const AdminBannerImage = lazy(() => import('./admin/pages/promotions/BannerImage'));

// Price Management
const AdminServiceLocation = lazy(() => import('./admin/pages/price-management/ServiceLocation'));
const AdminServiceStores = lazy(() => import('./admin/pages/price-management/ServiceStores'));
const AdminZoneManagement = lazy(() => import('./admin/pages/price-management/ZoneManagement'));
const AdminAirportManagement = lazy(() => import('./admin/pages/price-management/Airport'));
const AdminSetPrices = lazy(() => import('./admin/pages/price-management/SetPrices'));
const AdminSetPackagePrices = lazy(() => import('./admin/pages/price-management/SetPackagePrices'));
const AdminCreatePackagePrice = lazy(() => import('./admin/pages/price-management/CreatePackagePrice'));
const AdminDriverIncentive = lazy(() => import('./admin/pages/price-management/DriverIncentive'));
const AdminSurgePricing = lazy(() => import('./admin/pages/price-management/SurgePricing'));
const AdminVehicleType = lazy(() => import('./admin/pages/price-management/VehicleType'));
const AdminRentalVehicleTypes = lazy(() => import('./admin/pages/price-management/RentalVehicleTypes'));
const AdminRentalTracking = lazy(() => import('./admin/pages/price-management/RentalTracking'));
const AdminRentalTrackingDetail = lazy(() => import('./admin/pages/price-management/RentalTrackingDetail'));
const AdminRentalBookingRequests = lazy(() => import('./admin/pages/price-management/RentalBookingRequests'));
const AdminRentalQuoteRequests = lazy(() => import('./admin/pages/price-management/RentalQuoteRequests'));
const AdminRentalPackageTypes = lazy(() => import('./admin/pages/price-management/RentalPackageTypes'));
const AdminGoodsTypes = lazy(() => import('./admin/pages/price-management/GoodsTypes'));
const AdminPoolingManager = lazy(() => import('./admin/pages/pooling/PoolingManager'));
const AdminPoolingVehicles = lazy(() => import('./admin/pages/pooling/PoolingVehicles'));
const AdminPoolingVehicleForm = lazy(() => import('./admin/pages/pooling/PoolingVehicleForm'));
const AdminPoolingBookings = lazy(() => import('./admin/pages/pooling/PoolingBookings'));
const AdminPoolingCommissionManager = lazy(() => import('./admin/pages/pooling/PoolingCommissionManager'));
const AdminBusServiceManager = lazy(() => import('./admin/pages/bus-service/BusServiceManager'));
const AdminBusServiceDetails = lazy(() => import('./admin/pages/bus-service/BusServiceDetails'));
const AdminBusBookingManager = lazy(() => import('./admin/pages/bus-service/BusBookingManager'));
const AdminBusCommissionManager = lazy(() => import('./admin/pages/bus-service/BusCommissionManager'));
const AdminAirwaysManager = lazy(() => import('./admin/pages/airways/AirwaysManager'));
const AdminAirwaysRouteManager = lazy(() => import('./admin/pages/airways/AirwaysRouteManager'));
const AdminAirwaysBookingManager = lazy(() => import('./admin/pages/airways/AirwaysBookingManager'));
const AdminTourManager = lazy(() => import('./admin/pages/tours/TourManager'));
const AdminEVStationsManager = lazy(() => import('./admin/pages/ev-stations/ManageEVStations'));
const UserEVStationsMap = lazy(() => import('./user/pages/ev-stations/EVStationsMap'));
const AdminTourBookingManager = lazy(() => import('./admin/pages/tours/TourBookingManager'));
const AdminPricingPlaceholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-400 bg-white rounded-[32px] border border-gray-100 shadow-sm p-10">
    <MapPin size={60} strokeWidth={1} className="mb-6 opacity-20" />
    <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">{title}</h2>
    <p className="mt-2 font-bold italic tracking-tight">Configuration module coming soon</p>
  </div>
);

const AdminOwnerDashboard = lazy(() => import('./admin/pages/owners/OwnerDashboard'));
const AdminManageOwners = lazy(() => import('./admin/pages/owners/ManageOwners'));
const AdminPendingOwners = lazy(() => import('./admin/pages/owners/PendingOwners'));
const AdminOwnerDetails = lazy(() => import('./admin/pages/owners/OwnerDetails'));
const AdminOwnerCreate = lazy(() => import('./admin/pages/owners/OwnerCreate'));
const AdminOwnerPasswordUpdate = lazy(() => import('./admin/pages/owners/OwnerPasswordUpdate'));
const AdminOwnerNeededDocuments = lazy(() => import('./admin/pages/owners/OwnerNeededDocuments'));
const AdminOwnerNeededDocumentsCreate = lazy(() => import('./admin/pages/owners/OwnerNeededDocumentsCreate'));
const AdminManageFleet = lazy(() => import('./admin/pages/owners/ManageFleet'));
const AdminManageFleetCreate = lazy(() => import('./admin/pages/owners/ManageFleetCreate'));
const AdminFleetDrivers = lazy(() => import('./admin/pages/owners/FleetDrivers'));
const AdminFleetDriverCreate = lazy(() => import('./admin/pages/owners/FleetDriverCreate'));
const AdminBlockedFleetDrivers = lazy(() => import('./admin/pages/owners/BlockedFleetDrivers'));
const AdminFleetNeededDocuments = lazy(() => import('./admin/pages/owners/FleetNeededDocuments'));
const AdminFleetNeededDocumentsCreate = lazy(() => import('./admin/pages/owners/FleetNeededDocumentsCreate'));
const AdminWithdrawalRequestOwners = lazy(() => import('./admin/pages/owners/WithdrawalRequestOwners'));
const AdminWithdrawalRequestOwnerDetail = lazy(() => import('./admin/pages/owners/WithdrawalRequestOwnerDetail'));
const AdminDeletedOwners = lazy(() => import('./admin/pages/owners/DeletedOwners'));
const AdminOwnerBookings = lazy(() => import('./admin/pages/owners/OwnerBookings'));

const AdminGeoFencing = lazy(() => import('./admin/pages/geo/GeoFencing'));
const AdminHeatMap = lazy(() => import('./admin/pages/geo/HeatMap'));
const AdminGodsEye = lazy(() => import('./admin/pages/geo/GodsEye'));
const AdminFinance = lazy(() => import('./admin/pages/finance/Finance'));
const AdminFareConfig = lazy(() => import('./admin/pages/finance/FareConfiguration'));
const AdminSafetyCenter = lazy(() => import('./admin/pages/safety/SafetyCenter'));
const AdminCMSBuilder = lazy(() => import('./admin/pages/cms/CMSBuilder'));
const AdminHeaderFooter = lazy(() => import('./admin/pages/cms/HeaderFooter'));
const AdminGlobalSettings = lazy(() => import('./admin/pages/settings/GlobalSettings'));
const AdminGeneralSettings = lazy(() => import('./admin/pages/settings/GeneralSettings'));
const AdminCustomizationSettings = lazy(() => import('./admin/pages/settings/CustomizationSettings'));
const AdminTransportRideSettings = lazy(() => import('./admin/pages/settings/TransportRideSettings'));
const AdminBidRideSettings = lazy(() => import('./admin/pages/settings/BidRideSettings'));
const AdminWalletSettings = lazy(() => import('./admin/pages/settings/WalletSettings'));
const AdminTipSettings = lazy(() => import('./admin/pages/settings/TipSettings'));
const AdminAppModules = lazy(() => import('./admin/pages/settings/AppModules'));
const AdminOnboardingScreens = lazy(() => import('./admin/pages/settings/OnboardingScreens'));
const AdminPaymentGateways = lazy(() => import('./admin/pages/settings/PaymentGateways'));
const AdminSMSGateways = lazy(() => import('./admin/pages/settings/SMSGateways'));
const AdminFirebaseSettings = lazy(() => import('./admin/pages/settings/FirebaseSettings'));
const AdminMapSettings = lazy(() => import('./admin/pages/settings/MapSettings'));
const AdminMailSettings = lazy(() => import('./admin/pages/settings/MailSettings'));
const AdminNotificationChannels = lazy(() => import('./admin/pages/settings/NotificationChannels'));
const AdminDispatcherAddons = lazy(() => import('./admin/pages/settings/DispatcherAddons'));
const AdminCountryManagement = lazy(() => import('./admin/pages/masters/CountryManagement'));
const AdminSupportTicketTitle = lazy(() => import('./admin/pages/support/TicketTitle'));
const AdminSupportTickets = lazy(() => import('./admin/pages/support/SupportTickets'));


// Reports Module
const AdminUserReport = lazy(() => import('./admin/pages/reports/UserReport'));
const AdminDriverReport = lazy(() => import('./admin/pages/reports/DriverReport'));
const AdminDriverDutyReport = lazy(() => import('./admin/pages/reports/DriverDutyReport'));
const AdminOwnerReport = lazy(() => import('./admin/pages/reports/OwnerReport'));
const AdminFinanceReport = lazy(() => import('./admin/pages/reports/FinanceReport'));
const AdminFleetFinanceReport = lazy(() => import('./admin/pages/reports/FleetFinanceReport'));

// Masters Management
const AdminLanguages = lazy(() => import('./admin/pages/masters/Languages'));
const AdminPreferences = lazy(() => import('./admin/pages/masters/Preferences'));

// Admin Management
const AdminAdmins = lazy(() => import('./admin/pages/management/Admins'));
const AdminAdminCreate = lazy(() => import('./admin/pages/management/AdminCreate'));

const AdminReportPlaceholder = ({ title }) => (
  <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-400 bg-white rounded-[32px] border border-gray-100 shadow-sm p-10 mx-6">
    <FileText size={60} strokeWidth={1} className="mb-6 opacity-20" />
    <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest">{title}</h2>
    <p className="mt-2 font-bold italic tracking-tight text-primary">Report engine initializing...</p>
  </div>
);

const AdminSectionPlaceholder = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const title = location.pathname
    .split('/')
    .filter(Boolean)
    .slice(1)
    .join(' / ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="max-w-xl w-full bg-white rounded-[32px] border border-gray-100 shadow-sm p-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
          <FileText size={28} />
        </div>
        <h2 className="text-2xl font-black text-gray-950 uppercase tracking-tight">{title || 'Admin Section'}</h2>
        <p className="mt-3 text-sm font-medium text-gray-500 leading-6">
          This admin section is not wired to the user app. It stays inside the admin shell so navigation remains safe.
        </p>
        <button
          type="button"
          onClick={() => navigate('/taxi/admin/dashboard')}
          className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#2563EB] text-white text-[12px] font-black uppercase tracking-widest shadow-lg shadow-blue-900/20"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

// A wrapper to handle conditional layouts (Mobile for User/Driver, Full for Admin)
const MainLayout = ({ children }) => {
  const location = useLocation();
  const staticPages = [
    '/taxi',
    '/taxi/',
    '/taxi/about',
    '/taxi/contact',
    '/taxi/faq',
    '/taxi/services',
    '/taxi/privacy',
    '/taxi/terms',
    '/taxi/refund',
    '/taxi/cancellation',
    '/taxi/blog',
    '/taxi/links'
  ];
  const isStaticPath = staticPages.includes(location.pathname);
  const isAdminPath =
    location.pathname.startsWith('/taxi/admin') ||
    location.pathname.startsWith('/taxi/user-import') ||
    location.pathname.startsWith('/taxi/driver-import') ||
    location.pathname.startsWith('/taxi/owner');

  if (isAdminPath) {
    return <div className="redigo-admin-root h-screen bg-gray-50 overflow-hidden">{children}</div>;
  }

  if (isStaticPath) {
    return (
      <div className="redigo-landing-root min-h-screen bg-white">
        <main className="min-h-screen">{children}</main>
      </div>
    );
  }

  return (
    <div className="redigo-app min-h-screen bg-white">
      <main className="w-full min-h-screen relative overflow-x-hidden bg-white">
        {children}
      </main>
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
};

const clearUserSession = () => {
  clearCurrentRide();
  clearLocalUserSession();
};

const UserProtectedRoute = () => {
  const location = useLocation();

  if (!getLocalUserToken()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const UserHomeRoute = () => (
  getLocalUserToken()
    ? <UserHome />
    : <Navigate to="/login" replace />
);

const AdminLegacyRedirect = () => {
  const location = useLocation();
  const nextPath = location.pathname.startsWith('/taxi/admin')
    ? location.pathname
    : '/taxi/admin/dashboard';

  return <Navigate to={`${nextPath}${location.search || ''}${location.hash || ''}`} replace />;
};

const UserAccountInvalidationListener = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const isUserRoute =
      !location.pathname.startsWith('/taxi/admin') &&
      !location.pathname.startsWith('/taxi/user-import') &&
      !location.pathname.startsWith('/taxi/driver-import') &&
      !location.pathname.startsWith('/taxi/owner') &&
      !location.pathname.startsWith('/taxi/driver');

    const userToken = getLocalUserToken();

    if (!isUserRoute || !userToken) {
      return undefined;
    }

    const handleLogout = () => {
      clearUserSession();
      socketService.disconnect();
      navigate('/taxi/user/login', { replace: true });
    };

    const handleAdminChatMessage = (payload = {}) => {
      const senderRole = String(payload.senderRole || payload.sender?.role || '').toLowerCase();
      const receiverRole = String(payload.receiverRole || payload.receiver?.role || '').toLowerCase();
      const messageBody = String(payload.message || payload.body || '').trim();

      if (senderRole !== 'admin' || !messageBody) {
        return;
      }

      if (receiverRole && receiverRole !== 'user') {
        return;
      }

      const notificationWasAdded = addRealtimeNotification({
        id: `support-chat:${payload.id || payload._id || `${Date.now()}-${messageBody}`}`,
        title: 'Support message',
        body: messageBody,
        sentAt: payload.createdAt || new Date().toISOString(),
        type: 'support',
        source: 'support-chat',
      });

      if (!notificationWasAdded) {
        return;
      }

      toast(messageBody, {
        duration: 4500,
        className: 'font-bold text-[13px] rounded-2xl shadow-xl border border-sky-50 bg-white',
      });
    };

    const socket = socketService.connect({ role: 'user', token: userToken });
    socketService.on('account:deleted', handleLogout);
    socketService.on('chat:message', handleAdminChatMessage);

    const handleAuthStale = (event) => {
      const staleToken = event.detail?.token || '';
      const currentUserToken = getTaxiUserToken();
      const currentAdminToken = getTaxiAdminToken();

      if (event.detail?.role === 'user' && (!staleToken || staleToken === currentUserToken)) {
        handleLogout();
        return;
      }

      if (event.detail?.role === 'admin' && (!staleToken || staleToken === currentAdminToken)) {
        socketService.disconnect();
        navigate('/taxi/admin/login');
      }
    };

    window.addEventListener('app:auth-stale', handleAuthStale);

    return () => {
      socketService.off('account:deleted', handleLogout);
      socketService.off('chat:message', handleAdminChatMessage);
      window.removeEventListener('app:auth-stale', handleAuthStale);

      if (socket) {
        socketService.disconnect();
      }
    };
  }, [location.pathname, navigate]);

  return null;
};

const getResponsePayload = (response) => response?.data?.data || response?.data || response || {};

const UserUpcomingRideReminderBootstrap = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = String(location.pathname || '');
    const isReminderEligibleRoute =
      pathname === '/taxi' ||
      pathname === '/taxi/user' ||
      pathname.startsWith('/taxi/user/activity') ||
      pathname.startsWith('/taxi/user/profile') ||
      pathname.startsWith('/taxi/ride') ||
      pathname.startsWith('/taxi/pooling') ||
      pathname.startsWith('/taxi/bus');

    if (!isReminderEligibleRoute || !getLocalUserToken()) {
      return undefined;
    }

    let cancelled = false;

    const syncReminders = async () => {
      try {
        const [busResult, poolingResult, scheduledRideResult] = await Promise.all([
          userBusService.getMyBookings({ page: 1, limit: 20, tripState: 'upcoming' }),
          userService.getMyPoolingBookings(),
          api.get('/rides', {
            params: {
              page: 1,
              limit: 20,
              category: 'scheduled',
            },
          }),
        ]);

        if (cancelled) {
          return;
        }

        const busPayload = getResponsePayload(busResult);
        const poolingPayload = getResponsePayload(poolingResult);
        const scheduledRidePayload = getResponsePayload(scheduledRideResult);

        const rawPoolingBookings = Array.isArray(poolingPayload)
          ? poolingPayload
          : Array.isArray(poolingPayload?.results)
            ? poolingPayload.results
            : [];
        const routeIds = [...new Set(rawPoolingBookings.map((booking) => String(booking?.route?._id || '')).filter(Boolean))];
        const routeDetailsEntries = await Promise.all(
          routeIds.map(async (routeId) => {
            try {
              const routeResponse = await userService.getPoolingRouteDetails(routeId);
              return [routeId, getResponsePayload(routeResponse)];
            } catch {
              return [routeId, null];
            }
          }),
        );

        if (cancelled) {
          return;
        }

        const routeDetailsMap = new Map(routeDetailsEntries);
        const poolingBookings = rawPoolingBookings.map((booking) => {
          const routeId = String(booking?.route?._id || '');
          const routeDetails = routeDetailsMap.get(routeId);

          return routeDetails
            ? {
                ...booking,
                route: {
                  ...(booking.route || {}),
                  ...routeDetails,
                },
              }
            : booking;
        });

        syncUpcomingRideReminders({
          busBookings: Array.isArray(busPayload?.results) ? busPayload.results : [],
          poolingBookings,
          scheduledRides: Array.isArray(scheduledRidePayload?.results) ? scheduledRidePayload.results : [],
        });
      } catch {
        // Reminder sync is non-blocking.
      }
    };

    const handleVisibilitySync = () => {
      if (document.visibilityState === 'visible') {
        syncReminders();
      }
    };

    syncReminders();
    const intervalId = window.setInterval(syncReminders, 10 * 60 * 1000);
    window.addEventListener('focus', syncReminders);
    document.addEventListener('visibilitychange', handleVisibilitySync);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', syncReminders);
      document.removeEventListener('visibilitychange', handleVisibilitySync);
    };
  }, [location.pathname]);

  return null;
};

const DriverEntryRedirect = () => {
  const token = getLocalDriverToken();
  const role = String(getAuthenticatedDriverRole() || 'driver').toLowerCase();

  if (!token) {
    return <Navigate to="/taxi/driver/login" replace />;
  }

  return (
    <Navigate
      to={
        role === 'owner'
          ? '/taxi/owner/dashboard'
          : role === 'service_center'
            ? '/taxi/driver/service-center'
            : role === 'service_center_staff'
              ? '/taxi/driver/service-center'
            : role === 'bus_driver'
              ? '/taxi/driver/bus-home'
            : role === 'pooling'
              ? '/taxi/driver/pooling-home'
              : '/taxi/driver/home'
      }
      replace
    />
  );
};

function App() {
  const location = useLocation();


  const pathname = String(location.pathname || '');
  const isUserAuthRoute = false; // We don't render user auth routes in TaxiApp anymore

  return (
    
      <SettingsProvider>
        {!isUserAuthRoute ? <RentalLocationTracker /> : null}
        <AppAutoUpdater />
        <ScrollToTop />
        {!isUserAuthRoute ? <UserAccountInvalidationListener /> : null}
        {!isUserAuthRoute ? <UserUpcomingRideReminderBootstrap /> : null}
        <TaxiSidebar />
        <MainLayout>
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen bg-white">
                <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
              </div>
            }>
            <Toaster position="top-right" />
            <Routes>
              {/* Static / Public routes */}
              <Route index element={<Navigate to="/taxi/home" replace />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="faq" element={<FaqPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="blog" element={<BlogPage />} />
              <Route path="links" element={<LinksPage />} />
              <Route path="terms" element={<LegalPage />} />
              <Route path="terms-and-conditions" element={<LegalPage />} />
              <Route path="privacy" element={<LegalPage />} />
              <Route path="privacy-policy" element={<LegalPage />} />
              <Route path="refund" element={<LegalPage />} />
              <Route path="cancellation" element={<LegalPage />} />
              {/* Centralized Login Redirects */}
              <Route path="login" element={<Navigate to="/login" replace />} />
              <Route path="signup" element={<Navigate to="/signup" replace />} />
              <Route path="verify-otp" element={<Navigate to="/login" replace />} />
              <Route path="user/login" element={<Navigate to="/login" replace />} />
              <Route path="user/signup" element={<Navigate to="/signup" replace />} />
              
              <Route path="home" element={<UserHomeRoute />} />
              {/* Desktop TopNavbar link redirects */}
              <Route path="rides" element={<Navigate to="/taxi/user/activity" replace />} />
              <Route path="support" element={<Navigate to="/taxi/user/support" replace />} />

              <Route element={<UserProtectedRoute />}>
              <Route
                path="ride/select-location"
                element={<SelectLocation />}
              />
              <Route path="ride/select-vehicle" element={<SelectVehicle />} />
              <Route path="ride/searching" element={<SearchingDriver />} />
              <Route path="ride/tracking" element={<RideTracking />} />
              <Route path="ride/complete" element={<RideComplete />} />
              <Route path="ride/chat" element={<Chat />} />
              <Route path="support" element={<Support />} />
              <Route path="ride/detail/:id" element={<RideDetail />} />

              <Route path="parcel/type" element={<ParcelType />} />
              <Route path="parcel/details" element={<SenderReceiverDetails />} />
              <Route
                path="parcel/contacts"
                element={<SenderReceiverDetails />}
              />
              <Route
                path="parcel/searching"
                element={<ParcelSearchingDriver />}
              />
              <Route path="parcel/tracking" element={<ParcelTracking />} />
              <Route path="parcel/detail/:id" element={<RideDetail />} />

              {/* New Service Routes — Real pages replacing ComingSoon */}
              <Route path="rental" element={<BikeRentalHome />} />
              <Route path="rental/vehicle" element={<RentalVehicleDetail />} />
              <Route path="rental/schedule" element={<RentalSchedule />} />
              <Route path="rental/kyc" element={<RentalKYC />} />
              <Route path="rental/deposit" element={<RentalDeposit />} />
              <Route path="rental/confirmed" element={<RentalConfirmed />} />
              <Route path="intercity" element={<IntercityHome />} />
              <Route path="intercity/vehicle" element={<IntercityVehicle />} />
              <Route path="intercity/details" element={<IntercityDetails />} />
              <Route path="intercity/confirm" element={<IntercityConfirm />} />
              <Route path="cab-sharing" element={<CabSharing />} />
              <Route path="cab" element={<CabHome />} />
              <Route path="cab/shared" element={<SharedTaxi />} />
              <Route path="cab/shared/seats" element={<SharedTaxiSeats />} />
              <Route
                path="cab/shared/confirm"
                element={<SharedTaxiConfirm />}
              />
              <Route path="cab/airport" element={<AirportCab />} />
              <Route
                path="cab/airport-confirm"
                element={<AirportCabConfirm />}
              />
              <Route path="cab/spiritual" element={<SpiritualTrip />} />
              <Route
                path="cab/spiritual-vehicle"
                element={<SpiritualTripVehicle />}
              />
              <Route
                path="cab/spiritual-confirm"
                element={<SpiritualTripConfirm />}
              />
              <Route path="bus" element={<BusHome />} />
              <Route path="bus/list" element={<BusList />} />
              <Route path="bus/seats" element={<BusSeats />} />
              <Route path="bus/details" element={<BusDetails />} />
              <Route path="bus/confirm" element={<BusConfirm />} />
              <Route path="tours" element={<ComingSoon />} />

              <Route path="activity" element={<Activity />} />
              <Route path="profile" element={<Profile />} />
              <Route path="wallet" element={<TaxiWalletWrapper />} />
              <Route path="notifications" element={<UserNotifications />} />
              <Route path="promo" element={<PromoCodes />} />
              <Route path="referral" element={<UserReferral />} />

              <Route path="profile/settings" element={<ProfileSettings />} />
              <Route path="profile/payments" element={<PaymentSettings />} />
              <Route path="profile/addresses" element={<AddressSettings />} />
              <Route
                path="profile/notifications"
                element={<UserNotifications />}
              />
              <Route
                path="profile/delete-account"
                element={<DeleteAccount />}
              />
              <Route path="safety/sos" element={<SOSContacts />} />
              <Route path="support/tickets" element={<SupportTickets />} />
              <Route
                path="support/ticket/:id"
                element={<SupportTicketDetail />}
              />
              </Route>

              {/* User Module Routes (Taxi-prefixed aliases to match Driver style) */}
              <Route path="user/onboarding" element={<Onboarding />} />
              <Route path="user/login" element={<Login />} />
              <Route path="user/terms" element={<LegalPage />} />
              <Route path="user/privacy" element={<LegalPage />} />
              <Route path="user/verify-otp" element={<VerifyOTP />} />
              <Route path="user/signup" element={<Signup />} />
              <Route path="user" element={<UserHomeRoute taxiPrefixed />} />

              <Route element={<UserProtectedRoute />}>
              <Route
                path="user/ride/select-location"
                element={<SelectLocation />}
              />
              <Route
                path="user/ride/select-vehicle"
                element={<SelectVehicle />}
              />
              <Route
                path="user/ride/searching"
                element={<SearchingDriver />}
              />
              <Route
                path="user/ride/tracking"
                element={<RideTracking />}
              />
              <Route
                path="user/ride/complete"
                element={<RideComplete />}
              />
              <Route path="user/ride/chat" element={<Chat />} />
              <Route path="user/support" element={<Support />} />
              <Route
                path="user/ride/detail/:id"
                element={<RideDetail />}
              />

              <Route path="user/parcel/type" element={<ParcelType />} />
              <Route
                path="user/parcel/details"
                element={<SenderReceiverDetails />}
              />
              <Route
                path="user/parcel/contacts"
                element={<SenderReceiverDetails />}
              />
              <Route
                path="user/parcel/searching"
                element={<ParcelSearchingDriver />}
              />
              <Route
                path="user/parcel/tracking"
                element={<ParcelTracking />}
              />
              <Route
                path="user/parcel/detail/:id"
                element={<RideDetail />}
              />

                <Route path="user/pooling" element={<UserPoolingHome />} />
                <Route path="user/pooling/list" element={<UserPoolingList />} />
                <Route path="user/pooling/seats/:id" element={<UserPoolingSeats />} />
                <Route path="user/pooling/confirm" element={<UserPoolingConfirm />} />
                <Route path="user/airways" element={<AirwaysHome />} />
                <Route path="user/airways/routes/:routeId" element={<AirwaysRouteBooking />} />
                <Route path="user/airways/confirmation/:bookingId" element={<AirwaysConfirmation />} />
                <Route path="user/ev-stations" element={<UserEVStationsMap />} />
                <Route path="user/tours" element={<UserToursHome />} />
                <Route path="user/tours/:id" element={<UserTourDetails />} />
                <Route path="user/tours/book/:id" element={<UserTourBooking />} />
                <Route path="user/tours/confirmation/:bookingId" element={<UserTourConfirmation />} />
                <Route path="user/rental" element={<BikeRentalHome />} />
              <Route
                path="user/rental/vehicle"
                element={<RentalVehicleDetail />}
              />
              <Route
                path="user/rental/schedule"
                element={<RentalSchedule />}
              />
              <Route path="user/rental/kyc" element={<RentalKYC />} />
              <Route
                path="user/rental/deposit"
                element={<RentalDeposit />}
              />
              <Route
                path="user/rental/confirmed"
                element={<RentalConfirmed />}
              />
              <Route path="user/intercity" element={<IntercityHome />} />
              <Route
                path="user/intercity/vehicle"
                element={<IntercityVehicle />}
              />
              <Route
                path="user/intercity/details"
                element={<IntercityDetails />}
              />
              <Route
                path="user/intercity/confirm"
                element={<IntercityConfirm />}
              />
              <Route path="user/cab-sharing" element={<CabSharing />} />
              <Route path="user/cab" element={<CabHome />} />
              <Route path="user/cab/shared" element={<SharedTaxi />} />
              <Route
                path="user/cab/shared/seats"
                element={<SharedTaxiSeats />}
              />
              <Route
                path="user/cab/shared/confirm"
                element={<SharedTaxiConfirm />}
              />
              <Route path="user/cab/airport" element={<AirportCab />} />
              <Route
                path="user/cab/airport-confirm"
                element={<AirportCabConfirm />}
              />
              <Route
                path="user/cab/spiritual"
                element={<SpiritualTrip />}
              />
              <Route
                path="user/cab/spiritual-vehicle"
                element={<SpiritualTripVehicle />}
              />
              <Route
                path="user/cab/spiritual-confirm"
                element={<SpiritualTripConfirm />}
              />
              <Route path="user/bus" element={<BusHome />} />
              <Route path="user/bus/list" element={<BusList />} />
              <Route path="user/bus/seats" element={<BusSeats />} />
              <Route path="user/bus/details" element={<BusPreview />} />
              <Route path="user/bus/checkout" element={<BusDetails />} />
              <Route path="user/bus/confirm" element={<BusConfirm />} />
              <Route path="user/tours" element={<ComingSoon />} />

              <Route path="user/activity" element={<Activity />} />
              <Route path="user/profile" element={<Profile />} />
              <Route path="user/wallet" element={<Wallet />} />
              <Route
                path="user/notifications"
                element={<UserNotifications />}
              />
              <Route path="user/promo" element={<PromoCodes />} />
              <Route path="user/referral" element={<UserReferral />} />

              <Route
                path="user/profile/settings"
                element={<ProfileSettings />}
              />
              <Route
                path="user/profile/payments"
                element={<PaymentSettings />}
              />
              <Route
                path="user/profile/addresses"
                element={<AddressSettings />}
              />
              <Route
                path="user/profile/bus-bookings"
                element={<BusBookings />}
              />
              <Route
                path="user/profile/bus-bookings/:id"
                element={<BusBookingDetail />}
              />
              <Route
                path="user/profile/subscriptions"
                element={<UserSubscriptions />}
              />
              <Route
                path="user/profile/notifications"
                element={<UserNotifications />}
              />
              <Route
                path="user/profile/delete-account"
                element={<DeleteAccount />}
              />
              <Route path="user/safety/sos" element={<SOSContacts />} />
              <Route
                path="user/support/tickets"
                element={<SupportTickets />}
              />
              <Route
                path="user/support/ticket/:id"
                element={<SupportTicketDetail />}
              />
              </Route>

              {/* Driver Module Routes - Centralized under DriverLayout for Theme & Styling */}
              <Route path="driver/" element={<DriverEntryRedirect />} />
              <Route path="driver" element={<DriverLayout />}>
                <Route
                  index
                  element={<DriverEntryRedirect />}
                />
                <Route path="lang-select" element={<LanguageSelect />} />
                <Route path="welcome" element={<DriverWelcome />} />
                <Route path="login" element={<PhoneRegistration />} />
                <Route path="reg-phone" element={<PhoneRegistration />} />
                <Route path="otp-verify" element={<OTPVerification />} />
                <Route path="step-personal" element={<StepPersonal />} />
                <Route path="step-referral" element={<StepReferral />} />
                <Route path="step-vehicle" element={<StepVehicle />} />
                <Route path="step-documents" element={<StepDocuments />} />
                <Route
                  path="registration-status"
                  element={<RegistrationStatus />}
                />
                <Route path="status" element={<ApplicationStatus />} />

                 <Route path="home" element={<DriverHome />} />
                 <Route path="bus-home" element={<BusDriverHome />} />
                 <Route path="pooling-home" element={<PoolingDriverHome />} />
                 <Route path="dashboard" element={<DriverHome />} />
                <Route path="active-trip" element={<ActiveTrip />} />
                <Route path="chat" element={<Chat />} />
                <Route path="wallet" element={<DriverWallet />} />
                <Route path="profile" element={<DriverProfile />} />
                <Route path="service-center" element={<ServiceCenterDashboard />} />
                <Route path="service-center/vehicles/new" element={<ServiceCenterVehicleDetails />} />
                <Route path="service-center/vehicles/:vehicleId" element={<ServiceCenterVehicleDetails />} />
                <Route path="history" element={<RideRequests />} />
                <Route path="incentives" element={<DriverIncentives />} />

                <Route path="edit-profile" element={<EditProfile />} />
                <Route path="documents" element={<DriverDocuments />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="payout-methods" element={<PayoutMethods />} />
                <Route path="referral" element={<Referral />} />
                <Route
                  path="delete-account"
                  element={<DriverDeleteAccount />}
                />
                <Route path="security" element={<SecuritySOS />} />
                <Route path="support" element={<DriverSupport />} />
                <Route
                  path="help-support"
                  element={<DriverHelpSupportOptions />}
                />
                <Route path="support/chat" element={<DriverSupportChat />} />
                <Route path="support/tickets" element={<SupportTickets />} />
                <Route
                  path="support/ticket/:id"
                  element={<SupportTicketDetail />}
                />
                <Route path="vehicle-fleet" element={<VehicleFleet />} />
                <Route
                  path="vehicle-fleet/edit/:vehicleId"
                  element={<VehicleFleet />}
                />
                <Route path="add-vehicle" element={<AddVehicle />} />
                <Route path="manage-drivers" element={<ManageDrivers />} />
                <Route path="add-driver" element={<AddDriver />} />
                <Route path="edit-driver/:driverId" element={<AddDriver />} />
              </Route>

              <Route path="owner/" element={<DriverEntryRedirect />} />
              <Route path="owner" element={<DriverLayout />}>
                <Route index element={<DriverEntryRedirect />} />
                <Route path="login" element={<PhoneRegistration />} />
                <Route path="reg-phone" element={<PhoneRegistration />} />
                <Route path="otp-verify" element={<OTPVerification />} />
                <Route path="lang-select" element={<LanguageSelect />} />
                <Route path="step-personal" element={<StepPersonal />} />
                <Route path="step-referral" element={<StepReferral />} />
                <Route path="step-vehicle" element={<StepVehicle />} />
                <Route path="step-documents" element={<StepDocuments />} />
                <Route path="registration-status" element={<RegistrationStatus />} />
                <Route path="status" element={<ApplicationStatus />} />
                <Route path="home" element={<OwnerDashboard />} />
                <Route path="dashboard" element={<OwnerDashboard />} />
                <Route path="bus-service" element={<OwnerBusServicePage />} />
                <Route path="bus-service/create" element={<OwnerBusServicePage />} />
                <Route path="bus-service/edit/:id" element={<OwnerBusServicePage />} />
                <Route path="bus-service/:id" element={<OwnerBusServicePage />} />
                <Route path="bus-bookings" element={<OwnerBusBookingsPage />} />
                <Route path="profile" element={<DriverProfile />} />
                <Route path="wallet" element={<DriverWallet />} />
                <Route path="history" element={<RideRequests />} />
                <Route path="edit-profile" element={<EditProfile />} />
                <Route path="documents" element={<DriverDocuments />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="payout-methods" element={<PayoutMethods />} />
                <Route path="referral" element={<Referral />} />
                <Route path="delete-account" element={<DriverDeleteAccount />} />
                <Route path="security" element={<SecuritySOS />} />
                <Route path="support" element={<DriverSupport />} />
                <Route path="help-support" element={<DriverHelpSupportOptions />} />
                <Route path="support/chat" element={<DriverSupportChat />} />
                <Route path="support/tickets" element={<SupportTickets />} />
                <Route path="support/ticket/:id" element={<SupportTicketDetail />} />
                <Route path="vehicle-fleet" element={<OwnerVehicleFleet />} />
                <Route
                  path="vehicle-fleet/edit/:vehicleId"
                  element={<OwnerVehicleFleet />}
                />
                <Route path="add-vehicle" element={<AddVehicle />} />
                <Route path="manage-drivers" element={<ManageDrivers />} />
                <Route path="add-driver" element={<AddDriver />} />
                <Route path="edit-driver/:driverId" element={<AddDriver />} />
              </Route>

              {/* Admin Module Routes */}
              <Route path="/admin/*" element={<AdminLegacyRedirect />} />
              <Route path="admin/login" element={<AdminLogin />} />
              <Route path="user-import/create" element={<AdminLayout />}>
                <Route index element={<AdminUserImportCreate />} />
              </Route>
              <Route path="driver-import/create" element={<AdminLayout />}>
                <Route index element={<AdminDriverImportCreate />} />
              </Route>
              <Route path="owner/create" element={<AdminLayout />}>
                <Route index element={<AdminOwnerCreate />} />
              </Route>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/taxi/admin/dashboard" />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="earnings" element={<AdminEarnings />} />
                <Route path="chat" element={<AdminChat />} />
                <Route path="trips" element={<AdminTrips />} />
                <Route path="deliveries" element={<AdminDeliveries />} />
                <Route path="ongoing" element={<AdminOngoing />} />
                <Route path="bus-service" element={<AdminBusServiceManager />} />
                <Route path="bus-service/create" element={<AdminBusServiceManager mode="create" />} />
                <Route path="bus-service/edit/:id" element={<AdminBusServiceManager mode="edit" />} />
                <Route path="bus-service/commission" element={<AdminBusCommissionManager />} />
                <Route path="bus-service/bookings" element={<AdminBusBookingManager />} />
                <Route path="bus-service/:id" element={<AdminBusServiceDetails />} />
                <Route path="airways" element={<AdminAirwaysManager />} />
                <Route path="airways/create" element={<AdminAirwaysManager mode="create" />} />
                <Route path="airways/edit/:id" element={<AdminAirwaysManager mode="edit" />} />
                <Route path="airways/routes" element={<AdminAirwaysRouteManager />} />
                <Route path="airways/routes/create" element={<AdminAirwaysRouteManager mode="create" />} />
                <Route path="airways/routes/edit/:id" element={<AdminAirwaysRouteManager mode="edit" />} />
                <Route path="airways/bookings" element={<AdminAirwaysBookingManager />} />
                <Route path="tours" element={<AdminTourManager />} />
                <Route path="tours/create" element={<AdminTourManager mode="create" />} />
                <Route path="tours/edit/:id" element={<AdminTourManager mode="edit" />} />
                <Route path="tours/bookings" element={<AdminTourBookingManager />} />
                <Route path="ev-stations" element={<AdminEVStationsManager />} />
                <Route path="pooling" element={<Navigate to="/taxi/admin/pooling/routes" replace />} />
                <Route path="pooling/routes" element={<AdminPoolingManager />} />
                <Route
                  path="pooling/create"
                  element={<AdminPoolingManager mode="create" />}
                />
                <Route
                  path="pooling/edit/:id"
                  element={<AdminPoolingManager mode="edit" />}
                />
                <Route path="pooling/commission" element={<AdminPoolingCommissionManager />} />
                <Route path="pooling/vehicles" element={<AdminPoolingVehicles />} />
                <Route
                  path="pooling/vehicles/create"
                  element={<AdminPoolingVehicleForm />}
                />
                <Route
                  path="pooling/vehicles/edit/:id"
                  element={<AdminPoolingVehicleForm />}
                />
                <Route path="pooling/bookings" element={<AdminPoolingBookings />} />
                <Route path="wallet/payment" element={<AdminWalletPayment />} />
                <Route path="users" element={<AdminUserList />} />
                <Route path="users/create" element={<AdminUserCreate />} />
                <Route path="users/subscriptions" element={<AdminUserSubscriptions />} />
                <Route path="users/subscriptions/create" element={<AdminUserSubscriptionCreate />} />
                <Route path="users/:id" element={<AdminUserDetails />} />
                <Route
                  path="users/delete-requests"
                  element={<AdminDeleteRequestUsers />}
                />
                <Route
                  path="users/bulk-upload"
                  element={<AdminUserBulkUpload />}
                />
                <Route
                  path="user-import/create"
                  element={<AdminUserImportCreate />}
                />

                <Route path="drivers" element={<AdminDriverList />} />
                <Route path="drivers/active" element={<AdminDriverList mode="active" />} />
                <Route path="drivers/create" element={<AdminDriverCreate />} />
                <Route path="drivers/edit/:id" element={<AdminDriverEdit />} />
                <Route path="drivers/:id" element={<AdminDriverDetails />} />
                <Route
                  path="drivers/pending"
                  element={<AdminPendingDrivers />}
                />
                <Route
                  path="drivers/subscription"
                  element={<AdminDriverSubscriptions />}
                />
                <Route
                  path="drivers/subscription/create"
                  element={<AdminDriverSubscriptionCreate />}
                />
                <Route
                  path="drivers/ratings"
                  element={<AdminDriverRatings />}
                />
                <Route
                  path="drivers/ratings/:id"
                  element={<AdminDriverRatingDetail />}
                />
                <Route path="drivers/wallet" element={<AdminDriverWallet />} />
                <Route
                  path="drivers/wallet/negative"
                  element={<AdminNegativeBalanceDrivers />}
                />
                <Route
                  path="drivers/wallet/withdrawals"
                  element={<AdminWithdrawalRequestDrivers />}
                />
                <Route
                  path="drivers/wallet/withdrawals/:id"
                  element={<AdminWithdrawalRequestDetail />}
                />
                <Route
                  path="drivers/delete-requests"
                  element={<AdminDriverDeleteRequests />}
                />
                <Route
                  path="drivers/documents"
                  element={<AdminGlobalDocuments />}
                />
                <Route
                  path="drivers/documents/create"
                  element={<AdminDriverDocumentForm />}
                />
                <Route
                  path="drivers/documents/edit/:id"
                  element={<AdminDriverDocumentForm />}
                />
                <Route
                  path="drivers/bulk-upload"
                  element={<AdminDriverBulkUpload />}
                />
                <Route
                  path="driver-import/create"
                  element={<AdminDriverImportCreate />}
                />
                <Route
                  path="drivers/payment-methods"
                  element={<AdminPaymentMethods />}
                />
                <Route
                  path="drivers/audit/:id"
                  element={<AdminDriverAudit />}
                />
                <Route
                  path="referrals/dashboard"
                  element={<AdminReferralDashboard />}
                />
                <Route
                  path="referrals/user-settings"
                  element={<AdminUserReferralSettings />}
                />
                <Route
                  path="referrals/driver-settings"
                  element={<AdminDriverReferralSettings />}
                />
                <Route
                  path="referrals/translation"
                  element={<AdminReferralTranslation />}
                />
                {/* Promotions Management */}
                <Route
                  path="promotions/promo-codes"
                  element={<AdminPromoCodes />}
                />
                <Route
                  path="promotions/promo-codes/create"
                  element={<AdminPromoCodes />}
                />
                <Route
                  path="promotions/promo-codes/edit/:id"
                  element={<AdminPromoCodes />}
                />
                <Route
                  path="promotions/send-notification"
                  element={<AdminSendNotification />}
                />
                <Route
                  path="promotions/send-notification/create"
                  element={<AdminSendNotification />}
                />
                <Route
                  path="promotions/banner-image"
                  element={<AdminBannerImage />}
                />
                <Route
                  path="promotions/banner-image/create"
                  element={<AdminBannerImage />}
                />

                {/* Admin Management */}
                <Route path="management/admins" element={<AdminAdmins />} />
                <Route
                  path="management/admins/create"
                  element={<AdminAdminCreate />}
                />
                <Route
                  path="management/admins/edit/:id"
                  element={<AdminAdminCreate />}
                />

                {/* Owner Management */}
                <Route
                  path="owners/dashboard"
                  element={<AdminOwnerDashboard />}
                />
                <Route path="owners/pending" element={<AdminPendingOwners />} />
                <Route path="owners" element={<AdminManageOwners />} />
                <Route path="owners/create" element={<AdminOwnerCreate />} />
                <Route
                  path="owners/:id/password"
                  element={<AdminOwnerPasswordUpdate />}
                />
                <Route path="owners/:id" element={<AdminOwnerDetails />} />
                <Route
                  path="owners/wallet/withdrawals"
                  element={<AdminWithdrawalRequestOwners />}
                />
                <Route
                  path="owners/wallet/withdrawals/:id"
                  element={<AdminWithdrawalRequestOwnerDetail />}
                />
                <Route path="fleet/drivers" element={<AdminFleetDrivers />} />
                <Route
                  path="fleet/drivers/create"
                  element={<AdminFleetDriverCreate />}
                />
                <Route
                  path="fleet/blocked"
                  element={<AdminBlockedFleetDrivers />}
                />
                <Route
                  path="fleet/documents"
                  element={<AdminFleetNeededDocuments />}
                />
                <Route
                  path="fleet/documents/create"
                  element={<AdminFleetNeededDocumentsCreate />}
                />
                <Route path="fleet/manage" element={<AdminManageFleet />} />
                <Route
                  path="fleet/manage/create"
                  element={<AdminManageFleetCreate />}
                />
                <Route
                  path="owners/documents"
                  element={<AdminOwnerNeededDocuments />}
                />
                <Route
                  path="owners/documents/create"
                  element={<AdminOwnerNeededDocumentsCreate />}
                />
                <Route path="owners/deleted" element={<AdminDeletedOwners />} />
                <Route
                  path="owners/bookings"
                  element={<AdminOwnerBookings />}
                />
                <Route
                  path="referrals/config"
                  element={
                    <div className="flex items-center justify-center min-h-[500px] text-gray-400 font-bold uppercase tracking-widest">
                      Referral Configuration - Under Setup
                    </div>
                  }
                />
                <Route
                  path="referrals/active"
                  element={
                    <div className="flex items-center justify-center min-h-[500px] text-gray-400 font-bold uppercase tracking-widest">
                      Active Referrals Logs - Under Setup
                    </div>
                  }
                />
                <Route path="geo/heatmap" element={<AdminHeatMap />} />
                <Route path="geo/gods-eye" element={<AdminGodsEye />} />
                <Route path="geo/peak-zone" element={<AdminGeoFencing />} />
                <Route path="geo/*" element={<AdminGeoFencing />} />
                <Route path="finance" element={<AdminFinance />} />
                {/* Price Management */}
                <Route path="pricing">
                  <Route index element={<Navigate to="service-location" />} />
                  <Route
                    path="service-location"
                    element={<AdminServiceLocation />}
                  />
                  <Route
                    path="service-location/add"
                    element={<AdminServiceLocation mode="create" />}
                  />
                  <Route
                    path="service-location/edit/:id"
                    element={<AdminServiceLocation mode="edit" />}
                  />
                  <Route
                    path="service-stores"
                    element={<AdminServiceStores />}
                  />
                  <Route
                    path="service-stores/add"
                    element={<AdminServiceStores mode="create" />}
                  />
                  <Route
                    path="service-stores/edit/:id"
                    element={<AdminServiceStores mode="edit" />}
                  />
                  <Route path="app-modules" element={<AdminAppModules />} />
                  <Route
                    path="app-modules/create"
                    element={<AdminAppModules mode="create" />}
                  />
                  <Route
                    path="app-modules/edit/:id"
                    element={<AdminAppModules mode="edit" />}
                  />
                  <Route path="zone" element={<AdminZoneManagement />} />
                  <Route
                    path="zone/create"
                    element={<AdminZoneManagement mode="create" />}
                  />
                  <Route
                    path="zone/edit/:id"
                    element={<AdminZoneManagement mode="edit" />}
                  />
                  <Route path="airport" element={<AdminAirportManagement />} />
                  <Route
                    path="airport/create"
                    element={<AdminAirportManagement mode="create" />}
                  />
                  <Route
                    path="airport/edit/:id"
                    element={<AdminAirportManagement mode="edit" />}
                  />
                  <Route path="vehicle-type" element={<AdminVehicleType />} />
                  <Route
                    path="vehicle-type/create"
                    element={<AdminVehicleType mode="create" />}
                  />
                  <Route
                    path="vehicle-type/edit/:id"
                    element={<AdminVehicleType mode="edit" />}
                  />
                  <Route
                    path="rental-vehicles"
                    element={<AdminRentalVehicleTypes />}
                  />
                  <Route
                    path="rental-vehicles/create"
                    element={<AdminRentalVehicleTypes mode="create" />}
                  />
                  <Route
                    path="rental-vehicles/edit/:id"
                    element={<AdminRentalVehicleTypes mode="edit" />}
                  />
                  <Route
                    path="rental-vehicles/view/:id"
                    element={<AdminRentalVehicleTypes mode="view" />}
                  />
                  <Route
                    path="rental-tracking"
                    element={<AdminRentalTracking />}
                  />
                  <Route
                    path="rental-tracking/:id"
                    element={<AdminRentalTrackingDetail />}
                  />
                  <Route
                    path="rental-requests"
                    element={<AdminRentalBookingRequests />}
                  />
                  <Route
                    path="rental-quotes"
                    element={<AdminRentalQuoteRequests />}
                  />
                  <Route
                    path="rental-packages"
                    element={<AdminRentalPackageTypes />}
                  />
                  <Route
                    path="rental-packages/create"
                    element={<AdminRentalPackageTypes mode="create" />}
                  />
                  <Route
                    path="rental-packages/edit/:id"
                    element={<AdminRentalPackageTypes mode="edit" />}
                  />
                  <Route path="set-price" element={<AdminSetPrices />} />
                  <Route
                    path="set-price/create"
                    element={<AdminSetPrices mode="create" />}
                  />
                  <Route
                    path="set-price/edit/:id"
                    element={<AdminSetPrices mode="edit" />}
                  />
                  <Route
                    path="set-price/packages/:id"
                    element={<AdminSetPackagePrices />}
                  />
                  <Route
                    path="set-price/packages/create/:id"
                    element={<AdminCreatePackagePrice mode="create" />}
                  />
                  <Route
                    path="set-price/packages/edit/:packageId"
                    element={<AdminCreatePackagePrice mode="edit" />}
                  />
                  <Route
                    path="package-pricing"
                    element={<AdminSetPackagePrices />}
                  />
                  <Route
                    path="package-pricing/create"
                    element={<AdminCreatePackagePrice mode="create" />}
                  />
                  <Route
                    path="package-pricing/edit/:packageId"
                    element={<AdminCreatePackagePrice mode="edit" />}
                  />
                  <Route
                    path="set-price/incentive/:id"
                    element={<AdminDriverIncentive />}
                  />
                  <Route
                    path="set-price/surge/:id"
                    element={<AdminSurgePricing />}
                  />
                  <Route path="goods-types" element={<AdminGoodsTypes />} />
                  <Route
                    path="goods-types/create"
                    element={<AdminGoodsTypes mode="create" />}
                  />
                  <Route
                    path="goods-types/edit/:id"
                    element={<AdminGoodsTypes mode="edit" />}
                  />
                </Route>
                <Route path="safety" element={<AdminSafetyCenter />} />
                <Route path="cms" element={<AdminCMSBuilder />} />
                <Route
                  path="settings/cms/header-footer"
                  element={<AdminHeaderFooter />}
                />
                <Route
                  path="support/ticket-title"
                  element={<AdminSupportTicketTitle />}
                />
                <Route
                  path="support/tickets"
                  element={<AdminSupportTickets />}
                />
                <Route path="*" element={<AdminSectionPlaceholder />} />

                {/* Report Module Routes */}
                <Route path="reports/user" element={<AdminUserReport />} />
                <Route path="reports/driver" element={<AdminDriverReport />} />
                <Route
                  path="reports/driver-duty"
                  element={<AdminDriverDutyReport />}
                />
                <Route path="reports/owner" element={<AdminOwnerReport />} />
                <Route
                  path="reports/finance"
                  element={<AdminFinanceReport />}
                />
                <Route
                  path="reports/fleet-finance"
                  element={<AdminFleetFinanceReport />}
                />

                {/* Masters Management */}
                <Route path="masters/languages" element={<AdminLanguages />} />
                <Route
                  path="masters/countries"
                  element={<AdminCountryManagement />}
                />
                <Route
                  path="masters/preferences"
                  element={<AdminPreferences />}
                />
                <Route
                  path="masters/roles"
                  element={<Navigate to="/taxi/admin/management/admins" replace />}
                />

                <Route
                  path="settings/business/general"
                  element={<AdminGeneralSettings />}
                />
                <Route
                  path="settings/business/customization"
                  element={<AdminCustomizationSettings />}
                />
                <Route
                  path="settings/business/transport-ride"
                  element={<AdminTransportRideSettings />}
                />
                <Route
                  path="settings/business/bid-ride"
                  element={<AdminBidRideSettings />}
                />

                <Route
                  path="settings/app/wallet"
                  element={<AdminWalletSettings />}
                />
                <Route path="settings/app/tip" element={<AdminTipSettings />} />
                <Route
                  path="settings/app/country"
                  element={<AdminCountryManagement />}
                />
                <Route
                  path="settings/app/onboard"
                  element={<AdminOnboardingScreens />}
                />

                <Route
                  path="settings/business/*"
                  element={<AdminGeneralSettings />}
                />
                <Route
                  path="settings/app/*"
                  element={<AdminGeneralSettings />}
                />

                <Route
                  path="settings/third-party/payment"
                  element={<AdminPaymentGateways />}
                />
                <Route
                  path="settings/third-party/sms"
                  element={<AdminSMSGateways />}
                />
                <Route
                  path="settings/third-party/firebase"
                  element={<AdminFirebaseSettings />}
                />
                <Route
                  path="settings/third-party/map-apis"
                  element={<AdminMapSettings />}
                />
                <Route
                  path="settings/third-party/mail"
                  element={<AdminMailSettings />}
                />
                <Route
                  path="settings/third-party/notification-channel"
                  element={<AdminNotificationChannels />}
                />
                <Route
                  path="settings/addons/dispatcher"
                  element={<AdminDispatcherAddons />}
                />
                <Route
                  path="settings/addons/*"
                  element={<AdminReportPlaceholder title="Addons Management" />}
                />
                <Route
                  path="settings/cms/*"
                  element={<AdminReportPlaceholder title="CMS Management" />}
                />
              </Route>

              <Route path="*" element={<Navigate to="/taxi" />} />
            </Routes>
          </Suspense>
        </MainLayout>
      </SettingsProvider>
    
  );
}

export default App;


