import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send, AlertCircle, Phone, HelpCircle, Search, Clock, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { weddingService } from '../../../services/weddingService';

const HelpSupportPage = () => {
  const [formData, setFormData] = useState({
    user: '',
    subject: '',
    priority: 2
  });
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('mySupportTickets');
    if (saved) {
      try {
        const parsedIds = JSON.parse(saved);
        setRecentTickets(parsedIds);
      } catch (e) {
        console.error('Failed to parse saved tickets');
      }
    }
  }, []);

  // Removed smooth scrolling since we have a dedicated page now

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user.trim() || !formData.subject.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setLoading(true);
      const res = await weddingService.createSupportTicket(formData);
      setSubmittedTicket(res.data);
      
      // Save to localStorage
      const updatedTickets = [res.data.ticketId, ...recentTickets.filter(id => id !== res.data.ticketId)].slice(0, 5);
      setRecentTickets(updatedTickets);
      localStorage.setItem('mySupportTickets', JSON.stringify(updatedTickets));

      toast.success('Ticket submitted successfully!');
      setFormData({ user: '', subject: '', priority: 2 });
    } catch (error) {
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent md:pt-12 pt-3 pb-8">
      <div className="container mx-auto px-4 max-w-5xl">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary mb-2"
          >
            <HelpCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Help & Support</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-3xl font-bold text-slate-800 mb-2 leading-tight"
          >
            How can we <span className="text-primary italic">help you?</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-[11px] md:text-sm max-w-xl mx-auto"
          >
            Have a question or facing an issue? Raise a ticket below and our support team will get back to you as soon as possible.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-5 gap-4 md:gap-6">
          {/* Contact Info */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 space-y-3"
          >
            <div className="bg-white/70 backdrop-blur-md p-4 md:p-5 rounded-[1.25rem] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 relative overflow-hidden group hover:shadow-[0_15px_40px_-15px_rgba(157,49,61,0.12)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
              <div className="h-9 w-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
                <Mail size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-0.5">Email Us</h3>
              <p className="text-[11px] text-slate-500 mb-2">For general queries and support</p>
              <a href="mailto:care@mydestination.in" className="text-sm font-bold text-primary hover:underline">
                care@mydestination.in
              </a>
            </div>

            <div className="bg-white/70 backdrop-blur-md p-4 md:p-5 rounded-[1.25rem] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 relative overflow-hidden group hover:shadow-[0_15px_40px_-15px_rgba(157,49,61,0.12)] hover:-translate-y-1 transition-all duration-300">
              <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
              <div className="h-9 w-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-3">
                <Phone size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-0.5">Call Us</h3>
              <p className="text-[11px] text-slate-500 mb-2">Mon-Fri from 9am to 6pm</p>
              <a href="tel:+918006787878" className="text-sm font-bold text-primary hover:underline">
                +91 98765 43210
              </a>
            </div>
          </motion.div>

          {/* Ticket Form */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-3 bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-[1.5rem] shadow-[0_10px_30px_-15px_rgba(157,49,61,0.08)] border border-slate-100/50"
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="text-primary" size={20} />
              <h2 className="text-lg font-bold text-slate-800">Raise a Ticket</h2>
            </div>

            {submittedTicket ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center animate-in zoom-in-95 duration-300">
                <div className="mx-auto w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-0.5">Ticket Submitted!</h3>
                <p className="text-[11px] text-slate-600 mb-3">We have received your request. Please save your Ticket ID to track its status.</p>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 inline-block mb-4">
                  <p className="text-[9px] text-slate-500 font-bold mb-0.5 uppercase tracking-widest">Your Ticket ID</p>
                  <p className="text-xl font-black text-primary font-mono">{submittedTicket.ticketId}</p>
                </div>
                <button
                  onClick={() => setSubmittedTicket(null)}
                  className="w-full py-2.5 bg-slate-800 text-white rounded-lg font-bold text-sm hover:bg-slate-900 transition-all active:scale-[0.98]"
                >
                  Submit Another Ticket
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.user}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[a-zA-Z\s]*$/.test(val)) {
                        setFormData({...formData, user: val});
                      }
                    }}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Issue / Message</label>
                  <textarea
                    placeholder="Describe your issue in detail..."
                    rows="3"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-xs"
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Priority Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 3, label: 'Low', activeClass: 'bg-green-700 border-green-700 text-white shadow-md shadow-green-200' },
                      { val: 2, label: 'Normal', activeClass: 'bg-[#81313A] border-[#81313A] text-white shadow-md shadow-[#81313A]/20' },
                      { val: 1, label: 'Critical', activeClass: 'bg-red-700 border-red-700 text-white shadow-md shadow-red-200' }
                    ].map((p) => (
                      <button
                        key={p.val}
                        type="button"
                        onClick={() => setFormData({...formData, priority: p.val})}
                        className={`py-1.5 rounded-lg font-bold text-[10px] transition-all duration-200 border-2 ${
                          formData.priority === p.val
                            ? p.activeClass
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-1.5">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary-dark transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        Submit Ticket
                      </>
                    )}
                  </button>
                  <p className="text-center text-[9px] text-slate-400 mt-2 flex items-center justify-center gap-0.5">
                    <AlertCircle size={9} /> Our team usually responds within 24 hours.
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default HelpSupportPage;
