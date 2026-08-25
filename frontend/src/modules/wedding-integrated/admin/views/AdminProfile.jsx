import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Shield, 
  Bell, 
  Save,
  Lock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { adminStyles } from '../theme/themeConfig';

const AdminProfile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // NOTE: this whole profile is placeholder state and handleSave below only
  // simulates a request -- nothing here is loaded from or written to the API.
  const [profileData, setProfileData] = useState({
    name: 'Admin User',
    email: 'admin@mydestination.com',
    phone: '+91 8006787878',
    role: 'Super Admin',
    location: 'Mumbai, India',
    bio: 'Managing the overall operations and vendor verification for Destination Wedding platform.',
    avatar: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1500);
  };

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
        activeTab === id 
          ? 'bg-[hsl(353,45%,35%)] text-white shadow-lg shadow-[hsl(353,45%,35%)]/20 translate-x-2' 
          : 'text-gray-500 hover:bg-white/60 hover:text-[hsl(353,45%,35%)]'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Sidebar - Profile Summary */}
        <div className="w-full lg:w-80 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-[hsl(353,45%,35%)] to-[hsl(353,45%,45%)] flex items-center justify-center text-white text-5xl font-serif shadow-2xl relative overflow-hidden">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profileData.name.charAt(0)
                )}
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={24} className="text-white" />
                  <input type="file" className="hidden" />
                </label>
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 bg-green-500 border-4 border-white rounded-full"></div>
            </div>
            
            <div className="mt-6 text-center">
              <h3 className="text-xl font-bold text-[hsl(353,20%,15%)] leading-tight">{profileData.name}</h3>
              <p className="text-xs text-[hsl(353,45%,35%)] font-black uppercase tracking-[0.2em] mt-1">{profileData.role}</p>
            </div>
            
            <div className="w-full h-px bg-gray-100 my-6"></div>
            
            <div className="space-y-4 w-full">
              <div className="flex items-center gap-3 text-gray-500">
                <Mail size={16} className="shrink-0" />
                <span className="text-xs truncate">{profileData.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <Phone size={16} className="shrink-0" />
                <span className="text-xs">{profileData.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500">
                <MapPin size={16} className="shrink-0" />
                <span className="text-xs">{profileData.location}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/40 backdrop-blur-sm border border-white/40 rounded-[2.5rem] p-4 flex flex-col gap-1">
            <TabButton id="personal" label="Personal Info" icon={User} />
            <TabButton id="security" label="Security" icon={Shield} />
            <TabButton id="notifications" label="Notifications" icon={Bell} />
          </div>
        </div>

        {/* Right Content - Forms */}
        <div className="flex-1 bg-white/80 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 shadow-sm min-h-[600px] relative overflow-hidden">
          
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[hsl(353,45%,35%)]/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>

          {activeTab === 'personal' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-[hsl(353,20%,15%)]">Personal Information</h2>
                  <p className="text-gray-500 text-sm mt-1">Update your personal details and public profile info</p>
                </div>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-8 py-3 rounded-2xl bg-[hsl(353,45%,35%)] text-white font-bold text-sm shadow-xl shadow-[hsl(353,45%,35%)]/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 overflow-hidden relative`}
                >
                  {isSaving ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative flex items-center group">
                    <User className="absolute left-4 w-4 h-4 text-gray-300 group-focus-within:text-[hsl(353,45%,35%)] transition-colors" />
                    <input 
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="w-full h-14 bg-gray-50 border border-transparent focus:border-[hsl(353,45%,35%)] focus:bg-white rounded-2xl pl-12 pr-6 text-sm font-bold text-gray-700 outline-none transition-all"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative flex items-center group">
                    <Mail className="absolute left-4 w-4 h-4 text-gray-300 group-focus-within:text-[hsl(353,45%,35%)] transition-colors" />
                    <input 
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className="w-full h-14 bg-gray-50 border border-transparent focus:border-[hsl(353,45%,35%)] focus:bg-white rounded-2xl pl-12 pr-6 text-sm font-bold text-gray-700 outline-none transition-all"
                      placeholder="admin@mydestination.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative flex items-center group">
                    <Phone className="absolute left-4 w-4 h-4 text-gray-300 group-focus-within:text-[hsl(353,45%,35%)] transition-colors" />
                    <input 
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className="w-full h-14 bg-gray-50 border border-transparent focus:border-[hsl(353,45%,35%)] focus:bg-white rounded-2xl pl-12 pr-6 text-sm font-bold text-gray-700 outline-none transition-all"
                      placeholder="+91 00000 00000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Location</label>
                  <div className="relative flex items-center group">
                    <MapPin className="absolute left-4 w-4 h-4 text-gray-300 group-focus-within:text-[hsl(353,45%,35%)] transition-colors" />
                    <input 
                      name="location"
                      value={profileData.location}
                      onChange={handleInputChange}
                      className="w-full h-14 bg-gray-50 border border-transparent focus:border-[hsl(353,45%,35%)] focus:bg-white rounded-2xl pl-12 pr-6 text-sm font-bold text-gray-700 outline-none transition-all"
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Short Bio</label>
                <textarea 
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-gray-50 border border-transparent focus:border-[hsl(353,45%,35%)] focus:bg-white rounded-2xl p-6 text-sm font-medium text-gray-700 outline-none transition-all resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-[hsl(353,20%,15%)]">Security Settings</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your password and authentication settings</p>
              </div>

              <div className="max-w-md space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Current Password</label>
                  <div className="relative flex items-center group">
                    <Lock className="absolute left-4 w-4 h-4 text-gray-300 group-focus-within:text-[hsl(353,45%,35%)] transition-colors" />
                    <input 
                      type={showPasswords.current ? "text" : "password"}
                      className="w-full h-14 bg-gray-50 border border-transparent focus:border-[hsl(353,45%,35%)] focus:bg-white rounded-2xl pl-12 pr-12 text-sm font-bold text-gray-700 outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-4 p-1 text-gray-400 hover:text-[hsl(353,45%,35%)] transition-colors"
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">New Password</label>
                  <div className="relative flex items-center group">
                    <Lock className="absolute left-4 w-4 h-4 text-gray-300 group-focus-within:text-[hsl(353,45%,35%)] transition-colors" />
                    <input 
                      type={showPasswords.new ? "text" : "password"}
                      className="w-full h-14 bg-gray-50 border border-transparent focus:border-[hsl(353,45%,35%)] focus:bg-white rounded-2xl pl-12 pr-12 text-sm font-bold text-gray-700 outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-4 p-1 text-gray-400 hover:text-[hsl(353,45%,35%)] transition-colors"
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <div className="relative flex items-center group">
                    <Lock className="absolute left-4 w-4 h-4 text-gray-300 group-focus-within:text-[hsl(353,45%,35%)] transition-colors" />
                    <input 
                      type={showPasswords.confirm ? "text" : "password"}
                      className="w-full h-14 bg-gray-50 border border-transparent focus:border-[hsl(353,45%,35%)] focus:bg-white rounded-2xl pl-12 pr-12 text-sm font-bold text-gray-700 outline-none transition-all"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-4 p-1 text-gray-400 hover:text-[hsl(353,45%,35%)] transition-colors"
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full h-14 rounded-2xl bg-gradient-to-r from-[hsl(353,45%,35%)] to-[hsl(353,45%,45%)] text-white font-bold text-sm shadow-xl shadow-[hsl(353,45%,35%)]/20 transition-all hover:scale-105 active:scale-95"
                >
                  Update Password
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex items-start gap-4">
                <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 leading-tight">Password Requirements</h4>
                  <p className="text-xs text-amber-700 mt-1">Minimum 8 characters, at least one uppercase letter, one number, and one special character.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-[hsl(353,20%,15%)]">Notification Preferences</h2>
                <p className="text-gray-500 text-sm mt-1">Decide what alerts you want to receive</p>
              </div>

              <div className="space-y-4">
                {[
                  { title: 'New Vendor Registrations', desc: 'Get notified when a new vendor signs up for verification.' },
                  { title: 'Booking Requests', desc: 'Get notified when a client completes a booking enquiry.' },
                  { title: 'System Alerts', desc: 'Security alerts and critical system maintenance updates.' },
                  { title: 'Customer Support Tickets', desc: 'Get notified when a customer or vendor raises a support query.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-6 rounded-3xl border border-gray-100 hover:border-[hsl(353,45%,35%)]/30 hover:bg-gray-50/50 transition-all group">
                    <div className="max-w-md">
                      <h4 className="text-sm font-bold text-gray-800 leading-tight">{item.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked={idx < 2} />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(353,45%,35%)]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="bg-[#1e1416] text-white px-8 py-4 rounded-3xl shadow-2xl border border-white/10 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-green-500/20 text-green-400 flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold leading-tight">Profile Updated Successfully</h4>
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">Your changes have been saved</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
