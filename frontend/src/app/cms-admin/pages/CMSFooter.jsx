import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

// ─── Validation Rules ────────────────────────────────────────────────────────
const RULES = {
  companyName: {
    required: true,
    maxLen: 60,
    pattern: /^[a-zA-Z0-9\s\-_.&']+$/,
    patternMsg: 'Only letters, numbers, spaces and basic symbols allowed',
  },
  companyDescription: {
    required: true,
    maxLen: 300,
  },
  address: {
    required: true,
    maxLen: 150,
  },
  phone: {
    required: false,
    pattern: /^\d{10}$/,
    patternMsg: 'Phone number must be exactly 10 digits',
  },
  email: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMsg: 'Enter a valid email address',
  },
  paymentNote: {
    required: false,
    maxLen: 200,
  },
  copyrightText: {
    required: false,
    maxLen: 120,
  },
};

const validate = (field, value) => {
  const rule = RULES[field];
  if (!rule) return null;
  if (rule.required && !value?.trim()) return 'This field is required';
  if (value && rule.maxLen && value.length > rule.maxLen)
    return `Max ${rule.maxLen} characters allowed (${value.length}/${rule.maxLen})`;
  if (value && rule.pattern && !rule.pattern.test(value))
    return rule.patternMsg;
  return null;
};

const FieldMessage = ({ error, value, maxLen }) => {
  if (error) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-red-500 font-semibold mt-1">
        <AlertCircle size={11} /> {error}
      </p>
    );
  }
  if (value && maxLen) {
    const pct = value.length / maxLen;
    const color = pct > 0.9 ? 'text-red-400' : pct > 0.7 ? 'text-amber-500' : 'text-gray-400';
    return (
      <p className={`text-[11px] mt-1 text-right ${color}`}>
        {value.length} / {maxLen}
      </p>
    );
  }
  return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const CMSFooter = () => {
  const [footerData, setFooterData] = useState({
    companyName: 'MyDESTINATION',
    companyDescription: 'Your ultimate companion for unforgettable journeys. We provide premium travel services, personalized itineraries, and the best deals for your next adventure.',
    address: '1 My Address, My Street, New York City, NY, USA',
    phone: '',
    email: '',
    paymentNote: 'The payment is encrypted and transmitted securely with an SSL protocol.',
    copyrightText: '',
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiService.get('/cms/landing-page');
      if (res.data?.data?.footer) {
        setFooterData(prev => ({ ...prev, ...res.data.data.footer }));
      }
    } catch {
      toast.error('Failed to load footer configuration');
    } finally {
      setLoading(false);
    }
  };

  // Live validation on every change
  const handleChange = (field, value) => {
    // Phone: block non-numeric non-special chars while typing
    if (field === 'phone') {
      // Allow only digits, hard block after 10
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFooterData(prev => ({ ...prev, [field]: cleaned }));
      setErrors(prev => ({ ...prev, [field]: validate(field, cleaned) }));
      setTouched(prev => ({ ...prev, [field]: true }));
      return;
    }

    // MaxLen hard-block: don't allow more chars than limit
    const rule = RULES[field];
    if (rule?.maxLen && value.length > rule.maxLen) return;

    setFooterData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors(prev => ({ ...prev, [field]: validate(field, value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validate(field, footerData[field]) }));
  };

  const isFormValid = () => {
    const allErrors = Object.keys(RULES).map(f => validate(f, footerData[f]));
    return allErrors.every(e => e === null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Mark all fields touched and show all errors on submit
    const newTouched = Object.fromEntries(Object.keys(RULES).map(f => [f, true]));
    const newErrors = Object.fromEntries(Object.keys(RULES).map(f => [f, validate(f, footerData[f])]));
    setTouched(newTouched);
    setErrors(newErrors);
    if (Object.values(newErrors).some(e => e !== null)) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { footer: footerData });
      toast.success('Footer updated successfully!');
    } catch {
      toast.error('Failed to update footer');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (field) => {
    const hasError = touched[field] && errors[field];
    const isValid = touched[field] && !errors[field] && footerData[field];
    return `w-full border p-3 text-sm focus:outline-none transition ${
      hasError
        ? 'border-red-400 bg-red-50 focus:border-red-500'
        : isValid
        ? 'border-emerald-400 bg-emerald-50/30 focus:border-emerald-500'
        : 'border-gray-200 focus:border-emerald-500'
    }`;
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Footer Settings</h2>
        <p className="text-sm text-gray-500">Edit the footer section of the landing page — company info, contact details, and copyright.</p>
      </div>

      <form onSubmit={handleSave} noValidate className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-6">

        {/* ── Company Info ── */}
        <div>
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Company Info</h3>
          <div className="grid grid-cols-1 gap-5">

            {/* Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={footerData.companyName || ''}
                onChange={(e) => handleChange('companyName', e.target.value)}
                onBlur={() => handleBlur('companyName')}
                placeholder="MyDESTINATION"
                className={inputClass('companyName')}
              />
              <FieldMessage error={touched.companyName && errors.companyName} value={footerData.companyName} maxLen={RULES.companyName.maxLen} />
            </div>

            {/* Company Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Company Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={footerData.companyDescription || ''}
                onChange={(e) => handleChange('companyDescription', e.target.value)}
                onBlur={() => handleBlur('companyDescription')}
                rows={3}
                placeholder="Short description shown in footer..."
                className={`${inputClass('companyDescription')} resize-none`}
              />
              <FieldMessage error={touched.companyDescription && errors.companyDescription} value={footerData.companyDescription} maxLen={RULES.companyDescription.maxLen} />
            </div>
          </div>
        </div>

        {/* ── Contact Info ── */}
        <div>
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Contact Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Address */}
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Address <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={footerData.address || ''}
                onChange={(e) => handleChange('address', e.target.value)}
                onBlur={() => handleBlur('address')}
                placeholder="1 My Address, My Street, City..."
                className={inputClass('address')}
              />
              <FieldMessage error={touched.address && errors.address} value={footerData.address} maxLen={RULES.address.maxLen} />
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
              <input
                type="tel"
                value={footerData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
                onBlur={() => handleBlur('phone')}
                placeholder="9876543210"
                maxLength={10}
                inputMode="numeric"
                className={inputClass('phone')}
              />
              <p className="text-[10px] text-gray-400 mt-0.5">{(footerData.phone || '').length} / 10 digits</p>
              <FieldMessage error={touched.phone && errors.phone} value={null} maxLen={null} />
              {!errors.phone && footerData.phone && touched.phone && (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                  <CheckCircle2 size={11} /> Valid phone number
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
              <input
                type="text"
                value={footerData.email || ''}
                onChange={(e) => handleChange('email', e.target.value.trim())}
                onBlur={() => handleBlur('email')}
                placeholder="contact@mydestination.com"
                className={inputClass('email')}
              />
              <FieldMessage error={touched.email && errors.email} value={null} maxLen={null} />
              {!errors.email && footerData.email && touched.email && (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                  <CheckCircle2 size={11} /> Valid email address
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Payment & Copyright ── */}
        <div>
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Payment & Copyright</h3>
          <div className="grid grid-cols-1 gap-5">

            {/* Payment Note */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Payment Note <span className="text-gray-300 font-normal normal-case">(shown under "Pay safely with us")</span>
              </label>
              <input
                type="text"
                value={footerData.paymentNote || ''}
                onChange={(e) => handleChange('paymentNote', e.target.value)}
                onBlur={() => handleBlur('paymentNote')}
                placeholder="The payment is encrypted and transmitted securely..."
                className={inputClass('paymentNote')}
              />
              <FieldMessage error={touched.paymentNote && errors.paymentNote} value={footerData.paymentNote} maxLen={RULES.paymentNote.maxLen} />
            </div>

            {/* Copyright Text */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Copyright Text <span className="text-gray-300 font-normal normal-case">(leave blank for auto year)</span>
              </label>
              <input
                type="text"
                value={footerData.copyrightText || ''}
                onChange={(e) => handleChange('copyrightText', e.target.value)}
                onBlur={() => handleBlur('copyrightText')}
                placeholder={`© ${new Date().getFullYear()} MyDESTINATION. All rights reserved.`}
                className={inputClass('copyrightText')}
              />
              <FieldMessage error={touched.copyrightText && errors.copyrightText} value={footerData.copyrightText} maxLen={RULES.copyrightText.maxLen} />
            </div>
          </div>
        </div>

        {/* ── Save Button ── */}
        <div className="pt-4 flex items-center justify-between">
          {!isFormValid() && Object.values(touched).some(Boolean) && (
            <p className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
              <AlertCircle size={13} /> Fix errors above before saving
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="ml-auto bg-emerald-600 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CMSFooter;
