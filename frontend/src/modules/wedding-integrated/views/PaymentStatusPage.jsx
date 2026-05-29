import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../../services/apiService';

const PaymentStatusPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [details, setDetails] = useState(null);

  useEffect(() => {
    handlePaymentVerification();
  }, []);

  const handlePaymentVerification = async () => {
    // PhonePe ke baad redirect hone par orderId localStorage mein stored hota hai
    // Hum us orderId se backend verify karte hain
    const orderId = localStorage.getItem('phonepe_order_id');
    const code = searchParams.get('code');

    if (!orderId) {
      // No orderId found — check URL params as fallback
      if (code === 'PAYMENT_ERROR') {
        setStatus('failed');
      } else {
        // No info available, show success (PhonePe only redirects on success in sandbox)
        setStatus('success');
      }
      return;
    }

    // Always verify with backend — this also triggers DB update
    try {
      const response = await api.get(`/wedding/payment/status/${orderId}`);
      const state = response.data?.state || response.data?.data?.state;

      if (state === 'COMPLETED') {
        setStatus('success');
        setDetails(response.data);

        // Refresh vendor user data from backend so UI updates
        try {
          const userRes = await api.get('/wedding/vendor/me');
          if (userRes.data?.success) {
            const fresh = userRes.data.user;
            const existing = JSON.parse(localStorage.getItem('vendor_user') || '{}');
            localStorage.setItem('vendor_user', JSON.stringify({ ...existing, ...fresh }));
          }
        } catch (_) {
          // Silently fail — page refresh will pick up from DB anyway
        }

        // Clear stored orderId after successful verification
        localStorage.removeItem('phonepe_order_id');
      } else if (state === 'FAILED' || state === 'ERROR') {
        setStatus('failed');
        localStorage.removeItem('phonepe_order_id');
      } else {
        // PENDING — still processing
        setStatus('failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      // If verification API fails, fallback to code param
      if (code === 'PAYMENT_ERROR') {
        setStatus('failed');
      } else {
        setStatus('success'); // Optimistic: PhonePe only redirects on success usually
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafb] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[2rem] p-8 shadow-xl text-center relative overflow-hidden">
        
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="w-12 h-12 animate-spin text-[hsl(353,45%,35%)]" />
            <h2 className="text-xl font-bold text-gray-800">Verifying Payment...</h2>
            <p className="text-gray-500">Please do not close this window.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-500 mb-8">
              Your transaction has been completed. Subscription benefits have been activated.
            </p>

            {details?.amount && (
              <div className="bg-gray-50 rounded-xl p-4 mb-8 text-left border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
                <p className="text-2xl font-black text-gray-900">₹{(details.amount / 100).toFixed(2)}</p>
              </div>
            )}

            <button
              onClick={() => navigate('/wedding/vendor/subscription')}
              className="w-full flex items-center justify-center gap-2 py-4 bg-[hsl(353,45%,35%)] text-white rounded-xl font-bold hover:bg-[hsl(353,45%,28%)] transition-colors"
            >
              View My Plan <ArrowRight size={18} />
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-500 mb-8">
              We couldn't process your payment. Any deducted amount will be refunded within 3-5 business days.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/wedding/vendor/subscription')}
                className="flex-1 py-4 bg-[hsl(353,45%,35%)] text-white rounded-xl font-bold hover:bg-[hsl(353,45%,28%)] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/wedding/vendor/dashboard')}
                className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentStatusPage;
