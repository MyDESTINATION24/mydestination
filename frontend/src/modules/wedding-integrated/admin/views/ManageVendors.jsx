import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import { weddingService } from '../../../../services/weddingService';
import { adminStyles } from '../theme/themeConfig';
import toast from 'react-hot-toast';
import {
  Users,
  Clock,
  Filter,
  Download,
  Eye,
  X,
  CheckCircle2,
  MapPin,
  IndianRupee,
  ShieldCheck,
  PackageCheck
} from 'lucide-react';

const ManageVendors = () => {
  const location = useLocation();
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [modalLoading, setModalLoading] = useState(false); // for lazy KYC load

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    vendorId: null,
    status: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Only fetch vendors list — no KYC images in this call (fast)
      const vendorData = await weddingService.getAdminVendors();
      setVendors(vendorData || []);
      // Derive categories from vendor data — no extra API call needed
      const cats = Array.from(new Set((vendorData || []).map(v => v.category).filter(Boolean)));
      setCategories(cats.map(c => ({ name: c })));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lazy load: fetch full vendor (with KYC images) only when modal opens
  const openVendorModal = async (vendor) => {
    setSelectedVendor(vendor); // show modal immediately with basic info
    setModalLoading(true);
    try {
      const fullData = await weddingService.getAdminVendorById(vendor._id);
      setSelectedVendor(fullData); // replace with full data once loaded
    } catch (e) {
      console.error('Failed to load vendor details:', e);
    } finally {
      setModalLoading(false);
    }
  };

  const triggerActionConfirm = (id, status) => {
    setConfirmModal({
      isOpen: true,
      vendorId: id,
      status: status,
    });
  };

  const handleAction = async (id, status) => {
    try {
      setLoading(true);
      const statusValue = status === 'Approved' ? 'approved' : 'rejected';
      await weddingService.updateVendorStatus(id, statusValue);
      toast.success(`Vendor ${status} successfully!`);
      if (selectedVendor?._id === id) setSelectedVendor(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update vendor status');
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV Handler
  const handleExport = () => {
    if (filteredVendors.length === 0) {
      toast.error("No data to export!");
      return;
    }
    const headers = ["Name", "Email", "Phone", "Category", "Location", "Experience (Years)", "Base Package", "Premium Package", "Status"];
    const rows = filteredVendors.map(v => [
      v.name || '',
      v.email || '',
      v.phone || '',
      v.category || '',
      v.location || '',
      v.experience || '0',
      v.basicPackage || '0',
      v.premiumPackage || '0',
      v.partnerApprovalStatus || 'pending'
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vendors_export_${isPendingView ? 'pending' : 'all'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedVendor) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedVendor]);

  const isPendingView = location.pathname.includes('/pending');
  
  // Dynamic filtered list based on view + category + location filters
  const filteredVendors = vendors.filter(v => {
    const matchesView = isPendingView 
      ? v.partnerApprovalStatus === 'pending'
      : (v.partnerApprovalStatus === 'approved' || v.partnerApprovalStatus === 'rejected');
    
    const matchesCategory = !selectedCategory || v.category === selectedCategory;
    const matchesLocation = !selectedLocation || v.location === selectedLocation;

    return matchesView && matchesCategory && matchesLocation;
  });

  // Dynamic filter lists
  const uniqueCategories = categories.length > 0
    ? Array.from(new Set(categories.map(cat => cat.name).filter(Boolean)))
    : Array.from(new Set(vendors.map(v => v.category).filter(Boolean)));

  const uniqueLocations = Array.from(new Set(vendors.map(v => v.location).filter(Boolean)));

  if (loading && vendors.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(353,45%,35%)]"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-serif text-[hsl(353,45%,35%)]">
                {isPendingView ? 'Pending Approvals' : 'Vendor Management'}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {isPendingView
                  ? `Review and verify ${filteredVendors.length} new vendor applications`
                  : `Manage and oversee all ${filteredVendors.length} registered vendors on the platform`}
              </p>
            </div>
             <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(prev => !prev)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium shadow-sm transition-all ${
                  showFilters
                    ? 'bg-[#B06A6C] text-white border-[#B06A6C]'
                    : 'border-[#B06A6C]/20 bg-white hover:bg-slate-50'
                }`}
              >
                <Filter size={16} /> Filter{(selectedCategory || selectedLocation) && ' (Active)'}
              </button>
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 border border-[#B06A6C]/20 bg-white rounded-xl text-sm font-medium hover:bg-slate-50 shadow-sm transition-all"
              >
                <Download size={16} /> Export
              </button>
            </div>
          </div>

          {/* Interactive Dynamic Filter Pane */}
          {showFilters && (
            <div className="p-6 bg-white border border-[#F3E9E2] rounded-3xl animate-in slide-in-from-top-4 duration-300 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-md">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#B06A6C]"
                >
                  <option value="">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#B06A6C]"
                >
                  <option value="">All Locations</option>
                  {uniqueLocations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-3 justify-end">
                {(selectedCategory || selectedLocation) && (
                  <button
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedLocation('');
                    }}
                    className="px-4 py-2.5 text-xs font-black text-rose-500 uppercase hover:text-rose-600 transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-700 uppercase tracking-widest transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className={`${adminStyles.glassCard} p-8 rounded-3xl`}>
            {filteredVendors.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h3 className={`${adminStyles.heading} text-2xl font-bold`}>
                    {isPendingView ? 'New Applications' : 'Vendor Directory'}
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredVendors.map((vendor) => (
                    <div key={vendor._id} className="p-6 rounded-2xl bg-white border border-[#F3E9E2] flex items-center justify-between group hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center gap-6">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[hsl(353,45%,45%)] to-[hsl(353,45%,35%)] flex items-center justify-center text-white font-bold text-2xl shadow-inner transition-transform">
                          {vendor.name?.[0] || 'V'}
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-[hsl(353,20%,15%)] leading-none mb-2">{vendor.name}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium px-2 py-0.5 bg-[hsl(353,45%,35%)]/10 text-[hsl(353,45%,35%)] rounded">
                              {vendor.category || 'Vendor'}
                            </span>
                            <span className="text-xs text-gray-400">|</span>
                            <p className="text-sm text-gray-700">{vendor.location || 'Location Not Set'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {!isPendingView && (
                          <div className="text-right mr-4">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              vendor.partnerApprovalStatus === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                            }`}>
                              {vendor.partnerApprovalStatus}
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => openVendorModal(vendor)}
                            className="p-2 text-slate-400 hover:text-[hsl(353,45%,35%)] hover:bg-[hsl(353,45%,35%)]/5 rounded-xl transition-all"
                            title="View Details"
                          >
                            <Eye size={22} />
                          </button>
                          {isPendingView && (
                            <>
                              <button
                                onClick={() => triggerActionConfirm(vendor._id, 'Rejected')}
                                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => triggerActionConfirm(vendor._id, 'Approved')}
                                className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 shadow-md shadow-green-200 transition-all active:scale-95"
                              >
                                Approve
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                  <CheckCircle2 size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif text-[hsl(353,45%,35%)]">All Caught Up!</h3>
                  <p className="text-gray-500 mt-2">No vendors found in this category.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#4A3730]/40 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setSelectedVendor(null)}
          />

          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 z-[101]">
            <div className="bg-[#B06A6C] p-8 text-white relative">
              <button
                onClick={() => setSelectedVendor(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-6">
                <div className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center text-[#B06A6C] text-3xl font-black shadow-xl">
                  {selectedVendor.name?.[0] || 'V'}
                </div>
                <div>
                  <h3 className="text-2xl font-black">{selectedVendor.name}</h3>
                  <div className="flex items-center gap-3 mt-1 underline underline-offset-4 decoration-white/30">
                    <span className="text-sm font-bold opacity-90">{selectedVendor.category || 'Vendor'}</span>
                    <span className="opacity-50">|</span>
                    <span className="text-sm font-bold opacity-90 italic">{selectedVendor.location || 'Location Not Set'}</span>
                  </div>
                </div>
              </div>
            </div>            <div className="p-8 space-y-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {modalLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(353,45%,35%)]"></div>
                  <span className="ml-3 text-sm text-slate-400">Loading details...</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experience</p>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#B06A6C]" /> {selectedVendor.experience ? `${selectedVendor.experience} Years` : 'Not Specified'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Packages</p>
                      <div className="flex flex-col gap-1 text-slate-800">
                        <p className="text-sm font-bold flex items-center gap-1">
                          <span className="text-slate-400 font-semibold text-xs w-16">Base:</span>
                          <span className="text-emerald-600 flex items-center gap-1 font-extrabold"><IndianRupee className="w-3.5 h-3.5" />{selectedVendor.basicPackage ? selectedVendor.basicPackage.toLocaleString('en-IN') : 'On Request'}</span>
                        </p>
                        {selectedVendor.premiumPackage && (
                          <p className="text-sm font-bold flex items-center gap-1">
                            <span className="text-slate-400 font-semibold text-xs w-16">Premium:</span>
                            <span className="text-emerald-700 flex items-center gap-1 font-extrabold"><IndianRupee className="w-3.5 h-3.5" />{selectedVendor.premiumPackage.toLocaleString('en-IN')}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</p>
                      <p className="text-sm font-bold text-slate-800">{selectedVendor.email}</p>
                      <p className="text-xs text-slate-500">{selectedVendor.phone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification Status</p>
                      <div className="flex items-center gap-1.5 text-blue-600 font-bold text-sm">
                        <ShieldCheck className="w-5 h-5" /> {selectedVendor.kycStatus || 'Pending Verification'}
                      </div>
                    </div>
                  </div>

                  {selectedVendor.services?.length > 0 && (
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <PackageCheck className="w-4 h-4" /> Offered Services
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedVendor.services.map((service, i) => (
                          <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600">
                            {service.name} {service.price ? `(₹${service.price})` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* KYC Verification Documents */}
                  {(selectedVendor.aadhaarFront || selectedVendor.panCardImage || selectedVendor.profileImage) && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#B06A6C]" /> Verification Documents (KYC)
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {selectedVendor.aadhaarFront && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Aadhar Card</span>
                            {selectedVendor.aadhaarFront.startsWith('data:image/') || selectedVendor.aadhaarFront.startsWith('http') ? (
                              <div className="w-full h-24 rounded-xl overflow-hidden border border-slate-200 bg-white relative group cursor-pointer" onClick={() => window.open(selectedVendor.aadhaarFront, '_blank')}>
                                <img src={selectedVendor.aadhaarFront} alt="Aadhar Card" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                  <Eye className="w-4 h-4" /> View Full
                                </div>
                              </div>
                            ) : (
                              <a href={selectedVendor.aadhaarFront} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#B06A6C] hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                                <Download className="w-3.5 h-3.5" /> Download File
                              </a>
                            )}
                          </div>
                        )}
                        {selectedVendor.panCardImage && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">PAN Card</span>
                            {selectedVendor.panCardImage.startsWith('data:image/') || selectedVendor.panCardImage.startsWith('http') ? (
                              <div className="w-full h-24 rounded-xl overflow-hidden border border-slate-200 bg-white relative group cursor-pointer" onClick={() => window.open(selectedVendor.panCardImage, '_blank')}>
                                <img src={selectedVendor.panCardImage} alt="PAN Card" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                  <Eye className="w-4 h-4" /> View Full
                                </div>
                              </div>
                            ) : (
                              <a href={selectedVendor.panCardImage} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#B06A6C] hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                                <Download className="w-3.5 h-3.5" /> Download File
                              </a>
                            )}
                          </div>
                        )}
                        {selectedVendor.profileImage && (
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Vendor Photo</span>
                            {selectedVendor.profileImage.startsWith('data:image/') || selectedVendor.profileImage.startsWith('http') ? (
                              <div className="w-full h-24 rounded-xl overflow-hidden border border-slate-200 bg-white relative group cursor-pointer" onClick={() => window.open(selectedVendor.profileImage, '_blank')}>
                                <img src={selectedVendor.profileImage} alt="Vendor Photo" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                  <Eye className="w-4 h-4" /> View Full
                                </div>
                              </div>
                            ) : (
                              <a href={selectedVendor.profileImage} target="_blank" rel="noreferrer" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#B06A6C] hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                                <Download className="w-3.5 h-3.5" /> Download File
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedVendor.partnerApprovalStatus === 'pending' && (
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                <button
                  onClick={() => triggerActionConfirm(selectedVendor._id, 'Rejected')}
                  className="flex-1 py-4 bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-300 transition-all"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => triggerActionConfirm(selectedVendor._id, 'Approved')}
                  className="flex-1 py-4 bg-green-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-green-200 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Approve Vendor
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
      <ConfirmationModal
        confirmModal={confirmModal}
        setConfirmModal={setConfirmModal}
        handleAction={handleAction}
      />
    </>
  );
};

// Render Confirmation Modal helper inside ManageVendors
const ConfirmationModal = ({ confirmModal, setConfirmModal, handleAction }) => {
  if (!confirmModal.isOpen) return null;
  
  return createPortal(
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-[#4A3730]/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setConfirmModal({ isOpen: false, vendorId: null, status: '' })}
      />
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200 z-[100001] border border-[#F3E9E2]">
        <h3 className="text-xl font-serif text-[hsl(353,45%,35%)] font-bold mb-2">
          {confirmModal.status === 'Approved' ? 'Approve Vendor?' : 'Reject Vendor?'}
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Are you sure you want to {confirmModal.status === 'Approved' ? 'approve' : 'reject'} this vendor application? This action will update their access instantly.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setConfirmModal({ isOpen: false, vendorId: null, status: '' })}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
          >
            No, Cancel
          </button>
          <button
            onClick={() => {
              handleAction(confirmModal.vendorId, confirmModal.status);
              setConfirmModal({ isOpen: false, vendorId: null, status: '' });
            }}
            className={`px-5 py-2.5 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 ${
              confirmModal.status === 'Approved'
                ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
            }`}
          >
            Yes, Proceed
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ManageVendors;
