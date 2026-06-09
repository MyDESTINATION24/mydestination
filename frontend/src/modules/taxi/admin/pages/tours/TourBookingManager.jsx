import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search, Ticket, Wallet, Plus, Trash2, Calendar, FileText, User, X, Landmark } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminTourBookings, updateAdminTourBookingStatus, createAdminTourBooking, getAdminTours } from '../../services/toursService';

const statusTone = {
  confirmed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700',
};

const paymentStatusTone = {
  pending: 'bg-amber-50 text-amber-700',
  paid: 'bg-emerald-50 text-emerald-700',
  failed: 'bg-rose-50 text-rose-700',
  refunded: 'bg-sky-50 text-sky-700',
};

const inputClass =
  'w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-400/5';
const labelClass = 'mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400';

const TourBookingManager = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [newBooking, setNewBooking] = useState({
    tourId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    numberOfPassengers: 1,
    totalFare: 0,
    travelDate: '',
    paymentMethod: 'reserve',
    paymentStatus: 'pending',
    bookingStatus: 'confirmed',
    notes: '',
    passengerNames: [''],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, toursData] = await Promise.all([
        getAdminTourBookings(),
        getAdminTours(),
      ]);
      setBookings(bookingsData);
      setTours(toursData.filter(t => t.status === 'active'));
    } catch {
      toast.error('Failed to load tour bookings or tours.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBookings = useMemo(
    () =>
      bookings.filter((item) => {
        const matchesSearch = [
          item.customerName,
          item.bookingCode,
          item.tourName,
          item.customerPhone,
          item.customerEmail,
        ]
          .join(' ')
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());

        const matchesStatus = statusFilter === 'all' || item.bookingStatus === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [bookings, searchTerm, statusFilter]
  );

  const handleStatusChange = async (bookingId, nextStatus) => {
    try {
      await updateAdminTourBookingStatus(bookingId, nextStatus);
      toast.success('Booking status updated.');
      loadData();
    } catch {
      toast.error('Failed to update booking status.');
    }
  };

  const handlePaymentStatusChange = async (bookingId, nextPaymentStatus) => {
    try {
      // Fetch booking status to pass along
      const currentBooking = bookings.find(b => b.id === bookingId);
      await updateAdminTourBookingStatus(bookingId, currentBooking?.bookingStatus || 'confirmed', nextPaymentStatus);
      toast.success('Payment status updated.');
      loadData();
    } catch {
      toast.error('Failed to update payment status.');
    }
  };

  const metrics = useMemo(() => {
    const activeBookings = filteredBookings.filter((item) => item.bookingStatus !== 'cancelled');
    const revenue = activeBookings.reduce((sum, item) => sum + Number(item.totalFare || 0), 0);
    return {
      total: filteredBookings.length,
      active: activeBookings.length,
      revenue,
    };
  }, [filteredBookings]);

  // Pre-fill price when tour or passengers changes
  useEffect(() => {
    if (!newBooking.tourId) return;
    const selectedTour = tours.find(t => String(t.id) === String(newBooking.tourId));
    if (selectedTour) {
      let calcPrice = Number(selectedTour.price || 0);
      if (selectedTour.priceType === 'per_day') {
        // Assume duration days if format exists like "06 Days / 05 Nights", extract first number
        const daysMatch = selectedTour.duration.match(/(\d+)\s*Days?/i);
        const days = daysMatch ? Number(daysMatch[1]) : 1;
        calcPrice = calcPrice * days;
      }
      setNewBooking(prev => ({
        ...prev,
        totalFare: calcPrice * prev.numberOfPassengers,
      }));
    }
  }, [newBooking.tourId, newBooking.numberOfPassengers, tours]);

  // Modal passenger name array helpers
  const handlePassengerNameChange = (idx, val) => {
    const list = [...newBooking.passengerNames];
    list[idx] = val;
    setNewBooking(prev => ({ ...prev, passengerNames: list }));
  };

  const addPassengerField = () => {
    setNewBooking(prev => ({
      ...prev,
      passengerNames: [...prev.passengerNames, ''],
      numberOfPassengers: prev.numberOfPassengers + 1,
    }));
  };

  const removePassengerField = (idx) => {
    const list = newBooking.passengerNames.filter((_, i) => i !== idx);
    setNewBooking(prev => ({
      ...prev,
      passengerNames: list,
      numberOfPassengers: Math.max(1, prev.numberOfPassengers - 1),
    }));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!newBooking.tourId || !newBooking.customerName || !newBooking.travelDate) {
      toast.error('Tour, customer name, and travel date are required.');
      return;
    }

    try {
      setSubmittingBooking(true);
      const cleanedPassengers = newBooking.passengerNames.filter(name => name.trim() !== '');
      await createAdminTourBooking({
        ...newBooking,
        passengerNames: cleanedPassengers,
      });
      toast.success('Tour booking created successfully.');
      setShowModal(false);
      // Reset State
      setNewBooking({
        tourId: '',
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        numberOfPassengers: 1,
        totalFare: 0,
        travelDate: '',
        paymentMethod: 'reserve',
        paymentStatus: 'pending',
        bookingStatus: 'confirmed',
        notes: '',
        passengerNames: [''],
      });
      loadData();
    } catch {
      toast.error('Failed to create booking.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F9] font-sans">
      <div className="border-b border-gray-100 bg-white px-8 py-5 flex items-center justify-between">
        <h1 className="text-[14px] font-black uppercase tracking-tight text-slate-800">Tour Bookings</h1>
        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400">
          <span>Tours</span>
          <ChevronRight size={12} className="opacity-30" />
          <span className="text-gray-500">Bookings</span>
        </div>
      </div>

      <div className="p-8 lg:p-10 space-y-6">
        
        {/* Metrics Summary */}
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Bookings</p>
                <p className="mt-3 text-3xl font-black text-slate-900">{metrics.total}</p>
              </div>
              <div className="rounded-2xl bg-sky-50 p-3 text-sky-700">
                <Ticket size={18} />
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Bookings</p>
                <p className="mt-3 text-3xl font-black text-slate-900">{metrics.active}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <Calendar size={18} />
              </div>
            </div>
          </div>
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Active Revenue</p>
                <p className="mt-3 text-3xl font-black text-slate-900">Rs. {metrics.revenue.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
                <Wallet size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Oversight */}
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-8 py-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Booking Oversight</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Monitor pilgrim yatra reservations, traveler passenger details, and payment/booking workflows.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search reservation..."
                  className="h-11 rounded-full border border-slate-200 bg-white pl-9 pr-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-slate-400"
              >
                <option value="all">All Booking Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 shrink-0"
              >
                <Plus size={16} /> Add Booking
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr className="text-left text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Booking code</th>
                  <th className="px-6 py-4">Tour name</th>
                  <th className="px-6 py-4">Customer info</th>
                  <th className="px-6 py-4">Travel Date</th>
                  <th className="px-6 py-4">Passengers</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Booking Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td className="px-6 py-10 text-sm font-semibold text-slate-500" colSpan={8}>Loading bookings...</td>
                  </tr>
                ) : filteredBookings.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-sm font-semibold text-slate-500" colSpan={8}>No tour bookings found.</td>
                  </tr>
                ) : (
                  filteredBookings.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 text-slate-700">
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-900">{item.bookingCode}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.paymentMethod}</p>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold">
                        {item.tourName}
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-sm font-black text-slate-900">{item.customerName}</p>
                        <p className="text-xs font-semibold text-slate-500">{item.customerPhone || item.customerEmail || '--'}</p>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-slate-600">
                        {item.travelDate ? new Date(item.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                      </td>
                      <td className="px-6 py-5 text-sm font-bold">
                        {item.numberOfPassengers} pax
                      </td>
                      <td className="px-6 py-5 text-sm font-black text-slate-900">
                        Rs. {Number(item.totalFare || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={item.paymentStatus}
                          onChange={(event) => handlePaymentStatusChange(item.id, event.target.value)}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider outline-none ${paymentStatusTone[item.paymentStatus] || 'bg-slate-100 text-slate-600'}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
                        </select>
                      </td>
                      <td className="px-6 py-5">
                        <select
                          value={item.bookingStatus}
                          onChange={(event) => handleStatusChange(item.id, event.target.value)}
                          className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wider outline-none ${statusTone[item.bookingStatus] || 'bg-slate-100 text-slate-600'}`}
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Booking Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-3xl rounded-[32px] border border-slate-100 bg-white p-8 shadow-2xl animate-in scale-in duration-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-6 top-6 rounded-full border border-slate-100 p-2 text-slate-400 hover:text-slate-900 transition hover:bg-slate-50"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-700">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Add Manual Tour Booking</h3>
                <p className="text-sm font-medium text-slate-500">Record a custom pilgrimage booking directly into the system database.</p>
              </div>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>Select Tour Package</label>
                  <select
                    className={inputClass}
                    value={newBooking.tourId}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, tourId: e.target.value }))}
                    required
                  >
                    <option value="">-- Choose Tour --</option>
                    {tours.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.duration})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Travel Date</label>
                  <input
                    type="date"
                    className={inputClass}
                    value={newBooking.travelDate}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, travelDate: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Customer Name</label>
                  <input
                    className={inputClass}
                    value={newBooking.customerName}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Enter customer full name"
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Customer Phone</label>
                  <input
                    className={inputClass}
                    value={newBooking.customerPhone}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="e.g. +91 9999988888"
                  />
                </div>

                <div>
                  <label className={labelClass}>Customer Email</label>
                  <input
                    type="email"
                    className={inputClass}
                    value={newBooking.customerEmail}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="e.g. pilgrim@example.com"
                  />
                </div>

                <div>
                  <label className={labelClass}>Number of Passengers</label>
                  <input
                    type="number"
                    min="1"
                    className={inputClass}
                    value={newBooking.numberOfPassengers}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, numberOfPassengers: parseInt(e.target.value) || 1 }))}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Total Fare Charged (INR)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    value={newBooking.totalFare}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, totalFare: parseFloat(e.target.value) || 0 }))}
                    required
                  />
                  <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pre-fills automatically, editable for custom quotes</p>
                </div>

                <div>
                  <label className={labelClass}>Payment Method</label>
                  <select
                    className={inputClass}
                    value={newBooking.paymentMethod}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <option value="reserve">Reserve (Cash/Manual)</option>
                    <option value="online">Online Payment Gateway</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Payment Status</label>
                  <select
                    className={inputClass}
                    value={newBooking.paymentStatus}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Booking Status</label>
                  <select
                    className={inputClass}
                    value={newBooking.bookingStatus}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, bookingStatus: e.target.value }))}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Admin Notes</label>
                  <textarea
                    className={`${inputClass} min-h-16`}
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter special requests, helicopter type preference, stay needs..."
                  />
                </div>
              </div>

              {/* Passenger List */}
              <div className="border-t border-slate-100 pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-slate-900">Passenger Roster Details</h4>
                  <button
                    type="button"
                    onClick={addPassengerField}
                    className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700 hover:bg-indigo-100"
                  >
                    <Plus size={14} /> Add Passenger
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {newBooking.passengerNames.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          className={`${inputClass} pl-9`}
                          value={name}
                          onChange={(e) => handlePassengerNameChange(idx, e.target.value)}
                          placeholder={`Passenger #${idx + 1} Name`}
                        />
                      </div>
                      {newBooking.passengerNames.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassengerField(idx)}
                          className="text-slate-400 hover:text-rose-500 shrink-0"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBooking}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
                >
                  <Save size={16} />
                  {submittingBooking ? 'Saving...' : 'Add Reservation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourBookingManager;
