import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';

// Asks for the 6-digit OTP sent to `phone`. Used wherever the server needs
// proof of a phone number (partner signup, changing the profile phone).
const OtpPromptModal = ({ open, phone, title = 'Verify your number', loading = false, onSubmit, onResend, onClose }) => {
  const [otp, setOtp] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setOtp('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    if (otp.length === 6 && !loading) onSubmit(otp);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 -m-1 text-gray-400" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Enter the 6-digit code sent to <span className="font-semibold text-gray-800">{phone}</span>.
        </p>
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full text-center tracking-[0.5em] text-xl font-bold border border-gray-200 rounded-2xl py-3 outline-none focus:ring-2 focus:ring-[#39593f]/30"
          placeholder="••••••"
        />
        <button
          type="submit"
          disabled={otp.length !== 6 || loading}
          className="mt-4 w-full bg-[#39593f] disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold"
        >
          {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Verify'}
        </button>
        {onResend && (
          <button type="button" onClick={onResend} disabled={loading} className="mt-3 w-full text-sm font-semibold text-[#39593f]">
            Resend code
          </button>
        )}
      </form>
    </div>
  );
};

export default OtpPromptModal;
