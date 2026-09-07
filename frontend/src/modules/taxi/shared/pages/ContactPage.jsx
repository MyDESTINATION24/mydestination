import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, MapPin, Clock } from 'lucide-react';
import { api } from '../../../../services/apiService';

const FALLBACK = {
  phone: '+91-8006787878',
  email: 'care@mydestination.in',
  address: 'Flat No. 68, Chotti Gwal Toli, Sarwate Bus Stand, Indore, Madhya Pradesh - 452001',
};

const ContactPage = () => {
  const navigate = useNavigate();
  const [contact, setContact] = useState(FALLBACK);

  useEffect(() => {
    let active = true;
    api.get('/cms/landing-page')
      .then((res) => {
        if (!active) return;
        const footer = res?.data?.data?.footer || res?.data?.footer || {};
        setContact((c) => ({
          phone: String(footer.phone || '').trim() || c.phone,
          email: String(footer.email || '').trim() || c.email,
          address: String(footer.address || '').trim() || c.address,
        }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const dialablePhone = String(contact.phone || '').replace(/[^\d+]/g, '');

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-all">
              <ArrowLeft size={20} />
            </button>
            <span className="font-bold text-sm uppercase tracking-widest text-gray-800">Contact Us</span>
        </div>
      </div>

      <div className="bg-[#1a1a1a] text-white pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
                We're Here to <span className="text-[#FFB300]">Help</span>
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                Got a question or need assistance? Reach out to our dedicated support team.
            </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <a href={`tel:${dialablePhone}`} className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center no-underline text-inherit">
                <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-6">
                    <Phone className="text-[#FFB300]" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Phone Support</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">
                    Call us anytime for immediate assistance with your rides or account.
                </p>
                <p className="text-3xl font-black text-[#1a1a1a]">{contact.phone}</p>
            </a>

            <a href={`mailto:${contact.email}`} className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center no-underline text-inherit">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                    <Mail className="text-gray-800" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Email Us</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">
                    Prefer writing? Send us an email and our team will get back to you shortly.
                </p>
                <p className="text-2xl font-bold text-[#FFB300]">{contact.email}</p>
            </a>

            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
                    <MapPin className="text-gray-800" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Office</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">
                    {contact.address}
                </p>
            </div>

            <div className="bg-white p-10 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-yellow-50 rounded-2xl flex items-center justify-center mb-6">
                    <Clock className="text-[#FFB300]" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4">Operating Hours</h3>
                <p className="text-gray-500 mb-6 leading-relaxed">
                    Our platform operates 24 hours a day, 7 days a week. Support is always online.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
