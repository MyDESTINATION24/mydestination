import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../../assets/rokologin-removebg-preview.png';

const WebsiteHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname === '/' || location.pathname === '/home') {
      if (id === 'home') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const element = document.getElementById(id);
        if (element) {
          const yOffset = -90; 
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    } else {
      navigate('/', { state: { scrollTo: id } });
    }
  };

  return (
    <>
      {/* Flat Transparent Navbar */}
      <div className="fixed top-0 left-0 w-full z-[100] px-4 md:px-12 flex items-center bg-white py-1.5 shadow-xl">
        <nav className="flex items-center justify-between w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/" onClick={(e) => handleScrollTo(e, 'home')}>
              <div className="h-10 w-10 md:h-12 md:w-12 overflow-hidden flex-shrink-0">
                <img src={logo} alt="Logo Icon" className="h-full w-full object-cover" />
              </div>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-10 text-[13px] font-medium tracking-widest uppercase text-slate-700">
            <a onClick={(e) => handleScrollTo(e, 'home')} className="relative pb-1 transition-colors hover:text-[#065f46] group cursor-pointer">
              HOME
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#065f46] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a onClick={(e) => handleScrollTo(e, 'feature')} className="relative pb-1 transition-colors hover:text-[#065f46] group cursor-pointer">
              SERVICES
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#065f46] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a onClick={(e) => handleScrollTo(e, 'about')} className="relative pb-1 transition-colors hover:text-[#065f46] group cursor-pointer">
              ABOUT US
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#065f46] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a onClick={(e) => handleScrollTo(e, 'staff')} className="relative pb-1 transition-colors hover:text-[#065f46] group cursor-pointer">
              OUR STAFF
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#065f46] transition-all duration-300 group-hover:w-full"></span>
            </a>
            <Link to="/articles" className="relative pb-1 transition-colors hover:text-[#065f46] group">
              ARTICLES
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#065f46] transition-all duration-300 group-hover:w-full"></span>
            </Link>
            <Link to="/blogs" className="relative pb-1 transition-colors hover:text-[#065f46] group">
              BLOGS
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#065f46] transition-all duration-300 group-hover:w-full"></span>
            </Link>

            {/* Auth Buttons */}
            <div className="flex items-center gap-6 ml-4 border-l pl-8 border-slate-200">
              <Link to="/login" className="transition-colors font-bold hover:text-black">LOGIN</Link>
              <Link to="/signup" className="transition-colors font-bold hover:text-[#065f46]">
                REGISTER
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 transition-colors duration-300 text-slate-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="fixed top-[80px] left-4 right-4 bg-white rounded-xl shadow-2xl z-[100] lg:hidden overflow-hidden border border-gray-100">
          <div className="flex flex-col text-gray-800 font-medium uppercase tracking-widest text-[13px]">
            <a onClick={(e) => handleScrollTo(e, 'home')} className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">HOME</a>
            <a onClick={(e) => handleScrollTo(e, 'feature')} className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">SERVICES</a>
            <a onClick={(e) => handleScrollTo(e, 'about')} className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">ABOUT US</a>
            <a onClick={(e) => handleScrollTo(e, 'staff')} className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">OUR STAFF</a>
            <Link to="/articles" onClick={() => setIsMobileMenuOpen(false)} className="p-4 border-b border-gray-50 hover:bg-gray-50">ARTICLES</Link>
            <a onClick={(e) => handleScrollTo(e, 'blogs')} className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">BLOGS</a>
            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="p-4 border-b border-gray-50 hover:bg-gray-50 font-bold text-[#065f46]">LOGIN</Link>
            <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="p-4 bg-[#065f46] text-white hover:bg-[#04402f] font-bold text-center">REGISTER</Link>
          </div>
        </div>
      )}
    </>
  );
};

export default WebsiteHeader;
