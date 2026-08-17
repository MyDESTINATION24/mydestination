import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ArrowRight, Loader2, Shield, User, Gift } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import leafBg from '../../assets/leaf_background.png';
import weddingBg from '../../assets/wedding_login_bg.png';
import hotelWebp from '../../assets/landing/hotel.webp';
import destLisbon from '../../assets/landing/dest_lisbon.png';
import wedding2 from '../../assets/landing/wedding.jpg';
import destExuma from '../../assets/landing/dest_exuma.png';
import logo from '../../assets/rokologin-removebg-preview.png';
import { authService } from '../../services/apiService';
import toast from 'react-hot-toast';

const UserSignup = ({ theme = 'hotel' }) => {
    const isWedding = theme === 'wedding';
    const primary   = isWedding ? '#81313A' : '#39593f';
    const light     = isWedding ? '#A3716A' : '#A3B18A';
    const faint     = isWedding ? '#DAC9C9' : '#DAD7CD';
    const HOTEL_IMAGES = [leafBg, hotelWebp, destLisbon];
    const WEDDING_IMAGES = [weddingBg, wedding2, destExuma];
    const images = isWedding ? WEDDING_IMAGES : HOTEL_IMAGES;

    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        referralCode: ''
    });
    const [touched, setTouched] = useState({
        name: false,
        phone: false,
        email: false,
        referralCode: false
    });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const [referralStatus, setReferralStatus] = useState({ state: 'idle', message: '' }); // idle | checking | valid | invalid

    useEffect(() => {
        const code = formData.referralCode.trim();
        if (!code || code.length < 4) {
            setReferralStatus({ state: 'idle', message: '' });
            return;
        }

        setReferralStatus({ state: 'checking', message: 'Validating referral code...' });
        const timer = setTimeout(async () => {
            try {
                const res = await authService.validateReferral(code);
                if (res.valid) {
                    setReferralStatus({ state: 'valid', message: '₹100 CREDIT WILL BE APPLIED' });
                } else {
                    setReferralStatus({ state: 'invalid', message: 'Invalid referral code' });
                }
            } catch (err) {
                setReferralStatus({ state: 'invalid', message: err.message || 'Invalid referral code' });
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [formData.referralCode]);

    const getFieldErrors = () => {
        const errors = {};
        if (formData.name.trim() === '') {
            errors.name = 'Full Name is required';
        } else if (formData.name.trim().length < 3) {
            errors.name = 'Full Name must be at least 3 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
            errors.name = 'Full Name should contain letters only';
        }

        if (formData.phone === '') {
            errors.phone = 'Phone Number is required';
        } else if (formData.phone.length !== 10) {
            errors.phone = 'Phone Number must be exactly 10 digits';
        } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
            errors.phone = 'Enter a valid Indian 10-digit mobile number';
        }

        if (formData.email.trim() !== '' && !emailRegex.test(formData.email.trim())) {
            errors.email = 'Please enter a valid email address';
        }

        if (formData.referralCode.trim() !== '') {
            if (formData.referralCode.trim().length < 4) {
                errors.referralCode = 'Referral Code must be at least 4 characters';
            } else if (referralStatus.state === 'invalid') {
                errors.referralCode = referralStatus.message;
            }
        }

        return errors;
    };

    const fieldErrors = getFieldErrors();
    const isFormValid = Object.keys(fieldErrors).length === 0;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        if (location.state?.phone) {
            setFormData(prev => ({ ...prev, phone: location.state.phone }));
        }
        const storedCode = localStorage.getItem('referralCode');
        if (storedCode && !formData.referralCode) {
            setFormData(prev => ({ ...prev, referralCode: storedCode }));
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

        if (!formData.name || formData.name.length < 3) return setError('Please enter your full name');
        if (formData.phone.length !== 10) return setError('Please enter a valid 10-digit phone number');

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (formData.email && !emailRegex.test(formData.email)) return setError('Please enter a valid email address');

        try {
            setLoading(true);
            await authService.sendOtp(formData.phone, 'register', 'user', formData.email);
            setResendTimer(120);
            setCanResend(false);
            setStep(2);
        } catch (err) {
            const errorMessage = err.message || '';
            const isDuplicate = err.requiresLogin || err.status === 409 || errorMessage.toLowerCase().includes('already exists');
            if (isDuplicate) {
                setError(`${errorMessage} Redirecting to login...`);
                setTimeout(() => navigate('/login', { state: { phone: formData.phone, from: location.state?.from } }), 2000);
            } else {
                setError(errorMessage || 'Failed to send OTP');
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
        if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
        if (value === '' && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
    };

    const handleResendOTP = async () => {
        if (!canResend) return;
        try {
            setLoading(true);
            setError('');
            await authService.sendOtp(formData.phone, 'register');
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
        if (otpString.length !== 6) return setError('Please enter complete OTP');

        try {
            setLoading(true);
            const payload = {
                phone: formData.phone,
                otp: otpString,
                name: formData.name,
                email: formData.email || undefined,
                referralCode: formData.referralCode || undefined
            };
            await authService.verifyOtp(payload);
            try {
                window.dispatchEvent(new CustomEvent('fcm:register'));
            } catch (fcmErr) { }
            // Direct redirect to respective panel
            const userRaw = localStorage.getItem('user');
            const user = userRaw ? JSON.parse(userRaw) : null;
            
            let defaultRedirect = isWedding ? '/wedding' : '/home';
            if (user?.role === 'partner') {
                defaultRedirect = '/hotel/dashboard';
            }
            
            // If user was trying to access a specific service before login/signup, redirect there
            const fromPath = location.state?.from?.pathname || '';
            const fromSearch = location.state?.from?.search || '';
            const isFromWeddingRoute = fromPath.startsWith('/wedding');
            const isFromHotelUserRoute = fromPath && !fromPath.startsWith('/wedding') && !fromPath.startsWith('/hotel');
            
            let redirectTo = defaultRedirect;
            if (fromPath) {
                if (isWedding && isFromWeddingRoute) {
                    redirectTo = fromPath;
                } else if (!isWedding && isFromHotelUserRoute) {
                    redirectTo = fromPath;
                }
            }
            
            navigate(redirectTo + fromSearch, { replace: true });

        } catch (err) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9F5] flex flex-col font-sans selection:bg-[#39593f] selection:text-white overflow-hidden relative">
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
                className="flex-1 bg-white relative z-10 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] -mt-16 pb-4"
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
                    <div className="mb-4 text-center">
                        <h2 className="text-2xl font-black" style={{ color: primary }}>Create Account</h2>
                        <p className="text-xs font-bold mt-1 tracking-tight" style={{ color: light }}>Join {isWedding ? 'Destination Weddings' : 'My Destination'} & Start Your Journey</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-5"
                            >
                                <form onSubmit={handleSendOTP} className="space-y-3">
                                    <div className="space-y-2">
                                        {/* Full Name Field */}
                                        <div className="relative">
                                            <label className="font-black text-[10px] uppercase tracking-widest block mb-1 px-1" style={{ color: primary }}>Full Name</label>
                                            <div 
                                                className={`flex items-center bg-[#F8F9F5] rounded-2xl border-2 transition-all h-14 ${
                                                    touched.name && fieldErrors.name 
                                                        ? 'border-red-500 bg-red-50/30' 
                                                        : 'border-transparent'
                                                }`}
                                                onFocus={e => { if (!touched.name || !fieldErrors.name) e.currentTarget.style.borderColor = light; }}
                                                onBlur={e => { 
                                                    setTouched(prev => ({ ...prev, name: true }));
                                                    if (touched.name && fieldErrors.name) {
                                                        e.currentTarget.style.borderColor = '#ef4444';
                                                    } else {
                                                        e.currentTarget.style.borderColor = 'transparent';
                                                    }
                                                }}
                                            >
                                                <User size={18} className="ml-4" style={{ color: touched.name && fieldErrors.name ? '#ef4444' : light }} />
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => {
                                                        const cleanVal = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                                                        setFormData({ ...formData, name: cleanVal });
                                                        setTouched(prev => ({ ...prev, name: true }));
                                                    }}
                                                    placeholder="Full Name"
                                                    className="flex-1 bg-transparent px-4 font-black outline-none h-full"
                                                    style={{ color: primary }}
                                                    required
                                                />
                                            </div>
                                            {touched.name && fieldErrors.name && (
                                                <p className="text-red-500 text-[10px] font-bold mt-1 px-2 flex items-center gap-1">
                                                    <span>•</span> {fieldErrors.name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Phone Number Field */}
                                        <div className="relative">
                                            <label className="font-black text-[10px] uppercase tracking-widest block mb-1 px-1" style={{ color: primary }}>Phone Number</label>
                                            <div 
                                                className={`flex items-center bg-[#F8F9F5] rounded-2xl border-2 transition-all h-14 ${
                                                    touched.phone && fieldErrors.phone 
                                                        ? 'border-red-500 bg-red-50/30' 
                                                        : 'border-transparent'
                                                }`}
                                                onFocus={e => { if (!touched.phone || !fieldErrors.phone) e.currentTarget.style.borderColor = light; }}
                                                onBlur={e => { 
                                                    setTouched(prev => ({ ...prev, phone: true }));
                                                    if (touched.phone && fieldErrors.phone) {
                                                        e.currentTarget.style.borderColor = '#ef4444';
                                                    } else {
                                                        e.currentTarget.style.borderColor = 'transparent';
                                                    }
                                                }}
                                            >
                                                <Phone size={18} className="ml-4" style={{ color: touched.phone && fieldErrors.phone ? '#ef4444' : light }} />
                                                <input
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={(e) => {
                                                        const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                        setFormData({ ...formData, phone: cleanVal });
                                                        setTouched(prev => ({ ...prev, phone: true }));
                                                    }}
                                                    placeholder="00000 00000"
                                                    maxLength={10}
                                                    className="flex-1 bg-transparent px-4 font-black outline-none h-full"
                                                    style={{ color: primary }}
                                                    required
                                                />
                                            </div>
                                            {touched.phone && fieldErrors.phone && (
                                                <p className="text-red-500 text-[10px] font-bold mt-1 px-2 flex items-center gap-1">
                                                    <span>•</span> {fieldErrors.phone}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email Field */}
                                        <div className="relative">
                                            <label className="font-black text-[10px] uppercase tracking-widest block mb-1 px-1" style={{ color: primary }}>Email <span className="lowercase text-[9px]">(Optional)</span></label>
                                            <div 
                                                className={`flex items-center bg-[#F8F9F5] rounded-2xl border-2 transition-all h-14 ${
                                                    touched.email && fieldErrors.email 
                                                        ? 'border-red-500 bg-red-50/30' 
                                                        : 'border-transparent'
                                                }`}
                                                onFocus={e => { if (!touched.email || !fieldErrors.email) e.currentTarget.style.borderColor = light; }}
                                                onBlur={e => { 
                                                    setTouched(prev => ({ ...prev, email: true }));
                                                    if (touched.email && fieldErrors.email) {
                                                        e.currentTarget.style.borderColor = '#ef4444';
                                                    } else {
                                                        e.currentTarget.style.borderColor = 'transparent';
                                                    }
                                                }}
                                            >
                                                <Mail size={18} className="ml-4" style={{ color: touched.email && fieldErrors.email ? '#ef4444' : light }} />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, email: e.target.value.trim() });
                                                        setTouched(prev => ({ ...prev, email: true }));
                                                    }}
                                                    placeholder="you@example.com"
                                                    className="flex-1 bg-transparent px-4 font-black outline-none h-full"
                                                    style={{ color: primary }}
                                                />
                                            </div>
                                            {touched.email && fieldErrors.email && (
                                                <p className="text-red-500 text-[10px] font-bold mt-1 px-2 flex items-center gap-1">
                                                    <span>•</span> {fieldErrors.email}
                                                </p>
                                            )}
                                        </div>

                                        {/* Referral Code Field */}
                                        <div className="bg-[#F8F9F5] p-3 rounded-2xl border space-y-2" style={{ borderColor: touched.referralCode && fieldErrors.referralCode ? '#ef4444' : referralStatus.state === 'valid' ? '#22c55e' : faint }}>
                                            <div className="flex items-center gap-2">
                                                <Gift size={14} style={{ color: primary }} />
                                                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: primary }}>Referral Code</span>
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.referralCode}
                                                onChange={(e) => {
                                                    const cleanVal = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                                                    setFormData({ ...formData, referralCode: cleanVal });
                                                    setTouched(prev => ({ ...prev, referralCode: true }));
                                                }}
                                                placeholder="MyDESTINATION"
                                                className={`w-full bg-white px-4 py-2 rounded-xl border outline-none h-10 uppercase tracking-widest text-center text-xs font-black ${
                                                    touched.referralCode && fieldErrors.referralCode ? 'border-red-500 text-red-500' : referralStatus.state === 'valid' ? 'border-green-500 text-green-700' : ''
                                                }`}
                                                style={{ color: primary, borderColor: touched.referralCode && fieldErrors.referralCode ? '#ef4444' : referralStatus.state === 'valid' ? '#22c55e' : faint }}
                                            />
                                            {referralStatus.state === 'checking' && (
                                                <p className="text-[9px] font-bold text-center text-gray-500 animate-pulse">Checking referral code...</p>
                                            )}
                                            {referralStatus.state === 'valid' && (
                                                <p className="text-[9px] font-black text-center text-green-600 tracking-tight flex items-center justify-center gap-1">
                                                    ✓ {referralStatus.message}
                                                </p>
                                            )}
                                            {(touched.referralCode || referralStatus.state === 'invalid') && fieldErrors.referralCode && (
                                                <p className="text-red-500 text-[9px] font-bold text-center">
                                                    ✕ {fieldErrors.referralCode}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-red-500 text-[11px] font-bold bg-red-50 py-3 px-4 rounded-xl border border-red-100 italic">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading || !isFormValid}
                                        className="w-full text-white h-14 rounded-2xl font-black text-sm active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: primary, boxShadow: `0 8px 24px ${primary}40` }}
                                    >
                                        {loading ? <Loader2 size={20} className="animate-spin" /> : <>Continue <ArrowRight size={18} /></>}
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
                                    <h3 className="text-xl font-black" style={{ color: primary }}>Verify Account</h3>
                                    <p className="text-xs mt-2 font-bold" style={{ color: light }}>
                                        Sent to <span className="font-black" style={{ color: primary }}>+91 {formData.phone}</span>
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOTP} className="space-y-8">
                                    <div className="flex gap-2.5 justify-center">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOTPChange(index, e.target.value)}
                                                onKeyDown={(e) => e.key === 'Backspace' && !digit && index > 0 && document.getElementById(`otp-${index - 1}`)?.focus()}
                                                className="w-11 h-14 bg-[#F8F9F5] border-2 border-transparent rounded-2xl text-center text-2xl font-black outline-none transition-all shadow-sm"
                                                style={{ color: primary }}
                                                onFocus={e => e.currentTarget.style.borderColor = light}
                                                onBlur={e => e.currentTarget.style.borderColor = 'transparent'}
                                                autoFocus={index === 0}
                                            />
                                        ))}
                                    </div>

                                    <div className="text-center">
                                        {canResend ? (
                                            <button type="button" onClick={handleResendOTP} className="font-black text-xs hover:underline" style={{ color: primary }}>Resend OTP</button>
                                        ) : (
                                            <p className="text-[10px] font-black italic" style={{ color: faint }}>Resend available in <span style={{ color: primary }}>{resendTimer}s</span></p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full text-white h-14 rounded-2xl font-black text-sm active:scale-[0.98] transition-all disabled:opacity-50"
                                            style={{ backgroundColor: primary, boxShadow: `0 8px 24px ${primary}40` }}
                                        >
                                            {loading ? <Loader2 size={20} className="animate-spin mx-auto" /> : 'Create My Account'}
                                        </button>
                                        <button type="button" onClick={() => setStep(1)} className="w-full text-[10px] font-black transition-colors" style={{ color: light }} onMouseOver={e => e.currentTarget.style.color = primary} onMouseOut={e => e.currentTarget.style.color = light}>Back to Edit Details</button>
                                    </div>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-4 pt-4 border-t border-[#F8F9F5] text-center">
                        <p className="text-sm font-bold" style={{ color: light }}>
                            Already have an account?{' '}
                            <button onClick={() => navigate(isWedding ? '/wedding/login' : '/login')} className="font-black hover:underline ml-1 px-1" style={{ color: primary }}>Log in</button>
                        </p>
                    </div>
                </div>
            </motion.main>
        </div>
    );
};

export default UserSignup;
