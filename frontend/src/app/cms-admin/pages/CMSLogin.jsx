import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import logo from '../../../assets/rokologin-removebg-preview.png';
import useAdminStore from '../../admin/store/adminStore';

const CMSLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  const login = useAdminStore(state => state.login);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please enter email and password');
    
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      toast.success('CMS Access Granted');
      localStorage.setItem('cmsToken', localStorage.getItem('adminToken'));
      navigate('/cms-admin');
    } else {
      toast.error(result.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-sm shadow-xl w-full max-w-md border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="Logo" className="h-16 w-auto mb-4" />
          <h1 className="text-2xl font-black text-gray-900 tracking-widest uppercase">CMS Login</h1>
          <p className="text-xs font-medium text-gray-500 mt-2">Website Management Panel</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" 
                className="w-full border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..." 
                className="w-full border border-gray-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>
          <button 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-3 font-black tracking-widest uppercase hover:bg-emerald-700 transition shadow-lg text-sm flex items-center justify-center"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Access CMS'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CMSLogin;
