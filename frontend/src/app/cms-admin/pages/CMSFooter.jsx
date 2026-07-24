import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import toast from 'react-hot-toast';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import RichTextEditor from '../../../components/common/RichTextEditor';

// ─── Validation Rules ────────────────────────────────────────────────────────
const RULES = {
  companyName: {
    required: true,
  },
  companyDescription: {
    required: true,
  },
  address: {
    required: true,
  },
  phone: {
    required: false,
    pattern: /^\d{10}$/,
    patternMsg: 'Phone number must be exactly 10 digits',
  },
  whatsapp: {
    required: false,
    pattern: /^\d{10}$/,
    patternMsg: 'WhatsApp number must be exactly 10 digits',
  },
  email: {
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMsg: 'Enter a valid email address',
  },
  paymentNote: {
    required: false,
  },
  copyrightText: {
    required: false,
  },
};

const validate = (field, value) => {
  const rule = RULES[field];
  if (!rule) return null;
  if (rule.required && !value?.replace(/<[^>]*>/g, '')?.trim()) return 'This field is required';
  if (value && rule.pattern && !rule.pattern.test(value))
    return rule.patternMsg;
  return null;
};

const FieldMessage = ({ error }) => {
  if (error) {
    return (
      <p className="flex items-center gap-1 text-[11px] text-red-500 font-semibold mt-1">
        <AlertCircle size={11} /> {error}
      </p>
    );
  }
  return null;
};

// ─── Main Component ──────────────────────────────────────────────────────────
const CMSFooter = () => {
  const [footerData, setFooterData] = useState({
    companyName: 'My DESTINATION',
    companyDescription: 'Your ultimate companion for unforgettable journeys. We provide premium travel services, personalized itineraries, and the best deals for your next adventure.',
    address: '1 My Address, My Street, New York City, NY, USA',
    phone: '',
    whatsapp: '',
    email: '',
    paymentNote: 'The payment is encrypted and transmitted securely with an SSL protocol.',
    copyrightText: '',
    paymentMethods: {
      paypal: true,
      mastercard: true,
      visa: true,
      stripe: true,
      applepay: true,
      googlepay: true,
    }
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiService.get('/cms/landing-page');
      if (res.data?.data?.footer) {
        setFooterData(prev => ({
          ...prev,
          ...res.data.data.footer,
          paymentMethods: {
            ...prev.paymentMethods,
            ...(res.data.data.footer.paymentMethods || {})
          }
        }));
      }
    } catch (error) {
      toast.error('Failed to load footer configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFooterData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const err = validate(field, value);
      setErrors(prev => ({ ...prev, [field]: err }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const err = validate(field, footerData[field]);
    setErrors(prev => ({ ...prev, [field]: err }));
  };

  const isFormValid = () => {
    const fieldsToValidate = ['companyName', 'companyDescription', 'address', 'phone', 'whatsapp', 'email'];
    for (const field of fieldsToValidate) {
      const err = validate(field, footerData[field]);
      if (err) return false;
    }
    return true;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const allTouched = Object.keys(RULES).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const newErrors = {};
    Object.keys(RULES).forEach(k => {
      const err = validate(k, footerData[k]);
      if (err) newErrors[k] = err;
    });
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { footer: footerData });
      toast.success('Footer configuration updated successfully!');
    } catch (error) {
      toast.error('Failed to update footer configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 p-4">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Footer Settings</h2>
        <p className="text-sm text-gray-500">Edit the footer section of the landing page — company info, contact details, and copyright with rich text formatting.</p>
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
              <RichTextEditor
                value={footerData.companyName || ''}
                onChange={(val) => handleChange('companyName', val)}
                placeholder="My DESTINATION"
                minHeight="90px"
              />
              <FieldMessage error={touched.companyName && errors.companyName} />
            </div>

            {/* Company Description */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Company Description <span className="text-red-400">*</span>
              </label>
              <RichTextEditor
                value={footerData.companyDescription || ''}
                onChange={(val) => handleChange('companyDescription', val)}
                placeholder="Short description shown in footer..."
                minHeight="120px"
              />
              <FieldMessage error={touched.companyDescription && errors.companyDescription} />
            </div>
          </div>
        </div>

        {/* ── Contact Info ── */}
        <div>
          <h3 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Contact Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Address */}
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Address <span className="text-red-400">*</span>
              </label>
              <RichTextEditor
                value={footerData.address || ''}
                onChange={(val) => handleChange('address', val)}
                placeholder="1 My Address, My Street, City..."
                minHeight="90px"
              />
              <FieldMessage error={touched.address && errors.address} />
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
                className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">{(footerData.phone || '').length} / 10 digits</p>
              <FieldMessage error={touched.phone && errors.phone} />
              {!errors.phone && footerData.phone && touched.phone && (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                  <CheckCircle2 size={11} /> Valid phone number
                </p>
              )}
            </div>

            {/* WhatsApp */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">WhatsApp Number</label>
              <input
                type="tel"
                value={footerData.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                onBlur={() => handleBlur('whatsapp')}
                placeholder="9876543210"
                maxLength={10}
                inputMode="numeric"
                className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">{(footerData.whatsapp || '').length} / 10 digits</p>
              <FieldMessage error={touched.whatsapp && errors.whatsapp} />
              {!errors.whatsapp && footerData.whatsapp && touched.whatsapp && (
                <p className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold mt-1">
                  <CheckCircle2 size={11} /> Valid WhatsApp number
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
                className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
              <FieldMessage error={touched.email && errors.email} />
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
              <RichTextEditor
                value={footerData.paymentNote || ''}
                onChange={(val) => handleChange('paymentNote', val)}
                placeholder="The payment is encrypted and transmitted securely..."
                minHeight="90px"
              />
              <FieldMessage error={touched.paymentNote && errors.paymentNote} />
            </div>

            {/* Copyright Text */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Copyright Text <span className="text-gray-300 font-normal normal-case">(leave blank for auto year)</span>
              </label>
              <RichTextEditor
                value={footerData.copyrightText || ''}
                onChange={(val) => handleChange('copyrightText', val)}
                placeholder={`© ${new Date().getFullYear()} My DESTINATION. All rights reserved.`}
                minHeight="90px"
              />
              <FieldMessage error={touched.copyrightText && errors.copyrightText} />
            </div>

            {/* Payment Methods Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Show Payment Logos in Footer
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border border-gray-200 bg-gray-50/50 rounded-sm">
                {[
                  { key: 'paypal', label: 'PayPal' },
                  { key: 'mastercard', label: 'Mastercard' },
                  { key: 'visa', label: 'Visa' },
                  { key: 'stripe', label: 'Stripe' },
                  { key: 'applepay', label: 'Apple Pay' },
                  { key: 'googlepay', label: 'Google Pay' },
                ].map((method) => (
                  <label key={method.key} className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!footerData.paymentMethods?.[method.key]}
                      onChange={(e) => {
                        const updated = {
                          ...footerData.paymentMethods,
                          [method.key]: e.target.checked
                        };
                        setFooterData(prev => ({
                          ...prev,
                          paymentMethods: updated
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-medium">{method.label}</span>
                  </label>
                ))}
              </div>
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
