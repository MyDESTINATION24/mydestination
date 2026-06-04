import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Mail, ArrowRight, Heart, Hotel } from 'lucide-react';
import { authService } from '../../services/apiService';

// theme: 'hotel' | 'wedding'
const UserLoginPage = ({ theme = 'hotel' }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loginMethod, setLoginMethod] = useState('phone');
    const [step, setStep] = useState('input');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // ── Theme tokens ──────────────────────────────────────────────
    const isWedding = theme === 'wedding';

    const T = isWedding
        ? {
              bg: 'bg-gradient-to-br from-[#3b0f14] via-[#5a1a22] to-[#81313A]',
              cardBg: 'bg-white/95',
              accent: '#81313A',
              accentHover: '#6b2831',
              accentLight: '#fdf2f3',
              accentText: 'text-[#81313A]',
              accentBorder: 'border-[#81313A]',
              tabActive: 'bg-white text-[#81313A] shadow-sm',
              tabInactive: 'text-gray-400 hover:text-gray-600',
              inputFocus: 'focus-within:ring-[#81313A] focus-within:border-[#81313A]',
              otpFocus: 'focus:border-[#81313A] focus:ring-[#81313A]/20',
              resendBtn: 'text-[#81313A]',
              signupBtn: 'text-[#81313A]',
              icon: <Heart size={28} className="text-white" />,
              brand: 'MyDESTINATION Weddings',
              brandSub: 'Plan your dream celebration',
              heading: 'Welcome Back',
              subHeading: 'Login to explore wedding destinations',
              signupPath: '/signup',
              btnShadow: 'shadow-[#81313A]/30',
          }
        : {
              bg: 'bg-gradient-to-br from-[#0f2a3a] via-[#0e4d5c] to-[#006374]',
              cardBg: 'bg-white',
              accent: '#00796B',
              accentHover: '#00695C',
              accentLight: '#f0faf9',
              accentText: 'text-sky-700',
              accentBorder: 'border-sky-500',
              tabActive: 'bg-white text-sky-700 shadow-sm',
              tabInactive: 'text-gray-400 hover:text-gray-600',
              inputFocus: 'focus-within:ring-sky-500 focus-within:border-sky-500',
              otpFocus: 'focus:border-sky-500 focus:ring-sky-500/20',
              resendBtn: 'text-sky-600',
              signupBtn: 'text-sky-600',
              icon: <Hotel size={28} className="text-white" />,
              brand: 'MyDESTINATION Hotels',
              brandSub: 'Find your perfect stay',
              heading: 'Welcome Back',
              subHeading: 'Login to continue your journey',
              signupPath: '/signup',
              btnShadow: 'shadow-sky-500/30',
          };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (loginMethod === 'phone' && phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }
        if (loginMethod === 'email' && !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }
        setError('');
        setLoading(true);
        try {
            if (loginMethod === 'email') throw new Error('Email login coming soon. Please use Phone.');
            await authService.sendOtp(phone);
            setStep('otp');
        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index, value) => {
        if (value.length > 1) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) document.getElementById(`otp-${index + 1}`).focus();
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const otpValue = otp.join('');
        if (otpValue.length !== 6) { setError('Please enter complete OTP'); return; }
        setError('');
        setLoading(true);
        try {
            await authService.verifyOtp({ phone, otp: otpValue });
            try { window.dispatchEvent(new CustomEvent('fcm:register')); } catch (_) {}
            const redirectTo = location.state?.from?.pathname || (isWedding ? '/wedding' : '/home');
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0)
            document.getElementById(`otp-${index - 1}`).focus();
    };

    return (
        <div className={`min-h-screen ${T.bg} flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden`}>

            {/* Decorative background blobs */}
            <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-10 blur-3xl"
                style={{ background: isWedding ? '#ff6b6b' : '#00e5ff', transform: 'translate(-30%, -30%)' }} />
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
                style={{ background: isWedding ? '#ff8fa3' : '#0097a7', transform: 'translate(30%, 30%)' }} />

            {/* Header / Logo Section */}
            <div className="text-center mb-8 relative z-10">
                <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ background: isWedding ? '#81313A' : '#006374' }}>
                        {T.icon}
                    </div>
                </div>
                <h1 className="text-3xl font-black text-white mb-1">{T.heading}</h1>
                <p className="text-white/60 text-sm">{T.subHeading}</p>
                <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold text-white/80"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    {T.brand}
                </div>
            </div>

            {/* Main Card */}
            <div className={`${T.cardBg} rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10`}>
                <div className="p-8">

                    {/* Colored top accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                        style={{ background: isWedding ? '#81313A' : '#006374' }} />

                    {step === 'input' ? (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 mb-6">
                                {isWedding ? '💍 Login with OTP' : '🏨 Login with OTP'}
                            </h2>

                            {/* Tabs */}
                            <div className="flex bg-gray-100 p-1 rounded-xl mb-8">
                                <button
                                    onClick={() => setLoginMethod('phone')}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${loginMethod === 'phone' ? T.tabActive : T.tabInactive}`}
                                >
                                    <Phone size={18} /> Phone
                                </button>
                                <button
                                    onClick={() => setLoginMethod('email')}
                                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${loginMethod === 'email' ? T.tabActive : T.tabInactive}`}
                                >
                                    <Mail size={18} /> Email
                                </button>
                            </div>

                            <form onSubmit={handleSendOtp}>
                                <div className="mb-8">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">
                                        {loginMethod === 'phone' ? 'Phone Number' : 'Email Address'}
                                    </label>
                                    <div className={`flex items-center border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 ${T.inputFocus} transition-all bg-white`}>
                                        {loginMethod === 'phone' ? (
                                            <>
                                                <Phone className="text-gray-400 mr-3" size={20} />
                                                <input
                                                    type="tel"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                                    placeholder="Enter 10-digit phone number"
                                                    className="flex-1 outline-none text-gray-900 font-medium placeholder:text-gray-300"
                                                    autoFocus
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="text-gray-400 mr-3" size={20} />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="john@example.com"
                                                    className="flex-1 outline-none text-gray-900 font-medium placeholder:text-gray-300"
                                                    autoFocus
                                                />
                                            </>
                                        )}
                                    </div>
                                    {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full text-white font-bold py-4 rounded-xl shadow-lg ${T.btnShadow} flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed`}
                                    style={{ background: loading ? T.accent : undefined, backgroundColor: T.accent }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = T.accentHover}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = T.accent}
                                >
                                    {loading
                                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : <><span>Send OTP</span><ArrowRight size={20} /></>
                                    }
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Verify OTP</h2>
                            <p className="text-gray-500 text-sm mb-8">
                                Enter the 6-digit code sent to <span className="font-bold text-gray-800">+91 {phone}</span>
                            </p>

                            <form onSubmit={handleVerifyOtp}>
                                <div className="flex gap-2 justify-center mb-8">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            id={`otp-${index}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            className={`w-12 h-14 border border-gray-200 rounded-xl text-center text-2xl font-bold text-gray-800 ${T.otpFocus} focus:ring-2 outline-none transition-all bg-gray-50`}
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                                {error && <p className="text-red-500 text-xs mt-[-20px] mb-6 text-center font-medium">{error}</p>}

                                <div className="text-center mb-6">
                                    <p className="text-gray-400 text-sm">
                                        Didn't receive code?{' '}
                                        <button type="button" onClick={handleSendOtp} className={`${T.resendBtn} font-bold hover:underline`}>
                                            Resend
                                        </button>
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full text-white font-bold py-4 rounded-xl shadow-lg ${T.btnShadow} flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70`}
                                    style={{ backgroundColor: T.accent }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = T.accentHover}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = T.accent}
                                >
                                    {loading
                                        ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        : <><span>Verify &amp; Login</span><ArrowRight size={20} /></>
                                    }
                                </button>

                                <button
                                    type="button"
                                    onClick={() => { setStep('input'); setOtp(['','','','','','']); setError(''); }}
                                    className="w-full mt-4 text-gray-400 text-sm font-semibold hover:text-gray-600"
                                >
                                    ← Change Phone Number
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center relative z-10">
                <p className="text-white/60 text-sm">
                    New to {isWedding ? 'MyDESTINATION Weddings' : 'MyDESTINATION'}?{' '}
                    <button onClick={() => navigate(T.signupPath)} className="text-white font-bold hover:underline">
                        Create Account
                    </button>
                </p>
                {isWedding && (
                    <button onClick={() => navigate('/login')} className="mt-2 text-white/40 text-xs hover:text-white/60 transition">
                        Looking for Hotels? Login here →
                    </button>
                )}
                {!isWedding && (
                    <button onClick={() => navigate('/wedding/login')} className="mt-2 text-white/40 text-xs hover:text-white/60 transition">
                        Planning a Wedding? Login here →
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserLoginPage;
