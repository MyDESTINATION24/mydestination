import React, { useState, useEffect } from 'react';
import usePartnerStore from '../store/partnerStore';
import { authService } from '../../../services/apiService';
import { Upload, X, Check, Loader2, Image as ImageIcon, Eye, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { isFlutterApp, openFlutterCamera, uploadBase64Image } from '../../../utils/flutterBridge';

const ImageUploader = ({ label, value, onChange, placeholder = "Upload Image", onView }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [isFlutter, setIsFlutter] = useState(false);

  // Check if running in Flutter app
  useEffect(() => {
    setIsFlutter(isFlutterApp());
    if (isFlutterApp()) {
      console.log('[ImageUploader] Running in Flutter app - Camera enabled');
    }
  }, []);

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle Flutter camera capture
  const handleCameraCapture = async () => {
    if (!isFlutter) {
      setError('Camera only available in mobile app');
      return;
    }

    setError('');
    setUploading(true);

    try {
      console.log('[Camera] Opening Flutter camera...');

      // Open Flutter native camera
      const cameraResult = await openFlutterCamera();

      if (!cameraResult.success || !cameraResult.base64) {
        throw new Error('Camera capture failed');
      }

      console.log('[Camera] Image captured, uploading...');

      // Upload base64 to backend
      const uploadResult = await uploadBase64Image(
        cameraResult.base64,
        cameraResult.mimeType,
        cameraResult.fileName
      );

      if (uploadResult.success && uploadResult.files && uploadResult.files.length > 0) {
        onChange(uploadResult.files[0]);
        console.log('[Camera] Upload success:', uploadResult.files[0].url);
      } else {
        throw new Error('Upload failed');
      }
    } catch (err) {
      console.error('[Camera] Error:', err);
      let msg = 'Camera capture failed';
      if (err?.message) msg = err.message;
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = ''; // Reset input

    if (!file) return;

    console.log('Selected File:', { name: file.name, type: file.type, size: file.size });

    // Validation
    if (file.type && !file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP)');
      return;
    }

    // Max 10MB (Cloudinary free tier limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum 10MB allowed.');
      return;
    }

    setError('');
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('images', file);

      console.log('Uploading file...', file.name);

      const res = await authService.uploadDocs(formData);
      console.log('Upload Response:', res);

      if (res.success && res.files && res.files.length > 0) {
        onChange(res.files[0]);
      } else {
        setError('Upload failed');
      }
    } catch (err) {
      console.error("Upload Error:", err);

      let msg = 'Upload failed. Try again.';

      if (typeof err === 'string') {
        msg = err;
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.message) {
        msg = err.message;
      }

      // Provide specific feedback for common errors
      if (msg.includes('Network Error') || err?.response?.status === 413) {
        msg = 'Upload failed: File may be too large or connection unstable.';
      }

      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = async (e) => {
    e.stopPropagation();
    if (!value?.publicId) {
      onChange({ url: '', publicId: '' });
      return;
    }

    try {
      setUploading(true);
      await authService.deleteDoc(value.publicId);
      onChange({ url: '', publicId: '' });
      setError('');
    } catch (err) {
      console.error("Delete Error:", err);
      onChange({ url: '', publicId: '' });
    } finally {
      setUploading(false);
    }
  };

  const imageUrl = typeof value === 'object' ? value?.url : value;

  return (
    <div className="flex flex-col h-full">
      <label className="block text-xs font-bold text-gray-500 mb-2 truncate">{label}</label>

      {imageUrl ? (
        <div className="relative group h-32 w-full rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shadow-sm">
          <img src={imageUrl} alt={label} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

          {/* Overlay Actions - Always visible for better mobile experience */}
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center gap-3 transition-opacity">
            <button
              onClick={() => onView(imageUrl)}
              className="p-2.5 bg-white/90 rounded-full text-[#0A4720] hover:bg-white transition-colors shadow-lg backdrop-blur-sm"
              title="View Image"
              type="button"
            >
              <Eye size={20} />
            </button>
            <button
              onClick={clearImage}
              disabled={uploading}
              className="p-2.5 bg-white/90 rounded-full text-red-500 hover:bg-white transition-colors shadow-lg backdrop-blur-sm disabled:opacity-50"
              title="Remove Image"
              type="button"
            >
              {uploading ? <Loader2 size={20} className="animate-spin" /> : <X size={20} />}
            </button>
          </div>

        </div>
      ) : (
        <div className="space-y-2">
          {/* Flutter Camera Button */}
          {isFlutter && (
            <button
              type="button"
              onClick={handleCameraCapture}
              disabled={uploading}
              className="w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors border-[#0A4720] bg-[#0A4720]/5 hover:bg-[#0A4720]/10 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={24} className="text-[#0A4720] animate-spin" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0A4720] flex items-center justify-center shadow-sm text-white">
                  <Camera size={20} />
                </div>
              )}
              <div className="text-center">
                <p className="text-xs font-bold text-[#0A4720]">
                  {uploading ? 'Uploading...' : 'Take Photo'}
                </p>
                <p className="text-[10px] text-gray-500 mt-1">Use your camera</p>
              </div>
            </button>
          )}

          {/* File Upload Input */}
          <div className="relative">
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/heic"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={uploading}
            />
            <div className={`
               border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors
               ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-[#0A4720] hover:bg-[#0A4720]/5 bg-gray-50'}
            `}>
              {uploading ? (
                <Loader2 size={24} className="text-[#0A4720] animate-spin" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-gray-400">
                  <Upload size={16} />
                </div>
              )}
              <div className="text-center">
                <p className="text-xs font-bold text-gray-600">
                  {uploading ? 'Uploading...' : placeholder}
                </p>
                {error ? (
                  <p className="text-[10px] text-red-500 mt-1">{error}</p>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-1">{isFlutter ? 'Or select from gallery' : 'Tap to select'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StepOwnerDetails = () => {
  const { formData, updateFormData } = usePartnerStore();
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  const handleAddressChange = (field, value) => {
    updateFormData({
      owner_address: {
        ...(formData.owner_address || {}),
        [field]: value
      }
    });
  };

  const handleFocus = (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Fullscreen Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-xl"
            onClick={() => setPreviewImage(null)}
          >
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-[10000]"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
            >
              <X size={28} />
            </motion.button>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-[95vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
              <div className="absolute -bottom-10 left-0 right-0 text-center text-white/50 text-sm font-medium">
                Tap anywhere outside to close
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Aadhaar Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900">Aadhaar Verification</h3>
          <span className="text-[10px] text-gray-400 font-mono">12 Digits</span>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Aadhaar Number</label>
          <div className="relative">
            <input
              className={`w-full border rounded-xl px-3 py-2.5 text-sm transition-all focus:outline-none tracking-widest font-mono ${
                formData.aadhaar_number
                  ? /^\d{12}$/.test(formData.aadhaar_number)
                    ? 'border-emerald-500 bg-emerald-50/20 text-gray-900 focus:ring-2 focus:ring-emerald-500/20'
                    : 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-2 focus:ring-rose-400/20'
                  : 'border-gray-200 focus:ring-2 focus:ring-[#39593f]/20 focus:border-[#39593f]'
              }`}
              placeholder="12-digit Aadhaar Number"
              maxLength={12}
              onFocus={handleFocus}
              value={formData.aadhaar_number || ''}
              onChange={e => handleChange('aadhaar_number', e.target.value.replace(/\D/g, '').slice(0, 12))}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {formData.aadhaar_number && (
                /^\d{12}$/.test(formData.aadhaar_number) ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-rose-400" />
              )}
            </div>
          </div>
          {formData.aadhaar_number && !/^\d{12}$/.test(formData.aadhaar_number) && (
            <p className="text-[11px] text-rose-500 mt-1 font-medium">
              Aadhaar number must be exactly 12 numeric digits ({12 - (formData.aadhaar_number?.length || 0)} digits remaining)
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <ImageUploader
            label="Aadhaar Front Image"
            value={formData.aadhaar_front}
            onChange={(url) => handleChange('aadhaar_front', url)}
            onView={setPreviewImage}
            placeholder="Front Side"
          />
          <ImageUploader
            label="Aadhaar Back Image"
            value={formData.aadhaar_back}
            onChange={(url) => handleChange('aadhaar_back', url)}
            onView={setPreviewImage}
            placeholder="Back Side"
          />
        </div>
      </div>

      {/* PAN Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900">PAN Verification</h3>
          <span className="text-[10px] text-gray-400 font-mono">Format: ABCDE1234F</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">PAN Card Number</label>
            <div className="relative">
              <input
                className={`w-full border rounded-xl px-3 py-2.5 text-sm uppercase transition-all focus:outline-none font-mono tracking-widest ${
                  formData.pan_number
                    ? /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)
                      ? 'border-emerald-500 bg-emerald-50/20 text-gray-900 focus:ring-2 focus:ring-emerald-500/20'
                      : 'border-rose-400 bg-rose-50/20 text-rose-900 focus:ring-2 focus:ring-rose-400/20'
                    : 'border-gray-200 focus:ring-2 focus:ring-[#39593f]/20 focus:border-[#39593f]'
                }`}
                placeholder="ABCDE1234F"
                maxLength={10}
                onFocus={handleFocus}
                value={formData.pan_number || ''}
                onChange={e => {
                  const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                  handleChange('pan_number', val.slice(0, 10));
                }}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                {formData.pan_number && (
                  /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number) ? <CheckCircle2 size={16} className="text-emerald-500" /> : <AlertCircle size={16} className="text-rose-400" />
                )}
              </div>
            </div>
            {formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number) && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">
                PAN must be 10 characters (5 letters, 4 numbers, 1 letter e.g. ABCDE1234F)
              </p>
            )}
          </div>
          <ImageUploader
            label="PAN Card Image"
            value={formData.pan_card_image}
            onChange={(url) => handleChange('pan_card_image', url)}
            onView={setPreviewImage}
            placeholder="Upload PAN"
          />
        </div>
      </div>

    </div>
  );
};

export default StepOwnerDetails;
