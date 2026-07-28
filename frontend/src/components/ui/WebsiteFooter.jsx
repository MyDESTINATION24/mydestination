import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Phone, MessageCircle, Mail, Facebook, Twitter, Instagram } from 'lucide-react';

const WebsiteFooter = () => {
  const [cmsData, setCmsData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    import('../../services/apiService').then(({ api }) => {
      api.get('/cms/landing-page').then(res => {
        if (res.data?.success) {
          setCmsData(res.data.data);
        }
      }).catch(err => console.error('Failed to load CMS data:', err));
    }).catch(err => console.error('Failed to import api:', err));
  }, []);

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    if (location.pathname === '/' || location.pathname === '/home') {
      if (id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const element = document.getElementById(id);
        if (element) {
          const yOffset = -50;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    } else {
      navigate('/', { state: { scrollTo: id } });
    }
  };

  return (
    <footer className="bg-emerald-950 text-white pt-8 pb-8 px-6 md:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-12">
        {/* Column 1: Contact */}
        <div>
          <h4 className="font-bold text-lg mb-6 tracking-wide">Contact Details</h4>
          <ul className="space-y-3 text-sm text-gray-300">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-emerald-400 mt-1 flex-shrink-0" />
              <span 
                className="leading-relaxed [&_*]:!text-gray-300"
                dangerouslySetInnerHTML={{ __html: cmsData?.footer?.address || '1 My Address, My Street, New York City, NY, USA' }}
              />
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-emerald-400 flex-shrink-0" />
              <a href={`tel:${cmsData?.footer?.phone || '+1 234 567 890'}`} className="hover:text-emerald-400 transition-colors font-medium">
                {cmsData?.footer?.phone || '+1 234 567 890'}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <MessageCircle size={18} className="text-emerald-400 flex-shrink-0" />
              <a
                href={`https://wa.me/${(cmsData?.footer?.whatsapp || cmsData?.footer?.phone || '+1234567890').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors font-medium"
              >
                {cmsData?.footer?.whatsapp || cmsData?.footer?.phone || '+1 234 567 890'}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-emerald-400 flex-shrink-0" />
              <a href={`mailto:${cmsData?.footer?.email || 'info@mydestination.com'}`} className="hover:text-emerald-400 transition-colors font-medium">
                {cmsData?.footer?.email || 'info@mydestination.com'}
              </a>
            </li>
          </ul>
        </div>

        {/* Column 2: Useful Links */}
        <div>
          <h4 className="font-bold text-lg mb-6 tracking-wide">Useful links</h4>
          <ul className="space-y-3 text-sm text-gray-300">
            <li>
              <a onClick={(e) => handleScrollTo(e, 'home')} className="hover:text-emerald-400 transition-colors block cursor-pointer">Home</a>
            </li>
            <li>
              <a onClick={(e) => handleScrollTo(e, 'about')} className="hover:text-emerald-400 transition-colors block cursor-pointer">About Us</a>
            </li>
            <li>
              <a onClick={(e) => handleScrollTo(e, 'staff')} className="hover:text-emerald-400 transition-colors block cursor-pointer">Our Team</a>
            </li>
            <li>
              <Link to="/help" className="hover:text-emerald-400 transition-colors block">Contact Us</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Important Links */}
        <div>
          <h4 className="font-bold text-lg mb-6 tracking-wide">Important Links</h4>
          <ul className="space-y-3 text-sm text-gray-300">
            <li>
              <Link to="/terms" className="hover:text-emerald-400 transition-colors block">Terms &amp; Conditions</Link>
            </li>
            <li>
              <Link to="/refund-policy" className="hover:text-emerald-400 transition-colors block">Return &amp; Refund Policy</Link>
            </li>
            <li>
              <Link to="/privacy-policy" className="hover:text-emerald-400 transition-colors block">Privacy Policy</Link>
            </li>
          </ul>
        </div>

        {/* Column 4: About Company */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'min-content' }}>
            {(() => {
              const rawName = cmsData?.footer?.companyName || 'My DESTINATION';
              const cleanName = typeof rawName === 'string' ? rawName.replace(/<[^>]*>/g, '').trim() || 'My DESTINATION' : 'My DESTINATION';
              return (
                <h4 style={{ whiteSpace: 'nowrap' }} className="font-bold text-lg mb-2 tracking-wide">
                  {cleanName.toLowerCase().startsWith('about') ? cleanName : `About ${cleanName}`}
                </h4>
              );
            })()}
            <div 
              className="text-xs text-gray-300 leading-relaxed mb-6 [&_*]:!text-gray-300"
              dangerouslySetInnerHTML={{ __html: cmsData?.footer?.companyDescription || 'My DESTINATION - Wed in India | Event Planners. We make your special moments unforgettable with customized details and premium services.' }}
            />
          </div>
          <div>
            <h5 className="font-bold text-xs uppercase tracking-wider text-emerald-400 mb-3">Connect with Us</h5>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all text-gray-300" aria-label="Facebook">
                <Facebook size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all text-gray-300" aria-label="Twitter">
                <Twitter size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-emerald-900/60 border border-emerald-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all text-gray-300" aria-label="Instagram">
                <Instagram size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-gray-200 py-2 -mx-6 -mb-8 md:-mx-8 md:-mb-8 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:grid md:grid-cols-4 items-center gap-2 md:gap-8 w-full">
          <p className="m-0 text-[8px] text-[#065f46] font-medium text-center md:text-left md:col-span-3">
            Copyright &copy; {new Date().getFullYear()}{' '}
            <strong className="text-[#065f46] font-bold text-[9px] tracking-wide">My DESTINATION<sup className="text-[6px]">®</sup></strong>
            {' '}<span className="font-medium">| All Rights Reserved.</span>
          </p>
          <div className="flex items-center justify-center md:justify-start flex-nowrap gap-1 md:col-span-1">
            {(cmsData?.footer?.paymentMethods?.googlepay !== false) && (
              <div style={{ background: '#f8f9fa', borderRadius: '3px', padding: '1px 3px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '24px', border: '1px solid #e5e7eb' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" style={{ height: '7px', objectFit: 'contain' }} />
              </div>
            )}
            {(cmsData?.footer?.paymentMethods?.paypal !== false) && (
              <div style={{ background: '#172b85', borderRadius: '3px', padding: '1px 3px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '22px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" style={{ height: '6px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
            )}
            {(cmsData?.footer?.paymentMethods?.mastercard !== false) && (
              <div style={{ background: '#1a1a1a', borderRadius: '3px', padding: '1px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '24px' }}>
                <div style={{ position: 'relative', width: '15px', height: '9px', display: 'flex', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eb001b', position: 'absolute', left: '0' }}></div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f79e1b', position: 'absolute', left: '4px', opacity: 0.9 }}></div>
                </div>
              </div>
            )}
            {(cmsData?.footer?.paymentMethods?.visa !== false) && (
              <div style={{ background: '#1a56db', borderRadius: '3px', padding: '1px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '24px' }}>
                <span style={{ color: '#ffffff', fontWeight: 800, fontStyle: 'italic', fontSize: '7px', fontFamily: 'Arial, sans-serif', letterSpacing: '0.3px' }}>VISA</span>
              </div>
            )}
            {(cmsData?.footer?.paymentMethods?.stripe !== false) && (
              <div style={{ background: '#635bff', borderRadius: '3px', padding: '1px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '24px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" style={{ height: '5px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
            )}
            {(cmsData?.footer?.paymentMethods?.applepay !== false) && (
              <div style={{ background: '#000000', borderRadius: '3px', padding: '1px 4px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '12px', minWidth: '28px' }}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg" alt="Apple Pay" style={{ height: '6px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WebsiteFooter;
