import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/apiService';
import logo from '../../assets/rokologin-removebg-preview.png';
import toast from 'react-hot-toast';

const HotelLoginPage = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendTimer, setResendTimer] = useState(120);
    const [phoneTouched, setPhoneTouched] = useState(false);
    const isPhoneValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);

    useEffect(() => {
        let interval;
        if (step === 2 && resendTimer > 0) {
            interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
        } else if (resendTimer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, resendTimer === 0]);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        if (phone.length !== 10) return setError('Please enter a valid 10-digit phone number');

        try {
            setLoading(true);
            await authService.sendOtp(phone, 'login', 'partner');
            setResendTimer(120);
            setCanResend(false);
            setStep(2);
        } catch (err) {
            if (err.isBlocked || err.response?.data?.isBlocked || err.status === 403) {
                setError(err.message || 'Your account has been blocked.');
            } else if (err.requiresRegistration || err.response?.data?.requiresRegistration || err.status === 404) {
                setError('Account not found. Please register first.');
            } else {
                setError(err.message || 'Failed to send OTP');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOTPChange = (index, value) => {
        if (value.length > 1 || !/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length !== 6) return setError('Please enter complete OTP');

        try {
            setLoading(true);

            // Directly call API to get and store a real JWT token
            const res = await authService.verifyOtp({ phone, otp: otpString, role: 'partner' });

            try {
                window.dispatchEvent(new CustomEvent('fcm:register'));
            } catch (fcmError) {
                console.warn('[FCM] Could not dispatch register event', fcmError);
            }

            if (res?.user?.partnerApprovalStatus !== 'approved') {
                navigate('/hotel/pending-approval');
            } else {
                navigate('/hotel/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#F8F9F5] via-white to-[#E8F3E8] flex items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="text-center mb-10">
                    <img src={logo} alt="My DESTINATION" className="w-40 h-auto mx-auto mb-6" />
                    <h1 className="text-2xl font-black text-[var(--color-textDark)]">Partner Login</h1>
                    <p className="text-gray-400 text-xs font-medium mt-1">Manage your hotel property efficiently</p>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-green-50">
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <form onSubmit={handleSendOTP} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] uppercase font-black text-gray-400 mb-2 block ml-1">Mobile Number</label>
                                        <div className="relative group">
                                            <input
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => {
                                                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                                                    setPhoneTouched(true);
                                                }}
                                                onBlur={() => setPhoneTouched(true)}
                                                placeholder="9876543210"
                                                className={`w-full px-5 py-4 bg-gray-50 border-2 rounded-2xl focus:bg-white outline-none transition-all font-bold text-lg ${
                                                    phoneTouched && !isPhoneValid 
                                                        ? 'border-red-500 bg-red-50/30' 
                                                        : 'border-transparent focus:ring-4 focus:ring-green-50'
                                                }`}
                                                required
                                            />
                                        </div>
                                        {phoneTouched && !isPhoneValid && (
                                            <p className="text-red-500 text-[10px] font-bold mt-1 px-2 flex items-center gap-1">
                                                <span>•</span> {phone === '' ? 'Mobile number is required' : 'Enter a valid 10-digit mobile number starting with 6-9'}
                                            </p>
                                        )}
                                    </div>
                                    {error && <p className="text-red-500 text-[10px] font-bold text-center mt-2">{error}</p>}
                                    <button
                                        type="submit"
                                        disabled={loading || !isPhoneValid}
                                        className="w-full bg-[#39593f] text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Continue'}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <form onSubmit={handleVerifyOTP} className="space-y-6">
                                    <div className="flex gap-2 justify-center">
                                        {otp.map((d, index) => (
                                            <input
                                                key={index}
                                                id={`otp-${index}`}
                                                type="text"
                                                maxLength={1}
                                                value={d}
                                                onChange={(e) => handleOTPChange(index, e.target.value)}
                                                className="w-10 h-12 text-center text-lg font-black border-2 border-gray-100 rounded-xl focus:border-[#39593f] outline-none"
                                            />
                                        ))}
                                    </div>
                                    {error && <p className="text-red-500 text-[10px] font-bold text-center mt-2">{error}</p>}
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-[#39593f] text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-all"
                                    >
                                        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Login'}
                                    </button>
                                    <button onClick={() => setStep(1)} type="button" className="w-full text-xs text-gray-400 font-bold hover:text-[#39593f]">Change Number</button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <p className="text-center text-gray-400 text-xs mt-8 font-medium">
                    Don't have a partner account?{' '}
                    <button onClick={() => navigate('/hotel/register')} className="text-[#39593f] font-bold hover:underline">Register Now</button>
                </p>
            </motion.div>
        </div>
    );
};

export default HotelLoginPage;
