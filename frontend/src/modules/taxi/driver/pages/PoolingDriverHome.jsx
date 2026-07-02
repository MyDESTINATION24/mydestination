import React, { useEffect, useState } from 'react';
import {
  Car,
  MapPin,
  User,
  Calendar,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  LogOut,
  RefreshCcw,
  ShieldAlert,
  List,
  Info,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { clearDriverAuthState } from '../services/registrationService';
import { getPoolingDashboard, updatePoolingBookingStatus } from '../services/poolingDriverService';

const PoolingDriverHome = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'routes' | 'vehicle'

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await getPoolingDashboard();
      setData(response?.data?.data || response?.data || response);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.message || 'Failed to load dashboard data');
      if (err?.response?.status === 401) {
        handleLogout();
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    clearDriverAuthState();
    toast.success('Logged out successfully');
    navigate('/taxi/driver/login', { replace: true });
  };

  const handleUpdateStatus = async (bookingId, nextStatus) => {
    setUpdatingId(bookingId);
    try {
      await updatePoolingBookingStatus(bookingId, nextStatus);
      toast.success(`Booking status updated to ${nextStatus}`);
      await fetchDashboardData(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update booking status');
    } finally {
      setUpdatingId(null);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <span className="w-12 h-12 border-4 border-[#312E81]/30 border-t-[#312E81] rounded-full animate-spin"></span>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-rose-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Failed to Load Dashboard</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">{error}</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => fetchDashboardData()}
              className="w-full bg-[#312E81] hover:bg-[#252361] text-white py-4 rounded-2xl font-bold transition-all"
            >
              Try Again
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-4 rounded-2xl font-bold transition-all"
            >
              Sign In Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const {
    driver,
    vehicle,
    routes,
    bookings,
    totalEarnings,
    completedTripsCount,
    totalBookingsCount
  } = data || {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#312E81] text-white flex items-center justify-center font-black text-lg">
              {driver?.name?.charAt(0) || 'P'}
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 leading-none">{driver?.name}</h1>
              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Pooling Captain</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboardData()}
              className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
              title="Refresh"
            >
              <RefreshCcw size={18} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Earnings</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-black text-slate-900">{formatCurrency(totalEarnings || 0)}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mt-3">
              <DollarSign size={16} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Completed Trips</span>
            <span className="text-2xl font-black text-slate-900 mt-2">{completedTripsCount || 0}</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mt-3">
              <CheckCircle size={16} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Bookings</span>
            <span className="text-2xl font-black text-slate-900 mt-2">{totalBookingsCount || 0}</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mt-3">
              <List size={16} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Assigned Vehicle</span>
            <span className="text-[13px] font-black text-slate-900 mt-2 truncate">
              {vehicle ? `${vehicle.name} (${vehicle.vehicleNumber})` : 'Not Assigned'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mt-3">
              <Car size={16} />
            </div>
          </div>
        </section>

        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'bookings'
                ? 'border-[#312E81] text-[#312E81]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Passenger Bookings
          </button>
          <button
            onClick={() => setActiveTab('routes')}
            className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'routes'
                ? 'border-[#312E81] text-[#312E81]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            My Routes
          </button>
          <button
            onClick={() => setActiveTab('vehicle')}
            className={`pb-4 px-2 text-sm font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'vehicle'
                ? 'border-[#312E81] text-[#312E81]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Vehicle Info
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'bookings' && (
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-black text-slate-900">Passenger Reservations</h2>
              <span className="bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-full font-bold">
                {bookings?.length || 0} Total
              </span>
            </div>

            {(!bookings || bookings.length === 0) ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User size={24} />
                </div>
                <h3 className="text-md font-black text-slate-700">No Reservations Yet</h3>
                <p className="text-slate-400 text-sm mt-1">Bookings for your assigned route will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg uppercase tracking-wider">
                          {booking.bookingId}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          booking.paymentStatus === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {booking.paymentStatus}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                          booking.bookingStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : booking.bookingStatus === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border-rose-100'
                              : booking.bookingStatus === 'no_show'
                                ? 'bg-slate-50 text-slate-700 border-slate-100'
                                : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {booking.bookingStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-slate-400" />
                          <span>{booking.user?.name || 'Customer'}</span>
                        </div>
                        <div className="text-slate-400 font-medium">
                          {booking.user?.phone}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Calendar size={13} />
                        <span>{formatDate(booking.travelDate)}</span>
                        <span className="text-slate-300">•</span>
                        <Clock size={13} />
                        <span>Schedule: {booking.scheduleId}</span>
                        <span className="text-slate-300">•</span>
                        <Users size={13} />
                        <span>Seats: {booking.seatsBooked} ({booking.selectedSeats?.join(', ')})</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-fit">
                        <span className="text-indigo-600">{booking.pickupLabel}</span>
                        <ArrowRight size={12} className="text-slate-400" />
                        <span className="text-emerald-600">{booking.dropLabel}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:flex-col md:items-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Fare</div>
                        <div className="text-lg font-black text-slate-900">{formatCurrency(booking.fare)}</div>
                      </div>

                      {booking.bookingStatus === 'confirmed' && (
                        <div className="flex gap-2">
                          <button
                            disabled={updatingId === booking.id}
                            onClick={() => handleUpdateStatus(booking.id, 'completed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                          >
                            Complete
                          </button>
                          <button
                            disabled={updatingId === booking.id}
                            onClick={() => handleUpdateStatus(booking.id, 'no_show')}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                          >
                            No Show
                          </button>
                          <button
                            disabled={updatingId === booking.id}
                            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'routes' && (
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-black text-slate-900 mb-6">Assigned Pooling Routes</h2>

            {(!routes || routes.length === 0) ? (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin size={24} />
                </div>
                <h3 className="text-md font-black text-slate-700">No Assigned Routes</h3>
                <p className="text-slate-400 text-sm mt-1">Contact your owner to assign routes to your vehicle.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {routes.map((route) => (
                  <div key={route.id} className="p-6 rounded-2xl border border-slate-100 shadow-sm bg-white">
                    <div className="flex justify-between items-start flex-wrap gap-2 mb-4">
                      <div>
                        <h3 className="text-md font-black text-slate-900">{route.routeName}</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Route Code: {route.routeCode || 'N/A'}</p>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-xl text-xs font-black">
                        Fare per seat: {formatCurrency(route.farePerSeat)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Timetable / Schedules</h4>
                        {(!route.schedules || route.schedules.length === 0) ? (
                          <p className="text-xs text-slate-400">No active schedules configured.</p>
                        ) : (
                          <div className="space-y-2">
                            {route.schedules.map((sched, sIdx) => (
                              <div key={sched.id || sIdx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-bold text-slate-700">
                                <div>{sched.label || `Schedule ${sIdx + 1}`}</div>
                                <div className="flex items-center gap-1 text-slate-900 font-black">
                                  <span>{sched.departureTime}</span>
                                  <ArrowRight size={12} className="text-slate-400" />
                                  <span>{sched.arrivalTime}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Route Stations</h4>
                        <div className="relative pl-5 border-l-2 border-slate-100 space-y-4 ml-1">
                          <div className="relative">
                            <span className="absolute -left-6.5 top-0.5 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />
                            <div className="text-xs font-black text-slate-900">{route.originLabel}</div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Start Point</span>
                          </div>

                          {route.stops?.map((stop, sIdx) => (
                            <div key={stop.id || sIdx} className="relative">
                              <span className="absolute -left-6.5 top-0.5 w-3.5 h-3.5 rounded-full bg-slate-400 border-2 border-white shadow-sm" />
                              <div className="text-xs font-black text-slate-800">{stop.name}</div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stop • {stop.etaMinutes} mins</span>
                            </div>
                          ))}

                          <div className="relative">
                            <span className="absolute -left-6.5 top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-600 border-2 border-white shadow-sm" />
                            <div className="text-xs font-black text-slate-900">{route.destinationLabel}</div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End Point</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'vehicle' && (
          <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-lg font-black text-slate-900 mb-6">Assigned Vehicle Details</h2>

            {!vehicle ? (
              <div className="text-center py-16 px-4 bg-slate-50/50 rounded-2xl">
                <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car size={24} />
                </div>
                <h3 className="text-md font-black text-slate-700">No Vehicle Assigned</h3>
                <p className="text-slate-400 text-sm mt-1">You must have an assigned vehicle to get bookings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900">{vehicle.name}</h3>
                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">{vehicle.vehicleModel}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Plate Number</span>
                      <span className="text-md font-black text-slate-900 mt-1 block uppercase">{vehicle.vehicleNumber}</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Color</span>
                      <span className="text-md font-black text-slate-900 mt-1 block capitalize">{vehicle.color || 'N/A'}</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Capacity</span>
                      <span className="text-md font-black text-slate-900 mt-1 block">{vehicle.capacity} Seats</span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</span>
                      <span className="text-md font-black text-emerald-600 mt-1 block capitalize">{vehicle.status}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#312E81]/5 rounded-3xl p-6 border border-[#312E81]/10 text-center">
                  <Car className="text-[#312E81] mx-auto mb-4" size={48} />
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Active Fleet Vehicle</h4>
                  <p className="text-slate-400 text-xs mt-2 max-w-xs mx-auto leading-relaxed">
                    This vehicle has pooling enabled. Bookings made on the route assigned to this vehicle will be automatically routed to you.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default PoolingDriverHome;
