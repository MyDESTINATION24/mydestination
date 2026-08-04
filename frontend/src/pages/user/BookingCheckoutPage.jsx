import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Users, MapPin, CreditCard,
  ShieldCheck, Lock, ChevronRight, Building, CheckCircle, Tag, Wallet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { bookingService, paymentService } from '../../services/apiService';
import walletService from '../../services/walletService';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    resolve(true); // Mocking Razorpay load since we use PhonePe
  });
};

const BookingCheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Data passed from PropertyDetailsPage
  const {
    property,
    selectedRoom,
    dates,
    guests,
    priceBreakdown,
    taxRate
  } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [uiSettings, setUiSettings] = useState(null);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${API_BASE}/hotel-ui/settings/global-default`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setUiSettings(data.data);
          if (data.data.theme?.borderRadius) {
            document.documentElement.style.setProperty('--card-radius', data.data.theme.borderRadius);
            document.documentElement.style.setProperty('--hotel-card-radius', data.data.theme.borderRadius);
            document.documentElement.style.setProperty('--border-radius', data.data.theme.borderRadius);
          }
        }
      })
      .catch(err => console.error("Failed to load hotel UI settings in BookingCheckoutPage", err));
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const data = await walletService.getWallet({ viewAs: 'user' });
      if (data.success && data.wallet) {
        setWalletBalance(data.wallet.balance);
      }
    } catch (error) {
      console.error("Failed to fetch wallet:", error);
    }
  };

  const verifyPhonePePayment = async (txnId, bookingId) => {
    setLoading(true);
    try {
      const verifyRes = await paymentService.verifyPayment({
        phonepe_txn_id: txnId,
        bookingId: bookingId
      });
      if (verifyRes.success) {
        toast.success("Payment Successful!");
        navigate(`/booking/${verifyRes.booking?._id || bookingId}`, { state: { booking: verifyRes.booking, animate: true } });
      } else {
        toast.error(verifyRes.message || "Payment Verification Failed");
        navigate('/');
      }
    } catch (err) {
      console.error("Payment Verification Error:", err);
      toast.error("Payment verification failed.");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phonepeTxn = urlParams.get('phonepe_txn');
    const bookingId = urlParams.get('bookingId');
    
    if (phonepeTxn && bookingId) {
      verifyPhonePePayment(phonepeTxn, bookingId);
      return;
    }

    if (!property || !dates) {
      toast.error("Invalid booking details");
      navigate('/');
      return;
    }
    fetchWalletBalance();
  }, [property, dates, navigate]);



  // If verifying payment, show a loading screen instead of crashing or returning null
  const urlParams = new URLSearchParams(window.location.search);
  const isVerifying = urlParams.get('phonepe_txn');

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[var(--color-hotel-bg)] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-surface border-t-transparent rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold text-surface mb-2">Verifying Payment...</h2>
        <p className="text-gray-500 text-sm">Please do not close or refresh this page.</p>
      </div>
    );
  }

  if (!property || !dates) return null;

  const baseTotalAmount = priceBreakdown?.grandTotal || 0;

  // Prepaid Calculations
  let prepaidDiscountAmount = 0;
  let discountedTotalAmount = baseTotalAmount;
  let advanceAmount = baseTotalAmount;
  let hotelAmount = 0;

  if (paymentMethod === 'prepaid') {
    prepaidDiscountAmount = Math.floor(baseTotalAmount * 0.05);
    discountedTotalAmount = baseTotalAmount - prepaidDiscountAmount;
    advanceAmount = Math.floor(discountedTotalAmount * 0.30);
    hotelAmount = discountedTotalAmount - advanceAmount;
  }

  // Calculate payments
  let walletDeduction = 0;
  let totalAmountForWallet = paymentMethod === 'prepaid' ? advanceAmount : baseTotalAmount;
  let remainingPayable = totalAmountForWallet;

  if (useWallet && ['online', 'prepaid'].includes(paymentMethod)) {
    walletDeduction = Math.min(walletBalance, totalAmountForWallet);
    remainingPayable = totalAmountForWallet - walletDeduction;
  }

  const handleConfirmBooking = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error("Please login to continue");
      navigate('/login', { state: { from: location } });
      return;
    }

    setLoading(true);

    const payload = {
      propertyId: property._id,
      roomTypeId: selectedRoom._id,
      checkInDate: dates.checkIn,
      checkOutDate: dates.checkOut,
      guests: {
        adults: guests.adults,
        children: guests.children,
        rooms: guests.rooms || 1,
        extraAdults: priceBreakdown?.extraAdultsCount || 0,
        extraChildren: priceBreakdown?.extraChildrenCount || 0
      },
      bookingUnit: selectedRoom.inventoryType || (['Hostel', 'PG'].includes(property.propertyType) ? 'bed' : 'room'),
      couponCode: priceBreakdown?.couponCode || null,
      paymentMethod: paymentMethod === 'online' ? 'razorpay' : paymentMethod,
      paymentStatus: 'pending',
      totalAmount: baseTotalAmount,
      // Wallet Info
      useWallet: useWallet && ['online', 'prepaid'].includes(paymentMethod),
      walletDeduction: (useWallet && ['online', 'prepaid'].includes(paymentMethod)) ? walletDeduction : 0
    };

    try {
      if (paymentMethod === 'pay_at_hotel') {
        // --- PAY AT HOTEL FLOW ---
        const response = await bookingService.create(payload);
        if (response.success && response.booking) {
          toast.success("Booking Confirmed!");
          navigate(`/booking/${response.booking._id || response.booking.bookingId}`, { state: { booking: response.booking, animate: true } });
        } else {
          throw new Error(response.message || "Booking failed");
        }

      } else if (paymentMethod === 'online' || paymentMethod === 'prepaid') {
        // --- ONLINE FLOW (Wallet + Razorpay) ---

        // Case A: Full Wallet Payment (remainingPayable <= 0)
        if (remainingPayable <= 0) {
          const response = await bookingService.create(payload);
          // If full wallet payment, backend should create booking directly and mark paid
          if (response.success && response.booking) {
            toast.success("Paid via Wallet! Booking Confirmed.");
            navigate(`/booking/${response.booking._id}`, { state: { booking: response.booking, animate: true } });
            return;
          } else {
            throw new Error(response.message || "Wallet payment failed");
          }
        }

        // Case B: PhonePe (with or without Wallet)
        // Create Order (Backend will deduct wallet amount from order amount)
        const bookingRes = await bookingService.create(payload);

        if (!bookingRes.success) throw new Error(bookingRes.message || "Failed to initialize booking");

        if (bookingRes.paymentRequired && bookingRes.url) {
          // Redirect to PhonePe
          window.location.href = bookingRes.url;
          return;
        } else if (bookingRes.success) {
           navigate(`/booking/${bookingRes.booking._id}`, { state: { booking: bookingRes.booking, animate: true } });
        }
      }
    } catch (error) {
      console.error("Booking Error:", error);
      toast.error(error.message || "Booking failed.");
    } finally {
      setLoading(false);
    }
  };

  const getContrastTextColor = (hexColor) => {
    if (!hexColor || typeof hexColor !== 'string') return '#FFFFFF';
    const hex = hexColor.replace('#', '');
    if (hex.length !== 6) return '#FFFFFF';
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#0F172A' : '#FFFFFF';
  };

  const primaryThemeColor = uiSettings?.theme?.primaryColor || '#5F8575';
  const useGradientTheme = uiSettings?.theme?.useGradient !== false;
  const gradientStartTheme = uiSettings?.theme?.gradientStart || primaryThemeColor;
  const gradientEndTheme = uiSettings?.theme?.gradientEnd || primaryThemeColor;

  const dynamicThemeBg = useGradientTheme
    ? `linear-gradient(135deg, ${gradientStartTheme} 0%, ${gradientEndTheme} 100%)`
    : primaryThemeColor;

  const buttonTextColor = getContrastTextColor(gradientStartTheme);
  const isBrightTheme = getContrastTextColor(gradientStartTheme) === '#0F172A';
  const titleTextColor = uiSettings?.theme?.secondaryColor || '#0F172A';
  const headerTextColor = titleTextColor;

  return (
    <div className="min-h-screen pb-20 md:pb-10" style={{ backgroundColor: uiSettings?.theme?.backgroundColor || 'var(--color-hotel-bg)' }}>
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 pt-14 md:pt-0">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
            <ArrowLeft size={20} style={{ color: headerTextColor }} />
          </button>
          <h1 className="text-lg font-bold" style={{ color: headerTextColor }}>Review & Pay</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* 1. Property Summary */}
        <div className="rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4" style={{ backgroundColor: uiSettings?.theme?.cardBgColor || '#ffffff' }}>
          <div className="w-24 h-24 bg-gray-200 rounded-xl overflow-hidden shrink-0">
            <img
              src={property.images?.cover || property.coverImage || "https://via.placeholder.com/150"}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{property.propertyType}</span>
            <h2 className="font-bold text-slate-900 leading-tight mb-1">{property.name}</h2>
            <p className="text-xs text-slate-600 mb-2">{property.address?.city || property.address}, {property.address?.state}</p>
            <div className="flex items-center gap-1">
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                {property.avgRating || 'New'} ★
              </span>
            </div>
          </div>
        </div>

        {/* 2. Trip & Price Details */}
        <div className="rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5" style={{ backgroundColor: uiSettings?.theme?.cardBgColor || '#ffffff' }}>
          <div>
            <h3 className="font-black mb-3 text-sm text-slate-900 uppercase tracking-wider">Your Trip</h3>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm text-slate-900 font-extrabold">
                <span>{priceBreakdown?.nights} Nights</span>
                <span className="text-slate-400">•</span>
                <span>{guests.adults} Adults, {guests.children} Children</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold border border-emerald-200">
                  {selectedRoom.type || selectedRoom.name}
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-700 font-medium">
                {dates.checkIn} - {dates.checkOut} | {guests.rooms} Room(s)
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/60 pt-5">
            <h3 className="font-black mb-4 text-sm text-slate-900 uppercase tracking-wider">Price Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-slate-800 font-medium">
                <span>Base Price ({priceBreakdown?.nights} nights)</span>
                <span className="font-bold text-slate-900">₹{priceBreakdown?.totalBasePrice?.toLocaleString()}</span>
              </div>
              {(priceBreakdown?.totalExtraAdultCharge > 0) && (
                <div className="flex justify-between text-sm text-slate-800 font-medium">
                  <span>Extra Adults Charges</span>
                  <span className="font-bold text-slate-900">₹{priceBreakdown.totalExtraAdultCharge.toLocaleString()}</span>
                </div>
              )}
              {(priceBreakdown?.totalExtraChildCharge > 0) && (
                <div className="flex justify-between text-sm text-slate-800 font-medium">
                  <span>Extra Children Charges</span>
                  <span className="font-bold text-slate-900">₹{priceBreakdown.totalExtraChildCharge.toLocaleString()}</span>
                </div>
              )}
              {(priceBreakdown?.discountAmount > 0) && (
                <div className="flex justify-between text-sm text-emerald-800 font-semibold">
                  <span className="flex items-center gap-1"><Tag size={12} /> Coupon Discount</span>
                  <span>- ₹{priceBreakdown.discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-slate-800 font-medium">
                <span>Taxes & Fees ({taxRate || 0}%)</span>
                <span className="font-bold text-slate-900">₹{priceBreakdown?.taxAmount?.toLocaleString()}</span>
              </div>

              {(useWallet && ['online', 'prepaid'].includes(paymentMethod) && walletDeduction > 0) && (
                <div className="flex justify-between text-sm text-blue-800 font-semibold">
                  <span className="flex items-center gap-1"><Wallet size={12} /> Wallet Balance Used</span>
                  <span>- ₹{walletDeduction.toLocaleString()}</span>
                </div>
              )}

              {paymentMethod === 'prepaid' && (
                <>
                  <div className="flex justify-between text-sm text-emerald-800 font-semibold border-t border-slate-200/60 pt-2">
                    <span className="flex items-center gap-1"><Tag size={12} /> Prepaid Discount (5%)</span>
                    <span>- ₹{prepaidDiscountAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-900">
                    <span className="font-medium">New Total</span>
                    <div>
                      <span className="line-through text-xs text-slate-500 mr-2">₹{baseTotalAmount.toLocaleString()}</span>
                      <span className="font-bold text-slate-900">₹{discountedTotalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-slate-800 font-medium">
                    <span>Advance Payable Now (30%)</span>
                    <span className="font-bold text-slate-900">₹{advanceAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-800 font-medium">
                    <span>Balance Payable at Hotel</span>
                    <span className="font-bold text-slate-900">₹{hotelAmount.toLocaleString()}</span>
                  </div>
                </>
              )}

              <div className="border-t border-slate-200/80 pt-4 flex justify-between items-center">
                <span className="font-black text-slate-900 text-base">Total Payable Now</span>
                <span className="text-2xl font-black text-slate-900">
                  ₹{remainingPayable.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Wallet & Payment Options */}
        <div className="rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5" style={{ backgroundColor: uiSettings?.theme?.cardBgColor || '#ffffff' }}>
          {/* Wallet Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase tracking-wider">
                <Wallet size={18} className="text-blue-600" />
                Use Wallet Balance
              </h3>
              <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg border border-blue-200">
                Available: ₹{walletBalance.toLocaleString()}
              </span>
            </div>

            <label className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${useWallet && ['online', 'prepaid'].includes(paymentMethod) ? 'border-blue-600 bg-blue-50/60' : 'border-slate-200/80 bg-white/60'}`}>
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300 pointer-events-none"
                  checked={useWallet}
                  disabled={walletBalance <= 0 || !['online', 'prepaid'].includes(paymentMethod)}
                  onChange={() => { }} // Handled by parent div if needed, but safer on input change
                />
                <div
                  className="absolute inset-0 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!['online', 'prepaid'].includes(paymentMethod)) {
                      toast.error("Wallet can only be used with Online or Prepaid Payment");
                      return;
                    }
                    if (walletBalance > 0) setUseWallet(!useWallet);
                  }}
                ></div>
              </div>
              <div className="flex-1 opacity-100">
                <p className="text-sm font-bold text-slate-900">Pay using Wallet</p>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  {!['online', 'prepaid'].includes(paymentMethod)
                    ? "Select an online payment method to use wallet balance."
                    : walletBalance > 0
                      ? `Use ₹${Math.min(walletBalance, totalAmountForWallet).toLocaleString()} from your wallet.`
                      : "Insufficient balance."}
                </p>
              </div>
            </label>
          </div>

          {/* Payment Options Section */}
          <div className="border-t border-slate-200/60 pt-5">
            <h3 className="font-black text-slate-900 mb-4 text-sm uppercase tracking-wider">Payment Method</h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200 bg-white/80">
              {/* Option 1: Pay at Hotel */}
              <label className={`flex items-start gap-3 p-3.5 cursor-pointer transition-all ${paymentMethod === 'pay_at_hotel' ? 'bg-slate-100/90 font-bold border-l-4 border-l-slate-900' : 'bg-white'}`}>
                <input
                  type="radio"
                  name="payment"
                  className="mt-1"
                  checked={paymentMethod === 'pay_at_hotel'}
                  onChange={() => {
                    setPaymentMethod('pay_at_hotel');
                    setUseWallet(false); // Reset wallet usage if switching to Pay at Hotel 
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-slate-900 text-sm">Pay at Hotel</span>
                    <Building size={16} className="text-slate-600" />
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-normal">
                    Pay full amount at check-in. No prepayment needed.
                  </p>
                </div>
              </label>

              {/* Option 2: Prepaid */}
              <label className={`flex items-start gap-3 p-3.5 cursor-pointer transition-all ${paymentMethod === 'prepaid' ? 'bg-emerald-50/60 font-bold border-l-4 border-l-emerald-600' : 'bg-white'}`}>
                <input
                  type="radio"
                  name="payment"
                  className="mt-1"
                  checked={paymentMethod === 'prepaid'}
                  onChange={() => setPaymentMethod('prepaid')}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Prepaid</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-emerald-200">Save 5%</span>
                    </div>
                    <Tag size={16} className="text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-normal">
                    Pay 30% now (save 5%), remaining 70% at the hotel.
                  </p>
                </div>
              </label>

              {/* Option 3: Pay Now */}
              <label className={`flex items-start gap-3 p-3.5 cursor-pointer transition-all ${paymentMethod === 'online' ? 'bg-blue-50/60 font-bold border-l-4 border-l-blue-600' : 'bg-white'}`}>
                <input
                  type="radio"
                  name="payment"
                  className="mt-1"
                  checked={paymentMethod === 'online'}
                  onChange={() => setPaymentMethod('online')}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Pay Now</span>
                      <span className="bg-blue-100 text-blue-800 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-blue-200">Secure</span>
                    </div>
                    <CreditCard size={16} className="text-blue-600" />
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-normal">
                    Secure online payment via UPI, Cards, Netbanking.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="pt-2">
          <button
            onClick={handleConfirmBooking}
            disabled={loading}
            className="w-full font-bold text-lg py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            style={{ background: dynamicThemeBg, color: buttonTextColor }}
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                {['online', 'prepaid'].includes(paymentMethod) ? 'Pay & Book' : 'Confirm Booking'}
                <ChevronRight size={20} />
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-3 flex items-center justify-center gap-1">
            <Lock size={10} />
            Your data is secure. By booking, you agree to our Terms.
          </p>
        </div>

      </div>
    </div>
  );
};

export default BookingCheckoutPage;
