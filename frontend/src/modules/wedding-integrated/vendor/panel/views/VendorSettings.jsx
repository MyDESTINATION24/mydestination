import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { 
  Bell, 
  Lock, 
  User, 
  LogOut, 
  Eye, 
  EyeOff,
  ShieldCheck, 
  MessageSquare,
  Globe,
  Settings2,
  Database,
  Trash2,
  RefreshCcw,
  CheckCircle2,
  Building2,
  PlusCircle,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { weddingVendorService } from "../../../../../services/apiService";
import VendorLayout from "../layouts/VendorLayout";
import toast from "react-hot-toast";
import { registerWeddingFcmToken } from "../../../services/weddingFcmService";

const VendorSettings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [enablingNotif, setEnablingNotif] = useState(false);

  const [settings, setSettings] = useState({
    name: "",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
    notifications: {
      leads: true,
      whatsapp: true
    },
    category: "",
    location: "",
    experience: ""
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const avatarInputRef = React.useRef(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await weddingVendorService.getProfile();
      if (response.success) {
        const v = response.vendor;
        setSettings({
          name: v.name || user?.name || "Vendor",
          avatar: v.avatar || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
          notifications: {
            leads: v.notificationSettings?.leads ?? true,
            whatsapp: v.notificationSettings?.whatsapp ?? true
          },
          category: v.category || user?.category || "",
          location: v.location || "",
          experience: v.experience ? `${v.experience} Years` : ""
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const payload = {
        avatar: settings.avatar,
        notificationSettings: settings.notifications
      };
      await weddingVendorService.updateProfile(payload);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    try {
      setSaving(true);
      await weddingVendorService.updatePassword(currentPassword, newPassword);
      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: !prev.notifications[key] }
    }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEnablePushNotifications = async () => {
    setEnablingNotif(true);
    try {
      const result = await registerWeddingFcmToken({ interactive: true });
      if (result.ok) {
        setNotifPermission('granted');
        toast.success('Push notifications enabled! Aapko ab new leads ka alert milega.');
      } else if (result.reason === 'permission-denied' || result.reason === 'permission-denied-by-user') {
        setNotifPermission('denied');
        toast.error('Notifications blocked. Browser settings mein allow karein.');
      } else {
        toast.error('Notifications enable nahi ho sakin. Baad mein try karein.');
      }
    } catch (e) {
      toast.error('Something went wrong.');
    } finally {
      setEnablingNotif(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/wedding/vendor/login');
  };

  if (loading) {
    return (
      <VendorLayout title="Settings">
        <div className="flex flex-col items-center justify-center py-20 gap-3">
           <div className="w-8 h-8 border-4 border-[#B06A6C] border-t-transparent rounded-full animate-spin" />
           <p className="text-[10px] font-bold text-[#8E7E77] uppercase tracking-widest">Loading Settings...</p>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout title="Settings">
      <div className="max-w-3xl mx-auto space-y-8 animate-wedding-fade-up">
        
        {/* Profile Stats Overview */}
         <div className="flex flex-col sm:flex-row items-center gap-4 md:gap-6 p-5 md:p-8 bg-white/60 backdrop-blur rounded-[1.5rem] md:rounded-[2.5rem] border border-[#F3E9E2] shadow-sm">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-[2.2rem] overflow-hidden border-4 border-white shadow-xl bg-white flex items-center justify-center p-0.5">
                 <img 
                    src={settings.avatar} 
                    alt="Vendor" 
                    className="w-full h-full object-cover rounded-[1.8rem] transition-transform duration-700 group-hover:scale-[1.1]" 
                 />
                 <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent rounded-[1.8rem] transition-all" />
              </div>
            </div>

            <div className="text-center sm:text-left space-y-1">
               <h3 className="text-2xl font-black text-[#4A3730]">{settings.name}</h3>
               <p className="text-[11px] font-bold text-[#8E7E77] uppercase tracking-widest leading-none">
                  {settings.category} • {settings.location}
               </p>
               <div className="flex items-center gap-1.5 text-emerald-500 font-black text-[10px] mt-2 justify-center sm:justify-start">
                  <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED ACCOUNT • SECURED
               </div>
            </div>
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
            <div className="sm:ml-auto flex flex-col gap-2">
               <button 
                 onClick={() => avatarInputRef.current?.click()}
                 className="px-5 py-2.5 rounded-xl bg-[#B06A6C]/10 text-[#B06A6C] font-black text-[9px] uppercase tracking-widest hover:bg-[#B06A6C] hover:text-white transition-all shadow-inner"
               >
                  Change Photo
               </button>
               <button 
                 onClick={() => navigate('/wedding/vendor/profile')}
                 className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-black text-[9px] uppercase tracking-widest hover:bg-black transition-all shadow-xl"
               >
                  Edit Portfolio
               </button>
            </div>

         </div>

        {/* Settings Sections */}
        <div className="space-y-6">
           {/* Section: Notifications */}
           <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-[#F3E9E2] overflow-hidden shadow-sm">
              <div className="p-5 md:p-8 border-b border-[#F3E9E2] flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-400 flex items-center justify-center">
                    <Bell className="w-5 h-5 transition-transform group-hover:scale-110" />
                 </div>
                 <h4 className="text-base md:text-lg font-black text-[#4A3730] " >Notifications</h4>
              </div>
               <div className="p-5 md:p-8 space-y-4 md:space-y-6">
                 {[
                   { id: 'leads', title: "New Lead Alerts", desc: "Receive real-time push notifications for user enquiries.", icon: MessageSquare },
                 ].map((item, i) => (
                   <div key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-5">
                         <div className={`w-5 h-5 rounded-md border-2 border-[#B06A6C] flex items-center justify-center transition-all ${settings.notifications[item.id] ? 'bg-[#B06A6C] text-white' : 'bg-transparent text-transparent'}`}>
                            <CheckCircle2 className="w-4 h-4" />
                         </div>
                         <div className="space-y-0.5">
                            <p className="text-sm font-black text-[#4A3730]">{item.title}</p>
                            <p className="text-[11px] text-[#8E7E77] font-medium">{item.desc}</p>
                         </div>
                      </div>
                      <div 
                        onClick={() => toggleNotification(item.id)}
                        className={`w-10 h-6 rounded-full relative shadow-inner cursor-pointer transition-all duration-300 ${settings.notifications[item.id] ? 'bg-[#B06A6C]' : 'bg-slate-200'}`}
                      >
                         <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${settings.notifications[item.id] ? 'right-1' : 'left-1'}`} />
                      </div>
                   </div>
                 ))}

                 {/* Browser Push Notification Enable Button */}
                 <div className='pt-4 border-t border-[#F3E9E2]'>
                   <p className='text-[10px] font-black text-[#8E7E77] uppercase tracking-widest mb-3'>
                     Browser Push Notifications
                   </p>
                   {notifPermission === 'granted' ? (
                     <div className='flex items-center gap-2 text-emerald-600 font-bold text-sm'>
                       <CheckCircle2 className='w-4 h-4' />
                       Push notifications enabled!
                     </div>
                   ) : notifPermission === 'denied' ? (
                     <p className='text-[11px] text-rose-500 font-medium'>
                       Notifications blocked. Browser address bar mein lock icon click karke allow karein.
                     </p>
                   ) : (
                     <button
                       onClick={handleEnablePushNotifications}
                       disabled={enablingNotif}
                       className='flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#81313A] text-white font-black text-[10px] uppercase tracking-widest hover:bg-[#6a2730] transition-all disabled:opacity-50'
                     >
                       <Bell className='w-3.5 h-3.5' />
                       {enablingNotif ? 'Enabling...' : 'Enable Push Notifications'}
                     </button>
                   )}
                 </div>
              </div>
           </div>

            {/* Section: Security */}
            <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-[#F3E9E2] overflow-hidden shadow-sm">
               <div className="p-5 md:p-8 border-b border-[#F3E9E2] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                     <Lock className="w-5 h-5 transition-transform group-hover:scale-110" />
                  </div>
                  <h4 className="text-base md:text-lg font-black text-[#4A3730] " >Security</h4>
               </div>
               <div className="p-5 md:p-8 space-y-4 md:space-y-6">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#8E7E77] uppercase tracking-widest ml-1">Current Password</label>
                        <input 
                           type="password" 
                           placeholder="Enter current password"
                           className="w-full bg-[#F3E9E2]/30 border border-[#F3E9E2] rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#B06A6C] transition-all"
                           value={currentPassword}
                           onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#8E7E77] uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative group">
                           <input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Enter new secure password"
                              className="w-full bg-[#F3E9E2]/30 border border-[#F3E9E2] rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-[#B06A6C] transition-all"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                           />
                           <button 
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-[#B06A6C] transition-colors p-1"
                           >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                           </button>
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={handleUpdatePassword}
                    className="px-6 py-3 rounded-xl bg-slate-100 text-slate-600 font-black text-[9px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                  >
                     Update Password
                  </button>
               </div>
            </div>

           {/* Bottom Actions */}
           <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <button 
                onClick={handleSaveSettings}
                disabled={saving}
                className={`w-full sm:flex-1 py-4 bg-[#B06A6C] text-white font-black text-sm rounded-2xl shadow-xl shadow-[#B06A6C]/20 transition-all ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
              >
                 {saving ? "Saving..." : "Save Settings"}
              </button>
              <button 
                onClick={handleLogout}
                className="w-full sm:flex-1 py-4 bg-rose-50 text-rose-500 font-black text-sm rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-100 hover:text-rose-600 active:scale-95 transition-all"
              >
                 <LogOut className="w-5 h-5" /> Logout
              </button>
           </div>
        </div>

        <div className="py-10 text-center">
           <p className="text-[10px] font-black text-slate-200 uppercase tracking-widest  " >
             Destine Vendor v1.1.0 • Powered by Anti-Gravity
           </p>
        </div>
      </div>
    </VendorLayout>
  );
};

export default VendorSettings;
