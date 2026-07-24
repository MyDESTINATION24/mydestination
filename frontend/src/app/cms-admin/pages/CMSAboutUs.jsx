import React, { useState, useEffect } from 'react';
import { api as apiService } from '../../../services/apiService';
import adminService from '../../../services/adminService';
import toast from 'react-hot-toast';
import { Plus, Trash2, Upload } from 'lucide-react';
import RichTextEditor from '../../../components/common/RichTextEditor';

const CMSAboutUs = () => {
  const [data, setData] = useState({
    sectionSubtitle: 'our featured story',
    sectionTitle: 'ABOUT US',
    mainImage: '',
    sideImage: '',
    milestones: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingSideImage, setUploadingSideImage] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await apiService.get('/cms/landing-page');
      if (res.data?.data?.aboutUs) {
        const fetched = res.data.data.aboutUs;
        setData({
          sectionSubtitle: fetched.sectionSubtitle || 'our featured story',
          sectionTitle: fetched.sectionTitle || 'ABOUT US',
          mainImage: fetched.mainImage || '',
          sideImage: fetched.sideImage || '',
          milestones: fetched.milestones || []
        });
      }
    } catch (error) {
      toast.error('Failed to load About Us configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiService.put('/cms/landing-page', { aboutUs: data });
      toast.success('About Us section updated successfully!');
    } catch (error) {
      toast.error('Failed to update About Us section');
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
          setData(prev => ({ ...prev, mainImage: url }));
          toast.success('Image uploaded successfully');
        }
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSideImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('images', file);
    formData.append('type', 'landing_page');
    setUploadingSideImage(true);
    try {
      const res = await adminService.uploadImage(formData);
      if (res.success) {
        const url = res.url || (res.files && res.files[0]?.url);
        if (url) {
          setData(prev => ({ ...prev, sideImage: url }));
          toast.success('Backpack image uploaded successfully');
        }
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingSideImage(false);
    }
  };

  const handleMilestoneChange = (index, field, value) => {
    const updated = [...data.milestones];
    updated[index][field] = value;
    setData(prev => ({ ...prev, milestones: updated }));
  };

  const handleAddMilestone = () => {
    setData(prev => ({ ...prev, milestones: [...prev.milestones, { title: '', description: '' }] }));
  };

  const handleRemoveMilestone = (index) => {
    const updated = data.milestones.filter((_, i) => i !== index);
    setData(prev => ({ ...prev, milestones: updated }));
  };

  if (loading) return <div className="text-sm text-gray-500 p-4">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900 tracking-widest uppercase">About Us Section</h2>
        <p className="text-sm text-gray-500">Edit the "About Us" section on the landing page — title, subtitle, main beach image, right side image, and milestones details.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 md:p-8 rounded-sm border border-gray-200 shadow-sm space-y-8">
        
        {/* Headings */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Section Headings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Section Subtitle
              </label>
              <RichTextEditor
                value={data.sectionSubtitle || ''}
                onChange={(val) => setData(prev => ({ ...prev, sectionSubtitle: val }))}
                placeholder="our featured story"
                minHeight="90px"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Section Title
              </label>
              <RichTextEditor
                value={data.sectionTitle || ''}
                onChange={(val) => setData(prev => ({ ...prev, sectionTitle: val }))}
                placeholder="ABOUT US"
                minHeight="90px"
              />
            </div>
          </div>
        </div>

        {/* Images grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Main Image Upload */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg border-b pb-2">Main Beach Image (Left Side)</h3>
            <div className="flex items-start gap-6 flex-wrap">
              {data.mainImage ? (
                <div className="flex flex-col items-start gap-3">
                  <div className="w-48 h-48 overflow-hidden border border-gray-200 shadow-md rounded-sm">
                    <img src={data.mainImage} alt="About Beach" className="w-full h-full object-cover" />
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
                    <span className="text-sm text-gray-500">Click to upload beach image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  {uploadingImage && <p className="text-xs text-emerald-600">Uploading...</p>}
                </div>
              )}
            </div>
          </div>

          {/* Side Image Upload */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg border-b pb-2">Side Item Image (Right Side)</h3>
            <div className="flex items-start gap-6 flex-wrap">
              {data.sideImage ? (
                <div className="flex flex-col items-start gap-3">
                  <div className="w-48 h-48 overflow-hidden border border-gray-200 shadow-md rounded-sm bg-gray-50 flex items-center justify-center p-2">
                    <img src={data.sideImage} alt="Backpack" className="max-h-full max-w-full object-contain" />
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-sm text-xs font-bold transition flex items-center gap-2">
                    <Upload size={14} /> Change Image
                    <input type="file" accept="image/*" className="hidden" onChange={handleSideImageUpload} />
                  </label>
                  {uploadingSideImage && <p className="text-xs text-emerald-600">Uploading...</p>}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="cursor-pointer flex items-center gap-3 border-2 border-dashed border-gray-300 p-6 rounded-sm hover:border-emerald-400 transition">
                    <Upload size={20} className="text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload side image</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleSideImageUpload} />
                  </label>
                  {uploadingSideImage && <p className="text-xs text-emerald-600">Uploading...</p>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-lg">Milestones & Achievements</h3>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="flex items-center gap-2 text-sm text-emerald-600 font-bold hover:text-emerald-800 transition"
            >
              <Plus size={16} /> Add Milestone
            </button>
          </div>

          {data.milestones && data.milestones.length > 0 ? (
            <div className="space-y-6">
              {data.milestones.map((item, idx) => (
                <div key={idx} className="border border-gray-200 p-4 rounded-sm bg-gray-50 relative space-y-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveMilestone(idx)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition z-10"
                    title="Remove milestone"
                  >
                    <Trash2 size={18} />
                  </button>

                  <h4 className="font-bold text-sm text-emerald-700">Milestone {idx + 1}</h4>
                  
                  <div className="grid grid-cols-1 gap-4 pr-8">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Title</label>
                      <RichTextEditor
                        value={item.title || ''}
                        onChange={(val) => handleMilestoneChange(idx, 'title', val)}
                        placeholder="e.g. Our never ending footsteps"
                        minHeight="90px"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Description</label>
                      <RichTextEditor
                        value={item.description || ''}
                        onChange={(val) => handleMilestoneChange(idx, 'description', val)}
                        placeholder="Milestone description..."
                        minHeight="110px"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 italic">No milestones added yet.</p>
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

export default CMSAboutUs;
