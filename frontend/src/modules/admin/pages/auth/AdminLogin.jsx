import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock, Mail, Eye, EyeOff, KeyRound, ArrowRight,
  Hotel, Heart, Car, LayoutDashboard, ChevronDown, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../../../services/apiService';
import useAdminStore from '../../../../app/admin/store/adminStore';

import { adminService } from '../../services/adminService';
import { adminService as taxiAdminService } from '../../../taxi/admin/services/adminService';
import { setTaxiAdminSession } from '../../../taxi/shared/authStorage';
import adminBg from '../../../../assets/admin_bg.png'; // Premium background image

// ─── Shared unified admin login via main API ────────────────────────────────────
const unifiedAdminLogin = (email, password) => api.post('/auth/admin/login', { email, password });

// ─── Panel Configuration ─────────────────────────────────────────────────────
const PANELS = [
  {
    key: 'hotel',
    label: 'Hotel Admin',
    sublabel: 'Hotel & Property Management',
    icon: Hotel,
    color: '#10b981',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-200/50',
    textColor: 'text-emerald-600',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-700'
  },
  {
    key: 'wedding',
    label: 'Wedding Admin',
    sublabel: 'Destination Wedding Management',
    icon: Heart,
    color: '#ec4899',
    bg: 'bg-pink-500/10',
    border: 'border-pink-200/50',
    textColor: 'text-pink-600',
    buttonColor: 'bg-pink-600 hover:bg-pink-700'
  },
  {
    key: 'taxi',
    label: 'Rider / Taxi Admin',
    sublabel: 'Taxi & Transport Management',
    icon: Car,
    color: '#f59e0b',
    bg: 'bg-amber-500/10',
    border: 'border-amber-200/50',
    textColor: 'text-amber-600',
    buttonColor: 'bg-amber-500 hover:bg-amber-600'
  },
  {
    key: 'cms',
    label: 'CMS Admin',
    sublabel: 'Website Content Management',
    icon: LayoutDashboard,
    color: '#6366f1',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-200/50',
    textColor: 'text-indigo-600',
    buttonColor: 'bg-indigo-600 hover:bg-indigo-700'
  },
];

const syncAdminTokens = (token, user) => {
  if (!token) return;
  localStorage.setItem('adminToken', token);
  localStorage.setItem('cmsToken', token);
  localStorage.setItem('admin_token', token);
  localStorage.setItem('taxiAdminToken', token);
  if (user) {
    localStorage.setItem('adminInfo', JSON.stringify(user));
    localStorage.setItem('admin_user', JSON.stringify(user));
  }
};

// ─── Login logic per panel ────────────────────────────────────────────────────
const loginByPanel = async (panelKey, email, password, adminStoreLogin) => {
  switch (panelKey) {
    case 'hotel': {
      const response = await unifiedAdminLogin(email, password);
      const payload = response?.data || response || {};
      const authData = payload?.user ? payload : (payload?.data || payload || {});
      const token = authData.token || '';
      const user = authData.user || {};

      if (!token) throw new Error('Authentication failed: No token received');

      syncAdminTokens(token, user);
      if (adminStoreLogin) {
        adminStoreLogin(email, password).catch(console.error);
      }
      return { redirectTo: '/admin/dashboard' };
    }
    case 'wedding': {
      const response = await unifiedAdminLogin(email, password);
      const payload = response?.data || response || {};
      const authData = payload?.user ? payload : (payload?.data || payload || {});
      const token = authData.token || '';
      const user = authData.user || {};

      if (!token) throw new Error('Authentication failed: No token received');

      syncAdminTokens(token, user);
      return { redirectTo: '/wedding/admin/dashboard' };
    }
    case 'taxi': {
      const response = await taxiAdminService.login({ email, password });
      const payload = response?.data || response || {};
      const authData = payload?.admin ? payload : (payload?.data || payload || {});
      const token = authData.token || '';
      const user = authData.admin || {};

      if (!token) throw new Error('Taxi Admin authentication failed');

      setTaxiAdminSession({ token, admin: user });
      syncAdminTokens(token, user);
      return { redirectTo: '/taxi/admin' };
    }
    case 'cms': {
      const response = await unifiedAdminLogin(email, password);
      const payload = response?.data || response || {};
      const authData = payload?.user ? payload : (payload?.data || payload || {});
      const token = authData.token || '';
      const user = authData.user || {};

      if (!token) throw new Error('Authentication failed: No token received');

      syncAdminTokens(token, user);
      return { redirectTo: '/cms-admin' };
    }
    default:
      throw new Error('Please select a panel');
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────
const AdminLogin = () => {
  const [view, setView] = useState('login'); // 'login' | 'forgot-email' | 'verify-otp' | 'reset-password'
  const [selectedPanel, setSelectedPanel] = useState('hotel');
  const [panelDropdownOpen, setPanelDropdownOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const adminStoreLogin = useAdminStore(state => state.login);

  const currentPanel = PANELS.find(p => p.key === selectedPanel) || PANELS[0];

  const resetMessages = () => { setError(''); setSuccess(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();
    try {
      const { redirectTo } = await loginByPanel(selectedPanel, email, password, adminStoreLogin);
      setTimeout(() => navigate(redirectTo), 300);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();
    try {
      await adminService.forgotPassword(email);
      setSuccess('OTP has been sent to your email.');
      setView('verify-otp');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    resetMessages();
    try {
      await adminService.verifyResetOtp({ email, otp });
      setView('reset-password');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setIsLoading(true);
    resetMessages();
    try {
      await adminService.resetPassword({ email, otp, password: newPassword });
      setSuccess('Password changed successfully. Please login.');
      setView('login');
      setPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderView = () => {
    switch (view) {
      case 'forgot-email':
        return (
          <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            onSubmit={handleForgotPassword} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 text-center">Reset Password</h2>
            <p className="text-gray-500 text-xs text-center mb-4">Enter your registered email address.</p>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white/50 border border-gray-200/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all backdrop-blur-sm"
                  style={{ '--tw-ring-color': currentPanel.color }}
                  placeholder="admin@mydestination.com" />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className={`w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-white font-semibold text-xs shadow-lg shadow-${currentPanel.color}/30 transform transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed ${currentPanel.buttonColor}`}>
              {isLoading ? 'Sending...' : 'Send OTP'}
            </button>
            <div className="text-center mt-3">
              <button type="button" onClick={() => { setView('login'); resetMessages(); }}
                className="text-xs font-medium hover:underline transition-colors"
                style={{ color: currentPanel.color }}>
                Back to Login
              </button>
            </div>
          </motion.form>
        );

      case 'verify-otp':
        return (
          <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            onSubmit={handleVerifyOtp} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 text-center">Verify OTP</h2>
            <p className="text-gray-500 text-xs text-center mb-4">Enter the OTP sent to {email}</p>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider ml-1">OTP Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyRound className="h-4 w-4 text-gray-400" />
                </div>
                <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white/50 border border-gray-200/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all backdrop-blur-sm"
                  style={{ '--tw-ring-color': currentPanel.color }}
                  placeholder="Enter 6-digit OTP" />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className={`w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-white font-semibold text-xs shadow-lg shadow-${currentPanel.color}/30 transform transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed ${currentPanel.buttonColor}`}>
              {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
            <div className="text-center mt-3">
              <button type="button" onClick={() => { setView('login'); resetMessages(); }}
                className="text-xs font-medium hover:underline transition-colors"
                style={{ color: currentPanel.color }}>
                Cancel
              </button>
            </div>
          </motion.form>
        );

      case 'reset-password':
        return (
          <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            onSubmit={handleResetPassword} className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 text-center">New Password</h2>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider ml-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type={showPassword ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs bg-white/50 border border-gray-200/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all backdrop-blur-sm"
                    style={{ '--tw-ring-color': currentPanel.color }}
                    placeholder="••••••••" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider ml-1">Confirm Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type={showPassword ? 'text' : 'password'} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs bg-white/50 border border-gray-200/60 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:border-transparent transition-all backdrop-blur-sm"
                    style={{ '--tw-ring-color': currentPanel.color }}
                    placeholder="••••••••" />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className={`w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-white font-semibold text-xs shadow-lg shadow-${currentPanel.color}/30 transform transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed ${currentPanel.buttonColor}`}>
              {isLoading ? 'Updating...' : 'Set Password'}
            </button>
          </motion.form>
        );

      case 'login':
      default:
        return (
          <motion.form initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            onSubmit={handleLogin} className="space-y-3">

            {/* Custom Dropdown for Panel Selection */}
            <div className="space-y-1 relative">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Select Management Panel</label>

              <div
                className={`relative w-full cursor-pointer flex items-center p-2 rounded-xl border ${panelDropdownOpen ? currentPanel.border : 'border-gray-200/60'} bg-white/60 backdrop-blur-md transition-all group`}
                onClick={() => setPanelDropdownOpen(!panelDropdownOpen)}
                style={{
                  borderColor: panelDropdownOpen ? currentPanel.color : undefined,
                  boxShadow: panelDropdownOpen ? `0 0 0 3px ${currentPanel.color}20` : undefined
                }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-2.5 shadow-sm ${currentPanel.bg}`}>
                  <currentPanel.icon size={16} style={{ color: currentPanel.color }} />
                </div>
                <div className="flex-1 text-left">
                  <div className={`text-[12px] font-bold ${currentPanel.textColor}`}>{currentPanel.label}</div>
                  <div className="text-[9px] text-gray-500 font-medium">{currentPanel.sublabel}</div>
                </div>
                <div className={`ml-2 transition-transform duration-300 ${panelDropdownOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown size={16} className="text-gray-400" />
                </div>
              </div>

              {/* Dropdown Options */}
              <AnimatePresence>
                {panelDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-2xl overflow-hidden"
                  >
                    {PANELS.map((panel) => (
                      <div
                        key={panel.key}
                        className={`flex items-center p-2.5 cursor-pointer transition-colors ${selectedPanel === panel.key ? panel.bg : 'hover:bg-gray-50/80'}`}
                        onClick={() => {
                          setSelectedPanel(panel.key);
                          setPanelDropdownOpen(false);
                          setError('');
                        }}
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-2.5 shadow-sm ${selectedPanel === panel.key ? 'bg-white' : panel.bg}`}>
                          <panel.icon size={15} style={{ color: panel.color }} />
                        </div>
                        <div className="flex-1">
                          <div className={`text-[12px] font-bold ${selectedPanel === panel.key ? panel.textColor : 'text-gray-700'}`}>
                            {panel.label}
                          </div>
                          <div className="text-[9px] text-gray-400 font-medium">{panel.sublabel}</div>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Inputs */}
            <div className="space-y-2 pt-0.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Official Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-white/60 border border-gray-200/60 rounded-xl text-gray-800 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all backdrop-blur-sm shadow-inner"
                    style={{ '--tw-ring-color': currentPanel.color }}
                    placeholder="admin@mydestination.com" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-xs bg-white/60 border border-gray-200/60 rounded-xl text-gray-800 font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all backdrop-blur-sm shadow-inner"
                    style={{ '--tw-ring-color': currentPanel.color }}
                    placeholder="••••••••" />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-0.5">
              <button type="button" onClick={() => { setView('forgot-email'); resetMessages(); }}
                className="text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
                style={{ color: currentPanel.color }}>
                Forgot Password?
              </button>
            </div>

            <button type="submit" disabled={isLoading}
              className={`w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-white font-bold text-xs uppercase tracking-wider shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${currentPanel.buttonColor}`}
              style={{ boxShadow: `0 8px 20px -5px ${currentPanel.color}60` }}>
              {isLoading ? 'Authenticating...' : `Login to ${currentPanel.label}`}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </button>
          </motion.form>
        );
    }
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col items-center justify-center p-3 sm:p-4 bg-gray-900 bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url(${adminBg})` }}
    >
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-[370px] z-10 my-auto flex flex-col items-center"
      >
        <div className="w-full bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] rounded-2xl p-5 sm:p-6 relative overflow-hidden">

          {/* Decorative glowing orb behind the form */}
          <div
            className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-700"
            style={{ backgroundColor: currentPanel.color }}
          ></div>
          <div
            className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full blur-[80px] opacity-20 pointer-events-none transition-colors duration-700"
            style={{ backgroundColor: currentPanel.color }}
          ></div>

          {/* Header */}
          <div className="flex flex-col items-center mb-4 text-center relative z-10">
            <motion.div
              key={currentPanel.key}
              initial={{ scale: 0.8, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring" }}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white mb-2.5 shadow-xl cursor-pointer hover:scale-105 transition-transform"
              style={{
                background: `linear-gradient(135deg, ${currentPanel.color}, ${currentPanel.color}dd)`,
                boxShadow: `0 10px 25px -5px ${currentPanel.color}60`
              }}
              onClick={() => navigate('/')}>
              <currentPanel.icon size={22} strokeWidth={2.5} />
            </motion.div>

            <div className="flex items-center gap-2 px-3.5 py-1 bg-white/60 backdrop-blur-sm border border-gray-100 rounded-full shadow-sm mb-1">
              <span className="text-gray-800 font-extrabold text-[10px] uppercase tracking-[2.5px]">Admin Access Portal</span>
            </div>
            <p className="text-gray-500 text-[11px] font-medium mt-1">Sign in to manage operations</p>
          </div>

          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0, mb: 0 }} animate={{ opacity: 1, height: 'auto', mb: 12 }} exit={{ opacity: 0, height: 0, mb: 0 }}
                className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs flex items-center shadow-sm">
                <span className="mr-2">⚠️</span> {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0, mb: 0 }} animate={{ opacity: 1, height: 'auto', mb: 12 }} exit={{ opacity: 0, height: 0, mb: 0 }}
                className="bg-green-50/80 backdrop-blur-sm border border-green-200 text-green-600 px-3 py-2 rounded-xl text-xs flex items-center shadow-sm">
                <span className="mr-2">✅</span> {success}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative z-10">
            {renderView()}
          </div>
        </div>

        <p className="text-center text-white/70 text-xs mt-3 font-medium tracking-wide drop-shadow-md">
          &copy; {new Date().getFullYear()} MyDESTINATION. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
