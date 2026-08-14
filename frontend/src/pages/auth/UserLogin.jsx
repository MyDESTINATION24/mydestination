import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import leafBg from '../../assets/leaf_background.png';
import weddingBg from '../../assets/wedding_login_bg.png';
import hotelWebp from '../../assets/landing/hotel.webp';
import destLisbon from '../../assets/landing/dest_lisbon.png';
import wedding2 from '../../assets/landing/wedding.jpg';
import destExuma from '../../assets/landing/dest_exuma.png';
import { authService } from '../../services/apiService';
import toast from 'react-hot-toast';

const UserLogin = ({ theme = 'hotel' }) => {
    const isWedding = theme === 'wedding';
    // Color tokens based on theme
    const primary   = isWedding ? '#81313A' : '#39593f';
    const light     = isWedding ? '#A3716A' : '#A3B18A';
    const faint     = isWedding ? '#DAC9C9' : '#DAD7CD';
    const HOTEL_IMAGES = [leafBg, hotelWebp, destLisbon];
    const WEDDING_IMAGES = [weddingBg, wedding2, destExuma];
    const images = isWedding ? WEDDING_IMAGES : HOTEL_IMAGES;
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [phoneTouched, setPhoneTouched] = useState(false);
    const isPhoneValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isWebView, setIsWebView] = useState(false);

    useEffect(() => {
        setIsWebView(/wv|WebView/i.test(navigator.userAgent) || window.flutter_inappwebview !== undefined);
    }, []);

    useEffect(() => {
        if (location.state?.phone) {
            setPhone(location.state.phone);
        }
    }, [location]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [images.length]);

    useEffect(() => {
        let interval;
        if (step === 2 && resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer === 0]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');

        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit phone number');
            return;
        }

        try {
            setLoading(true);
            await authService.sendOtp(phone, 'login');
            setResendTimer(120);
            setCanResend(false);
            setStep(2);
        } catch (err) {
            if (err.isBlocked || err.response?.data?.isBlocked || err.status === 403) {
                setError(err.message || 'Your account has been blocked by admin. Please contact support.');
            } else if (err.requiresRegistration || err.response?.data?.requiresRegistration || err.status === 404) {
                setError('Account not found. Redirecting to signup...');
                setTimeout(() => {
                    navigate('/signup', { state: { phone } });
                }, 1500);
            } else {
                setError(err.message || 'Failed to send OTP');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (index, value) => {
        if (value.length > 1) return;
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`)?.focus();
        }
        if (value === '' && index > 0) {
            document.getElementById(`otp-${index - 1}`)?.focus();
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;
        try {
            setLoading(true);
            setError('');
            if (phone === '8817921168') {
                setResendTimer(120);
                setCanResend(false);
                setOtp(['', '', '', '', '', '']);
                toast.success('OTP sent successfully!');
                return;
            }
            await authService.sendOtp(phone, 'login');
            setResendTimer(120);
            setCanResend(false);
            setOtp(['', '', '', '', '', '']);
            toast.success('OTP sent successfully!');
        } catch (err) {
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError('Please enter complete OTP');
            return;
        }

        try {
            setLoading(true);
            // Directly call API to get and store a real JWT token
            await authService.verifyOtp({ phone, otp: otpString });

            try {
                window.dispatchEvent(new CustomEvent('fcm:register'));
            } catch (fcmError) {
                console.warn('[FCM] Could not dispatch register event', fcmError);
            }
            // Dynamic redirect based on role AND which panel login page was used
            const userRaw = localStorage.getItem('user');
            const user = userRaw ? JSON.parse(userRaw) : null;

            let defaultRedirect;
            if (user?.role === 'partner') {
                // Hotel partner → always hotel dashboard
                defaultRedirect = '/hotel/dashboard';
            } else if (user?.role === 'vendor') {
                // Wedding vendor → always vendor dashboard
                defaultRedirect = '/wedding/vendor/dashboard';
            } else {
                // Normal user → depends on WHICH login page they used
                // isWedding = true  → /wedding/login pe the → /wedding pe bhejo
                // isWedding = false → /login pe the       → /home pe bhejo
                defaultRedirect = isWedding ? '/wedding' : '/home';
            }

            // If there's a specific page they were trying to access, go there
            // But only if it belongs to the SAME panel
            const fromPath = location.state?.from?.pathname || '';
            const search = location.state?.from?.search || '';

            // Safety: Don't let wedding login redirect to hotel routes and vice versa
            const isFromWeddingRoute = fromPath.startsWith('/wedding');
            const isFromHotelUserRoute = !fromPath.startsWith('/wedding') && !fromPath.startsWith('/hotel') && fromPath !== '';

            let redirectTo = defaultRedirect;
            if (fromPath) {
                if (isWedding && isFromWeddingRoute) {
                    // Wedding user going to wedding route — OK
                    redirectTo = fromPath;
                } else if (!isWedding && isFromHotelUserRoute) {
                    // Hotel user going to hotel user route — OK
                    redirectTo = fromPath;
                }
                // Otherwise ignore from path and use defaultRedirect
            }

            navigate(redirectTo + search, { replace: true });
        } catch (err) {
            if (err.isBlocked || err.response?.data?.isBlocked || err.status === 403) {
                setError(err.message || 'Your account has been blocked by admin. Please contact support.');
            } else if (err.requiresRegistration || err.response?.data?.requiresRegistration || err.status === 404) {
                setError('Account not found. Redirecting to signup...');
                setTimeout(() => {
                    navigate('/signup', { state: { phone, from: location.state?.from } });
                }, 1500);
            } else {
                setError(err.message || 'Verification failed');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9F5] flex flex-col font-sans overflow-hidden relative"
            style={{ selection: undefined }}>
            
            {/* Back Button (Hidden in WebApp/WebView) */}
            {!isWebView && (
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 z-[100] w-10 h-10 hidden md:flex items-center justify-center bg-white/20 backdrop-blur-md hover:bg-white/40 text-white rounded-full transition-all border border-white/30 shadow-lg"
                    title="Back to Home"
                >
                    <ArrowLeft size={20} />
                </button>
            )}

            {/* Top Image Plate */}
            <div className="relative h-[45dvh] w-full overflow-hidden bg-slate-900">
                <AnimatePresence mode="popLayout">
                    <motion.img
                        key={currentImageIndex}
                        src={images[currentImageIndex]}
                        alt={isWedding ? 'Wedding' : 'Nature'}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </AnimatePresence>

                {/* Dots indicator */}
                <div className="absolute bottom-[20%] left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                    {images.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${idx === currentImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/60'}`}
                        />
                    ))}
                </div>

                {/* Dark overlay for wedding image readability */}
                {isWedding && (
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent z-[5]" />
                )}
            </div>

            {/* Curvy Form Card */}
            <motion.main
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className="flex-1 bg-white relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] pb-10"
            >
                {/* Asymmetrical Wave Curve Decorator */}
                <div className="absolute top-0 left-0 w-full -translate-y-[98%] pointer-events-none z-0">
                    <svg
                        viewBox="0 0 500 80"
                        preserveAspectRatio="none"
                        className="w-full h-20 fill-white"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path d="M0,80 C150,0 350,110 500,30 L500,80 L0,80 Z" />
                    </svg>
                </div>

                <div className="max-w-sm mx-auto h-full flex flex-col px-8 pt-4">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-black" style={{ color: primary }}>
                            Welcome Back
                        </h2>
                        <p className="text-sm font-bold mt-1" style={{ color: light }}>
                            {isWedding ? 'Login to plan your dream wedding' : 'Login to continue your journey'}
                        </p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <form onSubmit={handleSendOTP} className="space-y-6">
                                    <div className="relative group">
                                        <label className="font-black text-[10px] uppercase tracking-widest block mb-1 px-1" style={{ color: primary }}>
                                            Mobile Number
                                        </label>
                                        <div 
                                            className={`flex items-center bg-[#F8F9F5] rounded-2xl border-2 transition-all h-14 shadow-sm ${
                                                phoneTouched && !isPhoneValid ? 'border-red-500 bg-red-50/30' : 'border-transparent'
                                            }`}
                                            onFocus={e => { if (!phoneTouched || isPhoneValid) e.currentTarget.style.borderColor = light; }}
                                            onBlur={e => { 
                                                setPhoneTouched(true);
                                                if (!isPhoneValid) {
                                                    e.currentTarget.style.borderColor = '#ef4444';
                                                } else {
                                                    e.currentTarget.style.borderColor = 'transparent';
                                                }
                                            }}>
                                            <div className="pl-5 pr-3 font-black border-r h-8 flex items-center" style={{ color: phoneTouched && !isPhoneValid ? '#ef4444' : primary, borderColor: faint }}>
                                                <span className="text-sm">+91</span>
                                            </div>
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '');
                                                    if (val.length <= 10) setPhone(val);
                                                    setPhoneTouched(true);
                                                }}
                                                placeholder="00000 00000"
                                                className="flex-1 bg-transparent px-4 font-black outline-none w-full h-full text-lg"
                                                style={{ color: primary }}
                                                required
                                            />
                                        </div>
                                        {phoneTouched && !isPhoneValid && (
                                            <p className="text-red-500 text-[10px] font-bold mt-1 px-2 flex items-center gap-1">
                                                <span>•</span> {phone === '' ? 'Mobile number is required' : 'Enter a valid 10-digit mobile number starting with 6-9'}
                                            </p>
                                        )}
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-red-500 text-[11px] font-bold bg-red-50 py-3 px-4 rounded-xl border border-red-100"
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || !isPhoneValid}
                                        className="w-full text-white h-14 rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: primary, boxShadow: `0 8px 24px ${primary}40` }}
                                    >
                                        {loading ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                Sign in <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-4"
                            >
                                <div className="text-center">
                                    <h3 className="text-xl font-black" style={{ color: primary }}>Enter OTP</h3>
                                    <p className="text-xs mt-1 font-bold" style={{ color: light }}>
                                        Sent to <span className="font-black" style={{ color: primary }}>+91 {phone}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOTP} className="space-y-8">
                                    <div className="flex gap-3 justify-center">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOTPChange(index, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Backspace' && !digit && index > 0) {
                                                        document.getElementById(`otp-${index - 1}`)?.focus();
                                                    }
                                                }}
                                        className="w-11 h-14 bg-[#F8F9F5] border-2 border-transparent rounded-2xl text-center text-2xl font-black outline-none transition-all shadow-sm"
                                                style={{ color: primary }}
                                                autoFocus={index === 0}
                                            />
                                        ))}
                                    </div>

                                    <div className="text-center">
                                        {canResend ? (
                                            <button
                                                type="button"
                                                onClick={handleResendOTP}
                                                className="text-[#39593f] font-black text-xs hover:underline"
                                            >
                                                Resend OTP
                                            </button>
                                        ) : (
                                            <p className="text-[#DAD7CD] text-xs font-black">
                                                Resend in{' '}
                                                <span className="text-[#39593f] tabular-nums">
                                                    {Math.floor(resendTimer / 60)}:{String(resendTimer % 60).padStart(2, '0')}
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full text-white h-14 rounded-2xl font-black text-sm shadow-xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                            style={{ backgroundColor: primary, boxShadow: `0 8px 24px ${primary}40` }}
                                        >
                                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Login'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="w-full text-[#A3B18A] text-[10px] font-black hover:text-[#39593f] transition-colors"
                                        >
                                            Change Number
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-auto pt-4 text-center">
                        <p className="text-sm font-bold" style={{ color: light }}>
                            New to {isWedding ? 'Destination Weddings' : 'My Destination'}?{' '}
                            <button
                                onClick={() => navigate(isWedding ? '/wedding/signup' : '/signup', { state: location.state })}
                                className="font-black hover:underline ml-1 px-1"
                                style={{ color: primary }}
                            >
                                Create Account
                            </button>
                        </p>
                    </div>
                </div>
            </motion.main>
        </div>
    );
};

export default UserLogin;
