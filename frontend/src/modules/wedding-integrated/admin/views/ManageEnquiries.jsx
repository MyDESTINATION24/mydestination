import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminStyles } from '../theme/themeConfig';
import { Filter, Search, CheckCircle2, Circle, Trash2, Eye, X } from 'lucide-react';
import { weddingService } from '../../../../services/weddingService';

const formatMessage = (msg, isModal = false) => {
  if (!msg) return <span className="text-gray-400 italic">No details provided</span>;
  const match = msg.match(/\[Interested In: (.*?)\]([\s\S]*)/);
  if (match) {
    const packageInfo = match[1].trim();
    const userMsg = match[2].trim();
    return (
      <div className={`flex flex-col ${isModal ? 'gap-2' : 'gap-1'}`}>
        {packageInfo && <span className={`font-bold ${isModal ? 'text-sm' : 'text-[10px]'} text-[hsl(353,45%,35%)] bg-[hsl(353,45%,35%)]/10 px-2 py-0.5 rounded uppercase tracking-wider w-fit`}>{packageInfo}</span>}
        {userMsg && <span className={`${isModal ? 'text-base' : 'text-xs line-clamp-2'} text-gray-600 whitespace-pre-wrap leading-snug`}>{userMsg}</span>}
      </div>
    );
  }
  return <p className={`${isModal ? 'text-base whitespace-pre-wrap' : 'text-xs line-clamp-2 whitespace-normal'} text-gray-600 leading-snug`}>{msg}</p>;
};

const TABS = [
  { label: 'ALL', value: 'All' },
  { label: 'NEW ENQUIRIES', value: 'New' },
  { label: 'CONTACTED', value: 'Contacted' },
  { label: 'ACCEPTED', value: 'Accepted' },
  { label: 'BOOKED', value: 'Booked' },
  { label: 'COMPLETED', value: 'Completed' },
  { label: 'LOST', value: 'Lost' },
];

const ManageEnquiries = () => {
  const [searchParams] = useSearchParams();
  const [statusFilter, setStatusFilter] = useState('All');
  const [allEnquiries, setAllEnquiries] = useState([]);  // Full dataset — fetched once
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Fetch ALL enquiries only once on mount
  useEffect(() => {
    fetchEnquiries();
  }, []);

  // Auto-open enquiry if ?id=... is passed from dashboard
  useEffect(() => {
    const enquiryId = searchParams.get('id');
    if (enquiryId && allEnquiries.length > 0) {
      const found = allEnquiries.find(e => e._id === enquiryId);
      if (found) setSelectedEnquiry(found);
    }
  }, [searchParams, allEnquiries]);

  const fetchEnquiries = async () => {
    try {
      setLoading(true);
      // Always fetch all — tabs filter client-side (no reload on tab click)
      const data = await weddingService.getAdminEnquiries({});
      setAllEnquiries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      setAllEnquiries([]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filter — no API call on tab switch
  const enquiries = statusFilter === 'All'
    ? allEnquiries
    : allEnquiries.filter(e => e.status === statusFilter);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await weddingService.updateEnquiryStatus(id, newStatus);
      // Update locally — no full reload, no flicker
      setAllEnquiries(prev =>
        prev.map(e => e._id === id ? { ...e, status: newStatus } : e)
      );
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;
    try {
      await weddingService.deleteEnquiry(id);
      // Remove locally — no full reload, no flicker
      setAllEnquiries(prev => prev.filter(e => e._id !== id));
    } catch (error) {
      alert('Failed to delete enquiry');
    }
  };

  const filteredEnquiries = enquiries.filter(enq => 
    enq.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enq.phone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(353,45%,35%)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif text-[hsl(353,45%,35%)]">Wedding Enquiries</h2>
            <p className="text-gray-500 text-sm mt-1">Manage and respond to wedding leads from couples</p>
          </div>
          
          <div className="flex gap-3">
             <div className="relative group">
                <input 
                    type="text" 
                    placeholder="Search by client name..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 pl-10 pr-4 rounded-xl border border-white/40 bg-white/50 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-[hsl(353,45%,35%)] transition-all w-64 text-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[hsl(353,45%,35%)] transition-colors" size={18} />
             </div>
          </div>
        </div>

        {/* Tab Filter */}
        <div className="flex items-center gap-2 p-1.5 bg-white/30 backdrop-blur-md border border-white/40 rounded-2xl w-fit flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                statusFilter === tab.value
                  ? 'bg-[hsl(353,45%,35%)] text-white shadow-lg shadow-[hsl(353,45%,35%)]/20'
                  : 'text-gray-500 hover:bg-white/40'
              }`}
            >
              {statusFilter === tab.value
                ? <CheckCircle2 size={14} />
                : <Circle size={14} className="opacity-40" />}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries Table */}
      <div className={`${adminStyles.glassCard} p-8 rounded-3xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-white/40">
                <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em]">Client Details</th>
                <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em]">Target</th>
                <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em]">Date</th>
                <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em]">Budget</th>
                <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em]">Status</th>
                <th className="pb-6 font-bold text-gray-400 text-xs uppercase tracking-[0.1em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {filteredEnquiries.length > 0 ? (
                filteredEnquiries.map((enq) => (
                  <tr key={enq._id} className="group hover:bg-white/40 transition-all duration-300">
                    <td className="py-6 pr-8">
                      <p className="font-bold text-lg text-[hsl(353,20%,15%)]">{enq.name}</p>
                      <p className="text-xs text-gray-400 font-medium tracking-wide">{enq.phone}</p>
                    </td>
                    <td className="py-6 pr-4">
                      <p className="text-sm text-gray-600 font-bold uppercase mb-1">{enq.targetType}</p>
                      {formatMessage(enq.message)}
                    </td>
                    <td className="py-6 text-sm font-medium text-gray-700">
                      {enq.weddingDate ? new Date(enq.weddingDate).toLocaleDateString() : 'TBD'}
                    </td>
                    <td className="py-6">
                      <p className="text-sm font-bold text-[hsl(353,45%,35%)]">{enq.budget || 'N/A'}</p>
                    </td>
                    <td className="py-6">
                      <select 
                        value={enq.status}
                        onChange={(e) => handleUpdateStatus(enq._id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border-none focus:ring-0 cursor-pointer ${
                          enq.status === 'New' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}
                      >
                        <option value="New">NEW</option>
                        <option value="Contacted">CONTACTED</option>
                        <option value="Booked">BOOKED</option>
                        <option value="Lost">LOST</option>
                      </select>
                    </td>
                    <td className="py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedEnquiry(enq)}
                          className="p-3 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all duration-300"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(enq._id)}
                          className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all duration-300"
                          title="Delete Enquiry"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                       <Filter size={48} />
                       <p className="text-lg font-serif italic">No enquiries found in {statusFilter.toLowerCase()} list</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Enquiry Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50">
              <h3 className="text-xl font-serif font-bold text-[hsl(353,45%,35%)]">Enquiry Details</h3>
              <button 
                onClick={() => setSelectedEnquiry(null)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">Client Name</p>
                  <p className="text-gray-800 font-medium">{selectedEnquiry.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">Contact Info</p>
                  <p className="text-gray-800 font-medium">{selectedEnquiry.phone}</p>
                  <p className="text-gray-500 text-sm">{selectedEnquiry.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">Event Date</p>
                  <p className="text-gray-800 font-medium">{selectedEnquiry.weddingDate ? new Date(selectedEnquiry.weddingDate).toLocaleDateString() : 'Not Specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">Guest Count</p>
                  <p className="text-gray-800 font-medium">{selectedEnquiry.guestCount || 'Not Specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">Budget</p>
                  <p className="text-[hsl(353,45%,35%)] font-bold">{selectedEnquiry.budget || 'Not Specified'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">Destination</p>
                  <p className="text-gray-800 font-medium">{selectedEnquiry.destination || 'Not Specified'}</p>
                </div>
              {(() => {
                  const msg = selectedEnquiry.message || '';
                  const match = msg.match(/\[Interested In: (.*?)\]([\s\S]*)/);
                  const packageName = match ? match[1].trim() : null;
                  const descriptionText = match ? match[2].trim() : msg.trim();
                  return (
                    <>
                      {/* Package Selected — shown in grid */}
                      {packageName && (
                        <div>
                          <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">Package Selected</p>
                          <span className="inline-block px-3 py-1 bg-[hsl(353,45%,35%)]/10 text-[hsl(353,45%,35%)] text-xs font-bold rounded-full uppercase tracking-wider">
                            {packageName}
                          </span>
                        </div>
                      )}

                      {/* Description / Services */}
                      <div className="md:col-span-2">
                        <p className="text-xs text-gray-400 font-bold tracking-widest uppercase mb-1">Description / Services</p>
                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {descriptionText || <span className="text-gray-400 italic">No description provided</span>}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setSelectedEnquiry(null)}
                className="px-6 py-2 bg-[hsl(353,45%,35%)] text-white font-bold rounded-xl hover:bg-[hsl(353,45%,25%)] transition-colors shadow-lg shadow-[hsl(353,45%,35%)]/20"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageEnquiries;
