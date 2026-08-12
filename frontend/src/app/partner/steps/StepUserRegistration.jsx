import React, { useState, useEffect } from 'react';
import usePartnerStore from '../store/partnerStore';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, AlertCircle, User, Mail, Phone, X, Shield, Loader2 } from 'lucide-react';
import { legalService } from '../../../services/apiService';

const StepUserRegistration = () => {
  const { formData, updateFormData } = usePartnerStore();
  const location = useLocation();
  const isEditingMode = !!formData.isEditing || location.search.includes('mode=edit');
  const [touched, setTouched] = useState({ full_name: false, email: false, phone: false });
  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null
  const [modalData, setModalData] = useState({ loading: false, title: '', content: '' });

  // Load Legal Content when modal opens
  useEffect(() => {
    if (!activeModal) return;

    let isMounted = true;
    const fetchLegal = async () => {
      setModalData({ loading: true, title: activeModal === 'terms' ? 'Terms & Conditions' : 'Privacy Policy', content: '' });
      try {
        const res = await legalService.getPage('partner', activeModal);
        if (!isMounted) return;
        if (res?.page?.content) {
          setModalData({
            loading: false,
            title: res.page.title || (activeModal === 'terms' ? 'Partner Terms & Conditions' : 'Partner Privacy Policy'),
            content: res.page.content
          });
        } else {
          throw new Error('No custom content');
        }
      } catch (e) {
        if (!isMounted) return;
        const defaultCopy = activeModal === 'terms'
          ? `1. Relationship with My DESTINATION\nBy listing your property on My DESTINATION, you agree to act as an independent service provider. My DESTINATION acts solely as an intermediary platform to connect you with guests.\n\n2. Payouts & Commission\nMy DESTINATION charges a flat commission on completed bookings. Payouts are processed on scheduled payout cycles for previous check-outs.\n\n3. Cancellation Policy\nPartners must adhere to the cancellation policy selected during property listing. Any penalties for guest cancellations will be shared as per platform rules.\n\n4. Quality Standards\nYou agree to maintain property standards as verified during onboarding. Consistent negative feedback or failure to honor bookings may result in account review.`
          : `We store and process your property data, bookings, and payout information securely, and only use it to power your partner dashboard, verify partner credentials, and process payments.`;
        setModalData({
          loading: false,
          title: activeModal === 'terms' ? 'Partner Terms & Conditions' : 'Partner Privacy Policy',
          content: defaultCopy
        });
      }
    };

    fetchLegal();
    return () => { isMounted = false; };
  }, [activeModal]);

  // Field Validations
  const isNameValid = /^[a-zA-Z\s]{3,50}$/.test((formData.full_name || '').trim());
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((formData.email || '').trim());
  const isPhoneValid = /^[6-9]\d{9}$/.test(formData.phone || '');

  const handleNameChange = (e) => {
    const cleanValue = e.target.value.replace(/[^a-zA-Z\s]/g, '');
    updateFormData({ full_name: cleanValue });
    setTouched(prev => ({ ...prev, full_name: true }));
  };

  const handleEmailChange = (e) => {
    const cleanValue = e.target.value.toLowerCase().trim();
    updateFormData({ email: cleanValue });
    setTouched(prev => ({ ...prev, email: true }));
  };

  const handlePhoneChange = (e) => {
    const cleanValue = e.target.value.replace(/\D/g, '').slice(0, 10);
    updateFormData({ phone: cleanValue });
    setTouched(prev => ({ ...prev, phone: true }));
  };

  return (
    <div className="space-y-4">
      {/* Full Name */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-gray-700">Full Name</label>
          <span className="text-[10px] text-gray-400">Letters only</span>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <User size={16} />
          </div>
          <input
            className={`w-full border rounded-xl pl-9 pr-10 py-2.5 text-sm transition-all focus:outline-none ${
              touched.full_name
                ? isNameValid
                  ? 'border-emerald-500 bg-emerald-50/20 text-gray-900 focus:ring-2 focus:ring-emerald-500/20'
                  : 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-2 focus:ring-rose-400/20'
                : 'border-gray-200 focus:ring-2 focus:ring-[#39593f]/20 focus:border-[#39593f]'
            }`}
            placeholder="Enter your full name (e.g. Rahul Sharma)"
            value={formData.full_name || ''}
            onChange={handleNameChange}
            onBlur={() => setTouched(prev => ({ ...prev, full_name: true }))}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {touched.full_name && (
              isNameValid ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-rose-400" />
            )}
          </div>
        </div>
        {touched.full_name && !isNameValid && (
          <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
            Full name must contain at least 3 letters (only alphabets allowed)
          </p>
        )}
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-bold text-gray-700 mb-1">Business Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Mail size={16} />
          </div>
          <input
            type="email"
            className={`w-full border rounded-xl pl-9 pr-10 py-2.5 text-sm transition-all focus:outline-none ${
              touched.email
                ? isEmailValid
                  ? 'border-emerald-500 bg-emerald-50/20 text-gray-900 focus:ring-2 focus:ring-emerald-500/20'
                  : 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-2 focus:ring-rose-400/20'
                : 'border-gray-200 focus:ring-2 focus:ring-[#39593f]/20 focus:border-[#39593f]'
            }`}
            placeholder="name@business.com"
            value={formData.email || ''}
            onChange={handleEmailChange}
            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            {touched.email && (
              isEmailValid ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-rose-400" />
            )}
          </div>
        </div>
        {touched.email && !isEmailValid && (
          <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
            Please enter a valid email address (e.g. partner@mydestination.com)
          </p>
        )}
      </div>

      {/* Phone Number */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs font-bold text-gray-700">Mobile Number</label>
          {isEditingMode && (
            <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
              🔒 Primary Login ID (Locked)
            </span>
          )}
        </div>
        <div className={`flex items-center border rounded-xl overflow-hidden transition-all focus-within:ring-2 ${
          isEditingMode
            ? 'bg-gray-100/70 border-gray-200 cursor-not-allowed'
            : touched.phone
              ? isPhoneValid
                ? 'border-emerald-500 focus-within:ring-emerald-500/20'
                : 'border-rose-400 focus-within:ring-rose-400/20'
              : 'border-gray-200 focus-within:ring-[#39593f]/20 focus-within:border-[#39593f]'
        }`}>
          <div className="px-3 py-2.5 bg-gray-50 border-r border-gray-200 text-xs font-bold text-gray-600 flex items-center gap-1">
            <Phone size={14} className="text-gray-400" />
            +91
          </div>
          <input
            type="tel"
            maxLength={10}
            disabled={isEditingMode}
            className={`flex-1 px-3 py-2.5 text-sm focus:outline-none placeholder:text-gray-300 font-mono tracking-wider ${
              isEditingMode ? 'bg-transparent text-gray-500 cursor-not-allowed select-none' : 'bg-transparent'
            }`}
            placeholder="10-digit mobile number"
            value={formData.phone || ''}
            onChange={handlePhoneChange}
            onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
          />
          <div className="pr-3 flex items-center pointer-events-none">
            {isEditingMode ? (
              <CheckCircle2 size={16} className="text-emerald-500" />
            ) : touched.phone && (
              isPhoneValid ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-rose-400" />
            )}
          </div>
        </div>
        {!isEditingMode && touched.phone && !isPhoneValid && (
          <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
            Enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9
          </p>
        )}
      </div>

      {/* Terms & Conditions Checkbox */}
      <div className="pt-2">
        <div className="flex items-start gap-2.5">
          <input
            id="terms"
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#39593f] focus:ring-[#39593f] cursor-pointer"
            checked={!!formData.termsAccepted}
            onChange={e => updateFormData({ termsAccepted: e.target.checked })}
          />
          <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none">
            I agree to the{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('terms');
              }}
              className="text-[#39593f] font-bold underline hover:opacity-80"
            >
              Terms & Conditions
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('privacy');
              }}
              className="text-[#39593f] font-bold underline hover:opacity-80"
            >
              Privacy Policy
            </button>{' '}
            of My DESTINATION Partner.
          </label>
        </div>
      </div>

      {/* Legal Popup Modal */}
      {activeModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-6 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#39593f]/10 text-[#39593f] flex items-center justify-center">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{modalData.title}</h3>
                  <p className="text-[10px] text-gray-400">My DESTINATION Partner Legal Agreement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-full hover:bg-gray-200/60 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 text-xs text-gray-600 leading-relaxed space-y-3">
              {modalData.loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <Loader2 size={24} className="animate-spin text-[#39593f]" />
                  <span className="text-xs font-medium">Loading document...</span>
                </div>
              ) : (
                modalData.content.split('\n').map((paragraph, idx) => (
                  <p key={idx} className={paragraph.trim().startsWith('1.') || paragraph.trim().startsWith('2.') || paragraph.trim().startsWith('3.') || paragraph.trim().startsWith('4.') ? 'font-bold text-gray-900 pt-2' : ''}>
                    {paragraph}
                  </p>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2.5 text-xs font-bold text-gray-600 bg-gray-200/70 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  updateFormData({ termsAccepted: true });
                  setActiveModal(null);
                }}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-[#39593f] hover:bg-[#2d4632] rounded-xl shadow-sm transition-colors"
              >
                I Agree & Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepUserRegistration;
