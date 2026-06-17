import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

const CMSEssentialAccessories = () => {
  const [data, setData] = useState({
    sectionSubtitle: 'PREPARE FOR YOUR TRIP',
    sectionTitle: 'Essential Accessories',
    description: "Don't forget to pack the essentials! From capturing beautiful moments with your camera, protecting your eyes with sunglasses, to carrying your belongings safely. We ensure you're fully prepared for the journey ahead.",
    backgroundImage: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiService.get('/cms/landing-page');
      if (res.data?.data?.essentialAccessories) {
        const fetched = res.data.data.essentialAccessories;
        setData({
          sectionSubtitle: fetched.sectionSubtitle || 'PREPARE FOR YOUR TRIP',
          sectionTitle: fetched.sectionTitle || 'Essential Accessories',
          description: fetched.description || '',
          backgroundImage: fetched.backgroundImage || ''
        });
      }
    } catch (error) {
      toast.error('Failed to load Essential Accessories configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { essentialAccessories: data });
      toast.success('Essential Accessories section updated successfully!');
    } catch (error) {
      toast.error('Failed to update Essential Accessories section');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('images', file);
    formData.append('type', 'landing_page');
    setUploadingImage(true);
    try {
      const res = await adminService.uploadImage(formData);
      if (res.success) {
        const url = res.url || (res.files && res.files[0]?.url);
        if (url) {
          setData(prev => ({ ...prev, backgroundImage: url }));
          toast.success('Background image uploaded successfully');
        }
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 p-4">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Essential Accessories Section</h2>
        <p className="text-sm text-gray-500">Edit the "Prepare for your trip" section on the landing page — title, subtitle, description, and background map image.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-8">
        
        {/* Headings */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Section Headings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Section Subtitle (small label above title)
              </label>
              <input
                type="text"
                value={data.sectionSubtitle || ''}
                onChange={(e) => setData(prev => ({ ...prev, sectionSubtitle: e.target.value }))}
                placeholder="PREPARE FOR YOUR TRIP"
                className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Section Title (main heading)
              </label>
              <input
                type="text"
                value={data.sectionTitle || ''}
                onChange={(e) => setData(prev => ({ ...prev, sectionTitle: e.target.value }))}
                placeholder="Essential Accessories"
                className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg border-b pb-2">Description</h3>
          <textarea
            rows={4}
            value={data.description || ''}
            onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe travel accessories..."
            className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Background Image */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg border-b pb-2">Map Background Image</h3>
          <div className="flex items-start gap-6 flex-wrap">
            {data.backgroundImage ? (
              <div className="flex flex-col items-start gap-3">
                <div className="w-64 h-32 overflow-hidden border border-gray-200 shadow-md rounded-sm">
                  <img src={data.backgroundImage} alt="Map Background" className="w-full h-full object-cover" />
                </div>
                <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-sm text-xs font-bold transition flex items-center gap-2">
                  <Upload size={14} /> Change Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {uploadingImage && <p className="text-xs text-emerald-600">Uploading...</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="cursor-pointer flex items-center gap-3 border-2 border-dashed border-gray-300 p-6 rounded-sm hover:border-emerald-400 transition">
                  <Upload size={20} className="text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload map background image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {uploadingImage && <p className="text-xs text-emerald-600">Uploading...</p>}
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 text-white px-8 py-3 text-sm font-bold tracking-widest uppercase hover:bg-emerald-700 transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CMSEssentialAccessories;
