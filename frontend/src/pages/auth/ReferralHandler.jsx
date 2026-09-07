import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Gift, ArrowRight, Car, Loader2 } from 'lucide-react';
import { storeReferralCode, normalizeReferralCode } from '../../utils/referral';

/**
 * Every app shares this one link, so the destination cannot be assumed:
 * a driver inviting drivers and a guest inviting guests send the same URL.
 * The code is stored either way, so whichever signup they pick still credits
 * the referrer.
 */
const ReferralHandler = () => {
  const { referralCode } = useParams();
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  useEffect(() => {
    const normalized = normalizeReferralCode(referralCode);
    if (!normalized) {
      navigate('/');
      return;
    }
    storeReferralCode(normalized);
    setCode(normalized);
  }, [referralCode, navigate]);

  if (!code) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-white">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center text-white px-6">
      <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center mb-6">
        <Gift size={30} className="text-accent" />
      </div>

      <h2 className="text-xl font-bold tracking-tight text-center">You've been invited</h2>
      <p className="text-white/60 text-sm mt-2 text-center">Referral code applied</p>

      <div className="mt-4 px-6 py-3 rounded-2xl bg-white/10 border border-white/15 font-black tracking-[0.2em] text-lg">
        {code}
      </div>

      <div className="w-full max-w-sm mt-10 space-y-3">
        <button
          onClick={() => navigate('/signup')}
          className="w-full py-4 rounded-2xl bg-white text-surface font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
        >
          Create your account
          <ArrowRight size={16} />
        </button>

        <button
          onClick={() => navigate(`/taxi/driver/reg-phone?ref=${encodeURIComponent(code)}`)}
          className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition"
        >
          <Car size={16} />
          Register as a driver
        </button>
      </div>

      <p className="text-white/40 text-[11px] mt-8 text-center max-w-xs">
        Your code stays applied whichever option you choose.
      </p>
    </div>
  );
};

export default ReferralHandler;
