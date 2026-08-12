import React, { useState, useEffect } from 'react';
import usePartnerStore from '../../app/partner/store/partnerStore';
import { useNavigate, useLocation } from 'react-router-dom';
import StepWrapper from '../../app/partner/components/StepWrapper';
import { ArrowLeft, ArrowRight, X, Loader2, Shield, AlertCircle } from 'lucide-react';
import { useLenis } from '../../app/shared/hooks/useLenis';
import { authService } from '../../services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import leafBg from '../../assets/leaf_background.png';
import logo from '../../assets/rokologin-removebg-preview.png';
import toast from 'react-hot-toast';

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
    const location = useLocation();
    const { currentStep, nextStep, prevStep, formData, setStep, updateFormData } = usePartnerStore();
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
            const nameValid = formData.full_name && /^[a-zA-Z\s]{3,50}$/.test(formData.full_name.trim());
            if (!nameValid) return setError('Please enter a valid full name (at least 3 letters, alphabets only)');

            const emailValid = formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
            if (!emailValid) return setError('Please enter a valid business email address');

            const phoneValid = formData.phone && /^[6-9]\d{9}$/.test(formData.phone);
            if (!phoneValid) return setError('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');

            if (!formData.termsAccepted) return setError('You must accept the Terms & Conditions');

            if (formData.isEditing || location.search.includes('mode=edit')) {
                nextStep();
                return;
            }

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
            const aadhaarValid = formData.aadhaar_number && /^\d{12}$/.test(formData.aadhaar_number);
            if (!aadhaarValid) return setError('Please enter a valid 12-digit Aadhaar number');

            if (!formData.aadhaar_front) return setError('Please upload Aadhaar Front image');
            if (!formData.aadhaar_back) return setError('Please upload Aadhaar Back image');

            const panValid = formData.pan_number && /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number);
            if (!panValid) return setError('Please enter a valid 10-character PAN number (e.g. ABCDE1234F)');

            if (!formData.pan_card_image) return setError('Please upload PAN Card image');

            setLoading(true);
            try {
                if (formData.isEditing || location.search.includes('mode=edit')) {
                    const getUrl = (val) => (val && typeof val === 'object' ? val.url : val);
                    const response = await authService.updateProfile({
                        name: formData.full_name,
                        email: formData.email,
                        aadhaarNumber: formData.aadhaar_number,
                        aadhaarFront: getUrl(formData.aadhaar_front),
                        aadhaarBack: getUrl(formData.aadhaar_back),
                        panNumber: formData.pan_number,
                        panCardImage: getUrl(formData.pan_card_image),
                    });
                    const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
                    const updatedUser = response?.user ? { ...existingUser, ...response.user, partnerApprovalStatus: 'pending' } : {
                        ...existingUser,
                        name: formData.full_name,
                        email: formData.email,
                        aadhaarNumber: formData.aadhaar_number,
                        aadhaarFront: getUrl(formData.aadhaar_front),
                        aadhaarBack: getUrl(formData.aadhaar_back),
                        panNumber: formData.pan_number,
                        panCardImage: getUrl(formData.pan_card_image),
                        partnerApprovalStatus: 'pending'
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUser));

                    toast.success('Application details updated & resubmitted!');
                    updateFormData({ isEditing: false });
                    setStep(1);
                    navigate('/hotel/pending-approval', { replace: true });
                    return;
                } else {
                    const response = await authService.registerPartner({ ...formData, role: 'partner' });
                    if (response?.token) {
                        localStorage.setItem('token', response.token);
                    }
                    if (response?.user) {
                        localStorage.setItem('user', JSON.stringify(response.user));
                    }
                }
                updateFormData({ isEditing: false });
                setStep(1);
                navigate('/hotel/pending-approval', { replace: true });
            } catch (err) {
                setError(err.message || 'Submission failed');
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
                <button onClick={() => {
                    const wasEditing = formData.isEditing || location.search.includes('mode=edit');
                    updateFormData({ isEditing: false });
                    setStep(1);
                    navigate(wasEditing ? '/hotel/pending-approval' : '/hotel/login', { replace: true });
                }} className="p-2"><X size={20} /></button>
                <div className="text-center">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {formData.isEditing ? 'Editing Application' : `Step ${currentStep}`}
                    </p>
                    <h1 className="text-sm font-bold">
                        {formData.isEditing ? 'Update & Resubmit Details' : steps[currentStepIndex]?.title}
                    </h1>
                </div>
                <div className="w-10"></div>
            </header>

            <div className="h-1 bg-gray-50">
                <div className="h-full bg-[#39593f] transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>

            <main className="flex-1 overflow-y-auto p-6 pb-10 max-w-lg mx-auto w-full">
                {error && (
                    <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold shadow-xs">
                        <AlertCircle size={18} className="shrink-0 text-rose-500" />
                        <span>{error}</span>
                    </div>
                )}
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
