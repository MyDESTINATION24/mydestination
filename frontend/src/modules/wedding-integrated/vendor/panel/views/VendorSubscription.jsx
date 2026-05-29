import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ArrowRight, IndianRupee, Layers, CheckCircle2, 
  Loader2, Calendar, Zap, RefreshCw, Clock, Star 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { weddingService } from '../../../../../services/weddingService';
import { api } from '../../../../../services/apiService';
import toast from 'react-hot-toast';
import VendorLayout from '../layouts/VendorLayout';

const VendorSubscription = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [freshUser, setFreshUser] = useState(null);

  // Use freshUser if available, fallback to authUser from localStorage
  const user = freshUser || authUser;

  // Check if vendor has an active, non-expired subscription
  const hasActiveSub = user?.hasActiveSubscription === true && 
    user?.subscriptionExpiryDate && 
    new Date(user.subscriptionExpiryDate) > new Date();

  const expiryDate = user?.subscriptionExpiryDate 
    ? new Date(user.subscriptionExpiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const daysLeft = user?.subscriptionExpiryDate 
    ? Math.max(0, Math.ceil((new Date(user.subscriptionExpiryDate) - new Date()) / (1000 * 3600 * 24)))
    : 0;

  useEffect(() => {
    fetchFreshUserData();
    fetchPlans();
  }, []);

  const fetchFreshUserData = async () => {
    try {
      const res = await api.get('/wedding/vendor/me');
      if (res.data?.success) {
        const fresh = res.data.user;
        setFreshUser(fresh);
        // Sync to localStorage so future page loads are up to date
        const existing = JSON.parse(localStorage.getItem('vendor_user') || '{}');
        localStorage.setItem('vendor_user', JSON.stringify({ ...existing, ...fresh }));
      }
    } catch (err) {
      // Silently fail — will use cached user from authUser
      console.warn('Could not fetch fresh user data:', err.message);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await weddingService.getActiveSubscriptions();
      setPlans(data.data || []);
    } catch (error) {
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/wedding/vendor/login');
  };

  const handlePurchase = async (planId) => {
    try {
      setPurchasing(planId);
      const plan = plans.find(p => p._id === planId);
      const response = await weddingService.purchaseSubscription({
        planId,
        amount: plan.price,
        validityMonths: plan.validityMonths,
        validityType: plan.validityType || (plan.validityMonths > 1 ? 'months' : 'month')
      });
      
      if (response.success && response.url) {
        // Store orderId so PaymentStatusPage can verify payment after redirect
        if (response.orderId) {
          localStorage.setItem('phonepe_order_id', response.orderId);
        }
        window.location.href = response.url; // Redirect to PhonePe
      }
    } catch (error) {
      toast.error(error.message || 'Payment failed. Please try again.');
      setPurchasing(null);
    }
  };

  // ─── ACTIVE SUBSCRIPTION VIEW ───────────────────────────────────────────────
  if (hasActiveSub && !showUpgrade) {
    return (
      <VendorLayout title="My Plan">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl md:text-4xl font-black text-[#4A3730]">My Subscription</h1>
            <p className="text-gray-500 mt-1">Manage your active plan and upgrade anytime</p>
          </div>

          {/* Active Plan Card */}
          <div className="bg-gradient-to-br from-[hsl(353,45%,35%)] to-[hsl(353,45%,28%)] rounded-[2rem] p-6 md:p-8 text-white shadow-2xl shadow-[hsl(353,45%,35%)]/30 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-white" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-white/90">Active Plan</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                {/* Leads Remaining */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Layers size={14} className="text-white/70" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Leads Left</span>
                  </div>
                  <span className="text-2xl md:text-3xl font-black text-white">{user?.leadsRemaining ?? 0}</span>
                </div>

                {/* Days Left */}
                <div className={`rounded-xl p-3 md:p-4 ${daysLeft <= 7 ? 'bg-yellow-400/20 border border-yellow-400/40' : 'bg-white/10 backdrop-blur-sm'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock size={14} className="text-white/70" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Days Left</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-2xl md:text-3xl font-black ${daysLeft <= 7 ? 'text-yellow-300' : 'text-white'}`}>{daysLeft}</span>
                    {daysLeft <= 7 && <span className="text-yellow-300 text-[9px] font-bold uppercase tracking-wide">Renew!</span>}
                  </div>
                </div>

                {/* Expiry */}
                <div className="col-span-2 sm:col-span-1 bg-white/10 backdrop-blur-sm rounded-xl p-3 md:p-4 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar size={14} className="text-white/70" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Expires On</span>
                  </div>
                  <span className="text-base md:text-lg font-black text-white leading-tight">{expiryDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black text-[#4A3730] mb-1">Want more leads or longer validity?</h3>
              <p className="text-gray-500 text-sm">Upgrade your plan anytime. Your remaining leads & days will be <span className="font-bold text-[hsl(353,45%,35%)]">carried forward</span> automatically.</p>
            </div>
            <button 
              onClick={() => setShowUpgrade(true)}
              className="flex items-center gap-2 px-8 py-4 bg-[hsl(353,45%,35%)] text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all whitespace-nowrap"
            >
              <Zap size={18} /> Upgrade Plan
            </button>
          </div>
        </div>
      </VendorLayout>
    );
  }

  // ─── PLAN SELECTION VIEW (New purchase OR upgrade) ──────────────────────────
  return (
    <VendorLayout title="Subscription Plans">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {hasActiveSub ? (
            <>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(353,45%,35%)]/10 text-[hsl(353,45%,35%)] rounded-full text-sm font-black uppercase tracking-widest mb-4">
                <RefreshCw size={14} /> Upgrade Plan
              </div>
              <h1 className="text-3xl md:text-4xl font-serif text-[hsl(353,45%,35%)] mb-3">Choose Your New Plan</h1>
              <p className="text-gray-600 max-w-xl mx-auto">Your current <strong>{user?.leadsRemaining} leads</strong> and <strong>{daysLeft} days</strong> will be added to the new plan automatically.</p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-3xl md:text-4xl font-serif text-[hsl(353,45%,35%)] mb-3">Subscription Required</h1>
              <p className="text-gray-600 max-w-xl mx-auto">Purchase a plan to access your vendor dashboard and start receiving verified leads.</p>
            </>
          )}
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(353,45%,35%)]" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-3xl shadow-sm text-gray-400">
            No plans available. Please contact support.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map(plan => (
              <div key={plan._id} className="bg-white p-8 rounded-[2rem] shadow-sm hover:shadow-xl transition-all border border-gray-100 relative flex flex-col">
                <div className="mb-8">
                  <span className="px-4 py-1.5 bg-[hsl(353,45%,35%)]/10 text-[hsl(353,45%,35%)] rounded-full text-xs font-black uppercase tracking-widest inline-block mb-4">
                    {plan.validityMonths} {plan.validityType === 'days' ? 'Days' : 'Months'}
                  </span>
                  <h2 className="text-2xl font-black text-gray-900 mb-4">{plan.planName}</h2>
                  <div className="flex items-baseline gap-1">
                    <IndianRupee size={24} className="text-[hsl(353,45%,35%)] font-bold"/>
                    <span className="text-5xl font-black text-slate-800">{plan.price}</span>
                  </div>
                </div>

                <div className="bg-[#B06A6C]/5 p-4 rounded-xl mb-8 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-[hsl(353,45%,35%)]" />
                    <span className="font-bold text-slate-700">Leads Quota</span>
                  </div>
                  <span className="text-xl font-black text-[hsl(353,45%,35%)]">{plan.numberOfLeads}</span>
                </div>

                {hasActiveSub && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-xl mb-4 text-xs text-green-700 font-bold flex items-center gap-2">
                    <RefreshCw size={12} />
                    +{user?.leadsRemaining ?? 0} leads & {daysLeft} days carried forward
                  </div>
                )}

                <div className="space-y-3 mb-8 flex-1">
                  {plan.features?.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => handlePurchase(plan._id)}
                  disabled={purchasing === plan._id}
                  className="w-full py-4 bg-[hsl(353,45%,35%)] text-white rounded-xl font-bold shadow-lg shadow-[hsl(353,45%,35%)]/20 hover:bg-[hsl(353,45%,28%)] transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {purchasing === plan._id ? (
                    <><Loader2 size={20} className="animate-spin"/> Processing...</>
                  ) : hasActiveSub ? 'Upgrade to This Plan' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-12 text-center flex gap-4 justify-center">
          {hasActiveSub && (
            <button onClick={() => setShowUpgrade(false)} className="text-gray-500 hover:text-gray-800 font-medium">
              ← Back to My Plan
            </button>
          )}
          {!hasActiveSub && (
            <button onClick={handleLogout} className="px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              Logout
            </button>
          )}
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorSubscription;
