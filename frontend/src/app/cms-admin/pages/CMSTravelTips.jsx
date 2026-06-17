import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload } from 'lucide-react';

const CMSTravelTips = () => {
  const [data, setData] = useState({
    sectionSubtitle: 'PLAN YOUR JOURNEY',
    sectionTitle: 'Premium Travel & Tours',
    description: 'Experience the spiritual awakening of our exclusive Char Dham Yatra packages, or customize your dream destination getaway. We provide end-to-end luxury travel solutions, from comfortable taxi fleets to premium hotel stays.',
    image: '',
    buttonText: 'BOOK CAB NOW',
    bulletPoints: [
      'Custom Tour Packages',
      'Luxury Taxi & Fleet Services',
      'Handpicked Premium Hotels'
    ]
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
      if (res.data?.data?.travelTips) {
        const fetched = res.data.data.travelTips;
        setData({
          sectionSubtitle: fetched.sectionSubtitle || 'PLAN YOUR JOURNEY',
          sectionTitle: fetched.sectionTitle || 'Premium Travel & Tours',
          description: fetched.description || '',
          image: fetched.image || '',
          buttonText: fetched.buttonText || 'BOOK CAB NOW',
          bulletPoints: fetched.bulletPoints?.length > 0 ? fetched.bulletPoints : [
            'Custom Tour Packages',
            'Luxury Taxi & Fleet Services',
            'Handpicked Premium Hotels'
          ]
        });
      }
    } catch (error) {
      toast.error('Failed to load Travel Tips configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { travelTips: data });
      toast.success('Travel Tips section updated successfully!');
    } catch (error) {
      toast.error('Failed to update Travel Tips section');
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
          setData(prev => ({ ...prev, image: url }));
          toast.success('Image uploaded successfully');
        }
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleBulletChange = (index, value) => {
    const updated = [...data.bulletPoints];
    updated[index] = value;
    setData(prev => ({ ...prev, bulletPoints: updated }));
  };

  const handleAddBullet = () => {
    setData(prev => ({ ...prev, bulletPoints: [...prev.bulletPoints, ''] }));
  };

  const handleRemoveBullet = (index) => {
    const updated = data.bulletPoints.filter((_, i) => i !== index);
    setData(prev => ({ ...prev, bulletPoints: updated }));
  };

  if (loading) return <div className="text-sm text-gray-500 p-4">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">Premium Travel &amp; Tours</h2>
        <p className="text-sm text-gray-500">Edit the "Plan Your Journey" section on the landing page — image, title, description, and feature bullets.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-8">

        {/* Section Heading Text */}
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
                placeholder="PLAN YOUR JOURNEY"
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
                placeholder="Premium Travel & Tours"
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
            placeholder="Describe your travel services..."
            className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg border-b pb-2">Section Image (Round Image on Left)</h3>
          <div className="flex items-start gap-6 flex-wrap">
            {data.image ? (
              <div className="flex flex-col items-start gap-3">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 shadow-md">
                  <img src={data.image} alt="Travel Section" className="w-full h-full object-cover" />
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
                  <span className="text-sm text-gray-500">Click to upload section image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
                {uploadingImage && <p className="text-xs text-emerald-600">Uploading...</p>}
              </div>
            )}
          </div>
        </div>

        {/* Button Text */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg border-b pb-2">Button</h3>
          <div className="max-w-sm space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Button Text</label>
            <input
              type="text"
              value={data.buttonText || ''}
              onChange={(e) => setData(prev => ({ ...prev, buttonText: e.target.value }))}
              placeholder="BOOK CAB NOW"
              className="w-full border border-gray-200 p-3 text-sm focus:outline-none focus:border-emerald-500 transition"
            />
            <p className="text-xs text-gray-400">Note: Button will link to the taxi/cab booking page.</p>
          </div>
        </div>

        {/* Bullet Points */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-lg">Feature Bullet Points</h3>
            <button
              type="button"
              onClick={handleAddBullet}
              className="flex items-center gap-2 text-sm text-emerald-600 font-bold hover:text-emerald-800 transition"
            >
              <Plus size={16} /> Add Point
            </button>
          </div>

          {data.bulletPoints && data.bulletPoints.length > 0 ? (
            <div className="space-y-3">
              {data.bulletPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-emerald-600 font-bold text-sm shrink-0">✓</span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleBulletChange(idx, e.target.value)}
                    placeholder={`Feature ${idx + 1}`}
                    className="flex-1 border border-gray-200 p-2.5 text-sm focus:outline-none focus:border-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveBullet(idx)}
                    className="text-gray-400 hover:text-red-500 transition shrink-0"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No bullet points added yet.</p>
          )}
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

export default CMSTravelTips;
