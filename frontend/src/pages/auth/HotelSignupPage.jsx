import React, { useState, useEffect } from 'react';
import usePartnerStore from '../../app/partner/store/partnerStore';
import { useNavigate } from 'react-router-dom';
import StepWrapper from '../../app/partner/components/StepWrapper';
import { ArrowLeft, ArrowRight, X, Loader2, Shield } from 'lucide-react';
import { useLenis } from '../../app/shared/hooks/useLenis';
import { authService } from '../../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import leafBg from '../../assets/leaf_background.png';
import logo from '../../assets/rokologin-removebg-preview.png';

// Updated Steps Components
import StepUserRegistration from '../../app/partner/steps/StepUserRegistration';
import StepOwnerDetails from '../../app/partner/steps/StepOwnerDetails';

const steps = [
    { id: 1, title: 'Identity', desc: 'Create partner account' },
    { id: 2, title: 'Verification', desc: 'Verify ownership' },
];

const HotelSignup = () => {
    useLenis();
    const navigate = useNavigate();
    const { currentStep, nextStep, prevStep, formData, setStep } = usePartnerStore();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const currentStepIndex = currentStep - 1;
    const progress = (currentStep / steps.length) * 100;

    const handleNext = async () => {
        setError('');
        if (currentStep === 1) {
            if (!formData.full_name || formData.full_name.length < 3) return setError('Please enter a valid full name');
            if (!formData.email || !formData.email.includes('@')) return setError('Please enter a valid email');
            if (!formData.phone || formData.phone.length !== 10) return setError('Please enter a valid 10-digit phone number');
            if (!formData.termsAccepted) return setError('You must accept the Terms & Conditions');
            setLoading(true);
            try {
                await authService.checkExists(formData.phone, formData.email, 'partner');
                nextStep();
            } catch (err) {
                setError(err.message || 'Validation failed');
            } finally {
                setLoading(false);
            }
        } else if (currentStep === 2) {
            if (!formData.aadhaar_number || formData.aadhaar_number.length !== 12) return setError('Valid 12-digit Aadhaar');
            setLoading(true);
            try {
                const response = await authService.registerPartner({ ...formData, role: 'partner' });
                alert('Registration successful! Pending approval.');
                navigate('/hotel/login');
            } catch (err) {
                setError(err.message || 'Registration failed');
            } finally {
                setLoading(false);
            }
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <StepUserRegistration />;
            case 2: return <StepOwnerDetails />;
            default: return <div>Unknown Step</div>;
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            <header className="h-16 px-6 flex items-center justify-between border-b border-gray-100">
                <button onClick={() => navigate('/hotel/login')} className="p-2"><X size={20} /></button>
                <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step {currentStep}</p>
                    <h1 className="text-sm font-bold">{steps[currentStepIndex]?.title}</h1>
                </div>
                <div className="w-10"></div>
            </header>

            <div className="h-1 bg-gray-50">
                <div className="h-full bg-[#39593f] transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            <main className="flex-1 overflow-y-auto p-6 pb-10 max-w-lg mx-auto w-full">
                <StepWrapper stepKey={currentStep}>{renderStep()}</StepWrapper>
            </main>

            <footer className="sticky bottom-0 z-20 bg-white p-6 pb-12 sm:pb-6 pb-[max(3rem,env(safe-area-inset-bottom))] border-t border-gray-100 flex gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                {currentStep > 1 && (
                    <button onClick={prevStep} className="px-6 py-4 rounded-2xl bg-gray-50 font-bold text-[#39593f] transition-all">Back</button>
                )}
                <button
                    onClick={handleNext}
                    disabled={loading}
                    className="flex-1 bg-[#39593f] text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100 active:scale-95 transition-all"
                >
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Continue'}
                </button>
            </footer>
        </div>
    );
};

export default HotelSignup;
