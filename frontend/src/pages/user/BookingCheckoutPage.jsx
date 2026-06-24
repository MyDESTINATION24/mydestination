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

  return (
    <div className="min-h-screen bg-[var(--color-hotel-bg)] pb-20 md:pb-10">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30 pt-14 md:pt-0">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-surface/80" />
          </button>
          <h1 className="text-lg font-bold text-surface">Review & Pay</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* 1. Property Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4">
          <div className="w-24 h-24 bg-gray-200 rounded-xl overflow-hidden shrink-0">
            <img
              src={property.images?.cover || property.coverImage || "https://via.placeholder.com/150"}
              alt={property.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{property.propertyType}</span>
            <h2 className="font-bold text-surface leading-tight mb-1">{property.name}</h2>
            <p className="text-xs text-gray-500 mb-2">{property.address?.city || property.address}, {property.address?.state}</p>
            <div className="flex items-center gap-1">
              <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded">
                {property.avgRating || 'New'} ★
              </span>
            </div>
          </div>
        </div>

        {/* 2. Trip Details */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-surface mb-4 text-sm">Your Trip</h3>
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Dates</p>
              <p className="text-sm font-bold text-surface">{priceBreakdown?.nights} Nights</p>
              <p className="text-xs text-gray-600">{dates.checkIn} - {dates.checkOut}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Guests</p>
              <p className="text-sm font-bold text-surface">{guests.adults} Adults, {guests.children} Children</p>
              <p className="text-xs text-gray-600">{guests.rooms} Room(s)</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-gray-500 font-medium mb-1">Room Type</p>
              <p className="text-sm font-bold text-surface">{selectedRoom.type || selectedRoom.name}</p>
            </div>
          </div>
        </div>

        {/* 3. Price Breakdown */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-surface mb-4 text-sm">Price Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Base Price ({priceBreakdown?.nights} nights)</span>
              <span>₹{priceBreakdown?.totalBasePrice?.toLocaleString()}</span>
            </div>
            {(priceBreakdown?.totalExtraAdultCharge > 0) && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Extra Adults Charges</span>
                <span>₹{priceBreakdown.totalExtraAdultCharge.toLocaleString()}</span>
              </div>
            )}
            {(priceBreakdown?.totalExtraChildCharge > 0) && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Extra Children Charges</span>
                <span>₹{priceBreakdown.totalExtraChildCharge.toLocaleString()}</span>
              </div>
            )}
            {(priceBreakdown?.discountAmount > 0) && (
              <div className="flex justify-between text-sm text-green-700 font-medium">
                <span className="flex items-center gap-1"><Tag size={12} /> Coupon Discount</span>
                <span>- ₹{priceBreakdown.discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Taxes & Fees ({taxRate || 0}%)</span>
              <span>₹{priceBreakdown?.taxAmount?.toLocaleString()}</span>
            </div>

            {(useWallet && ['online', 'prepaid'].includes(paymentMethod) && walletDeduction > 0) && (
              <div className="flex justify-between text-sm text-blue-700 font-medium">
                <span className="flex items-center gap-1"><Wallet size={12} /> Wallet Balance Used</span>
                <span>- ₹{walletDeduction.toLocaleString()}</span>
              </div>
            )}

            {paymentMethod === 'prepaid' && (
              <>
                <div className="flex justify-between text-sm text-green-700 font-medium border-t border-gray-100 pt-2">
                  <span className="flex items-center gap-1"><Tag size={12} /> Prepaid Discount (5%)</span>
                  <span>- ₹{prepaidDiscountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-surface">
                  <span>New Total</span>
                  <span className="line-through text-xs text-gray-400 mr-2">₹{baseTotalAmount.toLocaleString()}</span>
                  <span className="font-bold">₹{discountedTotalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Advance Payable Now (30%)</span>
                  <span>₹{advanceAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Balance Payable at Hotel</span>
                  <span>₹{hotelAmount.toLocaleString()}</span>
                </div>
              </>
            )}

            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
              <span className="font-bold text-surface">Total Payable Now</span>
              <span className="text-xl font-black text-surface">
                ₹{remainingPayable.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-surface text-sm flex items-center gap-2">
              <Wallet size={18} className="text-blue-600" />
              Use Wallet Balance
            </h3>
            <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
              Available: ₹{walletBalance.toLocaleString()}
            </span>
          </div>

          <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${useWallet && ['online', 'prepaid'].includes(paymentMethod) ? 'border-blue-600 bg-blue-50/20' : 'border-gray-100'}`}>
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
              <p className="text-sm font-semibold text-surface">Pay using Wallet</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {!['online', 'prepaid'].includes(paymentMethod)
                  ? "Select an online payment method to use wallet balance."
                  : walletBalance > 0
                    ? `Use ₹${Math.min(walletBalance, totalAmountForWallet).toLocaleString()} from your wallet.`
                    : "Insufficient balance."}
              </p>
            </div>
          </label>
        </div>

        {/* 4. Payment Options */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-surface mb-4 text-sm">Payment Method</h3>
          <div className="space-y-3">
            {/* Option 1: Pay at Hotel */}
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'pay_at_hotel' ? 'border-surface bg-white' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
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
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-surface text-sm">Pay at Hotel</span>
                  <Building size={16} className="text-gray-500" />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Pay the full amount when you check-in at the property. No upfront payment required.
                </p>
              </div>
            </label>

            {/* Option 2: Prepaid */}
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'prepaid' ? 'border-surface bg-white shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
              <input
                type="radio"
                name="payment"
                className="mt-1"
                checked={paymentMethod === 'prepaid'}
                onChange={() => setPaymentMethod('prepaid')}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-surface text-sm">Prepaid (Save 5%)</span>
                  <div className="flex gap-2">
                    <Tag size={16} className="text-green-600" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">
                  Pay 30% securely now and get a 5% discount on your booking. Pay the remaining 70% at the hotel.
                </p>
                <div className="flex gap-2 mt-1">
                  <span className="bg-green-100 text-green-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Extra Savings</span>
                </div>
              </div>
            </label>

            {/* Option 3: Pay Now */}
            <label className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-surface bg-white' : 'border-gray-100 hover:border-gray-200 bg-white'}`}>
              <input
                type="radio"
                name="payment"
                className="mt-1"
                checked={paymentMethod === 'online'}
                onChange={() => setPaymentMethod('online')}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-surface text-sm">Pay Now</span>
                  <div className="flex gap-2">
                    <CreditCard size={16} className="text-gray-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-2">
                  Secure online payment via UPI, Card, or Netbanking.
                </p>
                {/* Badges */}
                <div className="flex gap-2">
                  <span className="bg-blue-100 text-blue-700 text-[10px] uppercase font-bold px-2 py-0.5 rounded">Secure</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="pt-2">
          <button
            onClick={handleConfirmBooking}
            disabled={loading}
            className="w-full bg-surface text-white font-bold text-lg py-4 rounded-xl shadow-lg hover:bg-gray-900 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
