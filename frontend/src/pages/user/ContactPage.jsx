import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react';
import { api } from '../../services/apiService';

// These were hardcoded, so nothing edited under CMS -> Footer ever reached this
// page. They remain only as a fallback if the fetch fails.
const FALLBACK_CONTACT = {
  address: 'Flat No. 68, Chotti Gwal Toli, Sarwate Bus Stand, Indore, Madhya Pradesh - 452001',
  email: 'care@mydestination.in',
  phone: '+91-8006787878',
};

const ContactPage = () => {
  const navigate = useNavigate();
  const [contact, setContact] = useState(FALLBACK_CONTACT);

  useEffect(() => {
    let active = true;

    api.get('/cms/landing-page')
      .then((response) => {
        if (!active) return;

        const footer = response?.data?.data?.footer || response?.data?.footer || {};

        setContact((current) => ({
          address: String(footer.address || '').trim() || current.address,
          email: String(footer.email || '').trim() || current.email,
          phone: String(footer.phone || '').trim() || current.phone,
        }));
      })
      .catch(() => {
        // Keep the fallback rather than rendering an empty card.
      });

    return () => { active = false; };
  }, []);

  // tel: links cannot contain spaces or dashes.
  const dialablePhone = String(contact.phone || '').replace(/[^\d+]/g, '');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-surface text-white px-6 pb-12 pt-[calc(env(safe-area-inset-top)+1.5rem)] rounded-b-[30px] shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold">Contact Us</h1>
        </div>
        <p className="text-sm text-white/80 max-w-xs">
          We're here to help you. Reach out to us for any queries or support.
        </p>
      </div>

      <div className="px-5 -mt-6 relative z-10 space-y-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-5 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-surface/5 flex items-center justify-center text-surface shrink-0">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Office Address</p>
              <p className="text-sm font-bold text-gray-800 leading-relaxed">{contact.address}</p>
            </div>
          </div>

          <a
            href={`mailto:${contact.email}`}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 no-underline text-inherit hover:border-surface hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-surface/5 flex items-center justify-center text-surface group-hover:bg-surface group-hover:text-white transition-colors">
              <Mail size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email Support</p>
              <p className="text-sm font-bold text-gray-800 break-all">{contact.email}</p>
            </div>
          </a>

          <a
            href={`tel:${dialablePhone}`}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 no-underline text-inherit hover:border-surface hover:shadow-md transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-surface/5 flex items-center justify-center text-surface group-hover:bg-surface group-hover:text-white transition-colors">
              <Phone size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Call Us</p>
              <p className="text-lg font-bold text-gray-800">{contact.phone}</p>
            </div>
          </a>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center space-y-2">
          <h3 className="font-bold text-gray-800">Business Hours</h3>
          <p className="text-sm text-gray-500 font-medium">Monday - Sunday: 9:00 AM - 9:00 PM</p>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;

