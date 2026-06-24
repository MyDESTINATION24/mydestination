import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Mail, ArrowLeft, Save, Loader2, MapPin, Navigation, Home, Camera, Trash2, AlertTriangle, LogOut } from 'lucide-react';
import { authService, userService } from '../../services/apiService';
import toast from 'react-hot-toast';
import { isFlutterApp, openFlutterCamera, uploadBase64Image } from '../../utils/flutterBridge';

const ProfileEdit = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    profileImage: '',
    profileImagePublicId: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'India',
      coordinates: { lat: null, lng: null }
    }
  });

  useEffect(() => {
    // Load user data from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setFormData({
          name: user.name || '',
          phone: user.phone || '',
          email: user.email || '',
          profileImage: user.profileImage || '',
          profileImagePublicId: user.profileImagePublicId || '',
          address: user.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India',
            coordinates: { lat: null, lng: null }
          }
        });
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
  }, []);

  const autoFillAddress = async (lat, lng) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAP_API_KEY;
    if (!apiKey) return;

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.[0]) {
        const result = data.results[0];
        const addressComponents = result.address_components;

        let streetNumber = '';
        let route = '';
        let neighborhood = '';
        let city = '';
        let state = '';
        let pincode = '';
        let country = '';

        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('street_number')) streetNumber = component.long_name;
          if (types.includes('route')) route = component.long_name;
          if (types.includes('neighborhood') || types.includes('sublocality')) neighborhood = component.long_name;
          if (types.includes('locality')) city = component.long_name;
          if (types.includes('administrative_area_level_1')) state = component.long_name;
          if (types.includes('postal_code')) pincode = component.long_name;
          if (types.includes('country')) country = component.long_name;
        });

        if (!city) {
          const sublocality = addressComponents.find(c => c.types.includes('sublocality_level_1'))?.long_name;
          city = sublocality || '';
        }

        const street = [streetNumber, route, neighborhood].filter(Boolean).join(', ') || result.formatted_address.split(',')[0];

        setFormData(prev => ({
          ...prev,
          address: {
            street: street,
            city: city,
            state: state,
            zipCode: pincode,
            country: country || 'India',
            coordinates: { lat, lng }
          }
        }));

        toast.success('Address auto-filled!');
      }
    } catch (error) {
      console.error('Auto-fill error:', error);
      toast.error('Failed to get address details.');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported');
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await autoFillAddress(latitude, longitude);
        setFetchingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        setFetchingLocation(false);
        toast.error('Unable to retrieve location');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPG, PNG and WebP images supported');
      return;
    }

    const uploadData = new FormData();
    uploadData.append('files', file);

    try {
      setImageUploading(true);
      // Reuse existing generic upload service
      const response = await authService.uploadDocs(uploadData);

      if (response && response.files && response.files.length > 0) {
        const { url, publicId } = response.files[0];
        setFormData(prev => ({
          ...prev,
          profileImage: url,
          profileImagePublicId: publicId
        }));
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleCameraCapture = async () => {
    try {
      setImageUploading(true);
      const cameraResult = await openFlutterCamera();

      if (!cameraResult.success || !cameraResult.base64) {
        throw new Error('Camera capture failed');
      }

      // Use the generic base64 upload utility
      const uploadResult = await uploadBase64Image(
        cameraResult.base64,
        cameraResult.mimeType,
        cameraResult.fileName
      );

      if (uploadResult.success && uploadResult.files && uploadResult.files.length > 0) {
        const { url, publicId } = uploadResult.files[0];
        setFormData(prev => ({
          ...prev,
          profileImage: url,
          profileImagePublicId: publicId
        }));
        toast.success('Photo uploaded successfully');
      }
    } catch (err) {
      console.error('Camera upload failed:', err);
      toast.error('Camera upload failed');
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || formData.name.length < 3) {
      toast.error('Name must be at least 3 characters');
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.updateProfile(formData);

      // Update localStorage with new user data
      localStorage.setItem('user', JSON.stringify(response.user));

      toast.success('Profile updated successfully!');
      navigate(-1);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      await userService.deleteAccount();
      authService.logout();
      toast.success('Account deleted successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const handleCameraClick = () => {
    if (isFlutterApp()) {
      handleCameraCapture();
    } else {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-hotel-bg)] flex flex-col items-center pt-safe-top pb-24 md:pb-10 font-sans">

      {/* Sticky Header */}
      <div className="sticky top-0 left-0 right-0 w-full z-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 pt-10 pb-4 md:py-4 shadow-sm mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-surface" />
        </button>
        <h1 className="text-lg font-black text-surface tracking-tight">Edit Profile</h1>
        <div className="w-10"></div> {/* Spacer for balance */}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-6"
      >

        {/* Profile Picture Section */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-[var(--color-hotel-bg)] flex items-center justify-center shadow-inner overflow-hidden border-4 border-white ring-4 ring-surface/5">
              {formData.profileImage ? (
                <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-surface/30">
                  <User size={40} />
                </div>
              )}
              {imageUploading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-surface" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleCameraClick}
              disabled={imageUploading}
              className="absolute bottom-1 right-1 p-2.5 bg-surface text-white rounded-full border-4 border-white shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all"
            >
              <Camera size={18} strokeWidth={2.5} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={imageUploading}
            />
          </div>
          <p className="mt-4 text-[10px] font-black text-surface uppercase tracking-widest opacity-60">
            Tap to refresh photo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Personal Info */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-5">
            <h3 className="text-xs font-black text-surface uppercase tracking-widest border-b border-gray-50 pb-3 mb-2">Personal Details</h3>
            {/* Name */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Full Name</label>
              <div className="flex items-center gap-3 bg-[var(--color-hotel-bg)] p-3.5 rounded-2xl focus-within:ring-2 focus-within:ring-surface/10 focus-within:bg-white transition-all border border-transparent focus-within:border-surface/20">
                <User size={18} className="text-surface/40" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="flex-1 text-sm font-bold text-surface outline-none placeholder:text-gray-400 bg-transparent"
                  placeholder="Your Name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Email Address</label>
              <div className="flex items-center gap-3 bg-[var(--color-hotel-bg)] p-3.5 rounded-2xl focus-within:ring-2 focus-within:ring-surface/10 focus-within:bg-white transition-all border border-transparent focus-within:border-surface/20">
                <Mail size={18} className="text-surface/40" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="flex-1 text-sm font-bold text-surface outline-none placeholder:text-gray-400 bg-transparent"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Phone Number</label>
              <div className="flex items-center gap-3 bg-[var(--color-hotel-bg)] p-3.5 rounded-2xl focus-within:ring-2 focus-within:ring-surface/10 focus-within:bg-white transition-all border border-transparent focus-within:border-surface/20">
                <Phone size={18} className="text-surface/40" />
                <input
                  type="tel"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  className="flex-1 text-sm font-bold text-surface outline-none placeholder:text-gray-400 bg-transparent"
                  placeholder="9876543210"
                />
              </div>
            </div>
          </div>


          {/* Section: Address */}
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-2">
              <h3 className="text-xs font-black text-surface uppercase tracking-widest">Address Details</h3>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={fetchingLocation}
                className="flex items-center gap-1.5 text-[10px] font-black text-surface bg-surface/5 px-3 py-1.5 rounded-xl hover:bg-surface/10 active:scale-95 transition-all"
              >
                {fetchingLocation ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                Auto-Detect
              </button>
            </div>

            {/* Address Inputs */}
            <div className="space-y-4">
              {/* Street */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Street Address</label>
                <div className="bg-[var(--color-hotel-bg)] p-3.5 rounded-2xl focus-within:ring-2 focus-within:ring-surface/10 focus-within:bg-white transition-all border border-transparent focus-within:border-surface/20">
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    className="w-full text-sm font-bold text-surface outline-none placeholder:text-gray-400 bg-transparent"
                    placeholder="House No, Street, Area"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">City</label>
                  <div className="bg-[var(--color-hotel-bg)] p-3.5 rounded-2xl focus-within:ring-2 focus-within:ring-surface/10 focus-within:bg-white transition-all border border-transparent focus-within:border-surface/20">
                    <input
                      type="text"
                      value={formData.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className="w-full text-sm font-bold text-surface outline-none placeholder:text-gray-400 bg-transparent"
                      placeholder="City"
                    />
                  </div>
                </div>

                {/* Pincode */}
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Pincode</label>
                  <div className="bg-[var(--color-hotel-bg)] p-3.5 rounded-2xl focus-within:ring-2 focus-within:ring-surface/10 focus-within:bg-white transition-all border border-transparent focus-within:border-surface/20">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={formData.address.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                      className="w-full text-sm font-bold text-surface outline-none placeholder:text-gray-400 bg-transparent"
                      placeholder="000000"
                    />
                  </div>
                </div>
              </div>

              {/* State */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">State</label>
                <div className="bg-[var(--color-hotel-bg)] p-3.5 rounded-2xl focus-within:ring-2 focus-within:ring-surface/10 focus-within:bg-white transition-all border border-transparent focus-within:border-surface/20">
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full text-sm font-bold text-surface outline-none placeholder:text-gray-400 bg-transparent"
                    placeholder="State"
                  />
                </div>
              </div>
            </div>
          </div>


          <button
            type="submit"
            disabled={loading || imageUploading}
            className="w-full bg-surface text-white py-4 rounded-[20px] font-black text-sm shadow-xl shadow-surface/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-widest"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
          </button>
        </form>

        {/* Action Buttons */}
        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 space-y-3">
          <button
            type="button"
            onClick={() => {
              authService.logout();
              navigate('/login', { replace: true });
              toast.success('Logged out successfully');
            }}
            className="w-full flex items-center justify-center gap-2 text-surface font-black text-xs py-4 bg-[var(--color-hotel-bg)] rounded-2xl hover:bg-gray-50 transition-colors uppercase tracking-widest border border-surface/5"
          >
            <LogOut size={16} />
            Logout Session
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center justify-center gap-2 text-red-500 font-black text-[10px] py-4 rounded-2xl hover:bg-red-50 transition-colors uppercase tracking-widest border border-red-100/50"
          >
            <Trash2 size={14} />
            Delete Account
          </button>
          <p className="text-[9px] text-gray-400 text-center px-4 leading-relaxed font-medium">
            Deleting your account is permanent. All your data will be deactivated.
          </p>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-8 overflow-hidden relative shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account?</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  Are you absolutely sure? This action is <span className="text-red-500 font-bold">permanent</span> and will deactivate your account immediately.
                </p>

                <div className="flex flex-col w-full gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading}
                    className="w-full bg-red-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {deleteLoading ? <Loader2 size={18} className="animate-spin" /> : 'Yes, Delete Permanently'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                    className="w-full bg-gray-50 text-gray-600 font-bold py-4 rounded-2xl active:scale-95 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProfileEdit;
