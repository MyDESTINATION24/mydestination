import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, RefreshCw, LogOut, CheckCircle, AlertTriangle, MessageSquare, Edit3 } from 'lucide-react';
import { authService } from '../../../services/apiService';
import usePartnerStore from '../store/partnerStore';
import toast from 'react-hot-toast';
import logo from '../../../assets/rokologin-removebg-preview.png';

const PartnerPendingApproval = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [checking, setChecking] = useState(false);
    const { updateFormData, setStep } = usePartnerStore();

    const loadProfile = async (showToast = false) => {
        setChecking(true);
        try {
            const res = await authService.getMe();
            if (res.success && res.user) {
                setUser(res.user);
                localStorage.setItem('user', JSON.stringify(res.user));

                if (res.user.partnerApprovalStatus === 'approved') {
                    toast.success('Congratulations! Your partner account is approved.');
                    navigate('/hotel/dashboard');
                    return;
                }

                if (showToast) {
                    if (res.user.partnerApprovalStatus === 'pending') {
                        toast.success('Status checked: Still under review.');
                    } else if (res.user.partnerApprovalStatus === 'rejected') {
                        toast.error('Your application was rejected. Please contact support.');
                    }
                }
            }
        } catch (err) {
            console.error('Failed to fetch status:', err);
            if (showToast) toast.error('Could not refresh status. Try again.');
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUser(storedUser);
        loadProfile(false);
    }, []);

    const handleEditApplication = () => {
        if (!user) return;
        const getDocObj = (val) => (typeof val === 'object' && val?.url ? val : { url: val || '', publicId: '' });

        updateFormData({
            full_name: user.name || user.ownerName || '',
            email: user.email || '',
            phone: user.phone || '',
            termsAccepted: true,
            aadhaar_number: user.aadhaarNumber || '',
            aadhaar_front: getDocObj(user.aadhaarFront),
            aadhaar_back: getDocObj(user.aadhaarBack),
            pan_number: user.panNumber || '',
            pan_card_image: getDocObj(user.panCardImage),
            isEditing: true
        });
        setStep(1);
        navigate('/hotel/register?mode=edit');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/hotel/login');
    };

    const isRejected = user?.partnerApprovalStatus === 'rejected';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shadow-xs">
                <img src={logo} alt="My DESTINATION" className="h-9 object-contain" />
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
                >
                    <LogOut size={14} />
                    Logout
                </button>
            </header>

            {/* Main Content Container */}
            <main className="max-w-xl mx-auto px-4 py-8 flex-1 flex flex-col justify-center w-full">
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-gray-200/50 border border-gray-100 text-center">
                    
                    {/* Status Header Icon */}
                    <div className="relative inline-flex items-center justify-center mb-6">
                        {isRejected ? (
                            <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shadow-inner">
                                <AlertTriangle size={40} />
                            </div>
                        ) : (
                            <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 shadow-inner relative">
                                <Clock size={40} className="animate-pulse" />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full animate-ping"></span>
                            </div>
                        )}
                    </div>

                    {/* Title & Description */}
                    {isRejected ? (
                        <>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Application Rejected</h1>
                            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
                                Your partner onboarding request was reviewed and rejected by our team. Please click below to edit and resubmit your details, or contact partner support.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-3">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                Pending Admin Approval
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Account Under Review</h1>
                            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-6">
                                Thank you for registering! Your partner profile and uploaded documents (Aadhaar & PAN) have been submitted to our team for verification.
                            </p>
                        </>
                    )}

                    {/* Timeline Progress */}
                    <div className="bg-slate-50 rounded-2xl p-4 mb-6 border border-slate-100 text-left">
                        <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">Verification Timeline</p>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                                    <CheckCircle size={14} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Partner Details Submitted</p>
                                    <p className="text-[10px] text-slate-400">Account created & documents uploaded</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                    isRejected ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                                }`}>
                                    {isRejected ? <AlertTriangle size={14} /> : <Clock size={14} />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">Admin Identity Review</p>
                                    <p className="text-[10px] text-slate-400">Usually takes 12 - 24 hours</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 opacity-50">
                                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 text-xs font-bold">
                                    3
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700">Account Activation</p>
                                    <p className="text-[10px] text-slate-400">Full access to partner dashboard & listings</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Account Info Summary Card with Edit Button */}
                    {user && (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden">
                            <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-extrabold text-slate-900 text-sm truncate">{user.name || user.ownerName || 'Partner'}</p>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide shrink-0 ${
                                        isRejected ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        {user.partnerApprovalStatus || 'PENDING'}
                                    </span>
                                </div>
                                <p className="text-slate-500 text-xs font-medium truncate">{user.email || 'No email set'}</p>
                                <p className="text-slate-400 text-[11px] font-medium">{user.phone}</p>
                                {(user.aadhaarNumber || user.panNumber) && (
                                    <p className="text-slate-400 text-[10px] font-mono mt-1 break-all">
                                        {user.aadhaarNumber ? `Aadhaar: ${user.aadhaarNumber}` : ''} {user.panNumber ? `| PAN: ${user.panNumber}` : ''}
                                    </p>
                                )}
                            </div>
                            
                            <button
                                type="button"
                                onClick={handleEditApplication}
                                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:border-[#39593f] text-[#39593f] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:shadow-sm transition-all shrink-0 w-full sm:w-auto"
                            >
                                <Edit3 size={14} />
                                Edit Application
                            </button>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => loadProfile(true)}
                            disabled={checking}
                            className="flex-1 py-3 px-4 rounded-xl bg-[#39593f] hover:bg-[#2e4732] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#39593f]/20 active:scale-95 transition-all disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
                            {checking ? 'Checking Status...' : 'Refresh Status'}
                        </button>
                        <a
                            href="https://wa.me/919685974247?text=Hello%20Partner%20Support,%20I%20registered%20as%20a%20hotel%20partner%20and%20my%20account%20is%20pending%20approval."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                            <MessageSquare size={16} />
                            Partner Support
                        </a>
                    </div>

                </div>
            </main>

            {/* Footer Notice */}
            <footer className="text-center py-4 text-slate-400 text-[11px]">
                Need immediate assistance? Contact us at <a href="mailto:support@mydestination.com" className="text-slate-600 font-bold underline">support@mydestination.com</a>
            </footer>
        </div>
    );
};

export default PartnerPendingApproval;
