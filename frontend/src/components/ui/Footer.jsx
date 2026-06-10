import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Mail, Phone } from 'lucide-react';
import { isWebView } from '../../utils/deviceDetect';

const Footer = () => {
    return (
        <footer className="hidden md:block bg-black text-white pt-4 md:pt-16 pb-24 md:pb-8 px-8 md:px-16 lg:px-24">
            <div className="hidden md:grid max-w-7xl mx-auto grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-8">


                {/* Quick Links */}
                <div className="space-y-6">
                    <ul className="flex flex-col gap-3 text-sm font-medium text-gray-300">
                        <li><Link to="/" className="hover:text-surface transition-colors">Home</Link></li>
                        <li><Link to="/about" className="hover:text-surface transition-colors">About Us</Link></li>
                        {!isWebView() && (
                            <li><Link to="/blogs" className="hover:text-surface transition-colors">Blogs</Link></li>
                        )}
                        <li><Link to="/careers" className="hover:text-surface transition-colors">Careers</Link></li>
                        <li><Link to="/contact" className="hover:text-surface transition-colors">Contact Us</Link></li>
                        <li><Link to="/terms" className="hover:text-surface transition-colors">Terms & Conditions</Link></li>
                        <li><Link to="/privacy" className="hover:text-surface transition-colors">Privacy Policy</Link></li>
                    </ul>
                </div>

                {/* Follow Us */}
                <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Follow Us</h3>
                    <div className="flex gap-5">
                        <a href="https://www.instagram.com/My DESTINATION?igsh=YWk5ZjllNGlmbXoz" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition-colors">
                            <Instagram size={20} className="text-gray-300" />
                        </a>
                        <a href="#" className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition-colors">
                            <Facebook size={20} className="text-gray-300" />
                        </a>
                        <a href="#" className="p-2 bg-gray-900 rounded-full hover:bg-gray-800 transition-colors">
                            <Youtube size={20} className="text-gray-300" />
                        </a>
                    </div>
                </div>

                {/* Contact Us */}
                <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Contact Us</h3>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Office Address:</span>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Flat No. 68, Chotti Gwal Toli,<br />
                                Sarwate Bus Stand, Indore,<br />
                                Madhya Pradesh - 452001
                            </p>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Email:</span>
                            <a href="mailto:rajnishpanchal.fr@gmail.com" className="text-sm text-gray-300 hover:text-surface transition-colors break-all">
                                rajnishpanchal.fr@gmail.com
                            </a>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Phone:</span>
                            <a href="tel:+919111384541" className="text-sm text-gray-300 hover:text-surface transition-colors">
                                +91-9111384541
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 md:mt-20 pt-4 md:pt-8 border-t border-gray-900 text-center">
                <p className="text-[10px] md:text-xs text-gray-600 font-medium">
                    &copy; {new Date().getFullYear()} Premium Traders. My DESTINATION All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
